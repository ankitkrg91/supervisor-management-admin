import { useRef, useState } from "react";
import {
    Upload,
    FileSpreadsheet,
    Download,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";
import "./CancelBulkTask.css";

const REQUIRED_COLUMN = "taskId";

const COLUMN_ALIASES = [
    "taskid",
    "task id",
    "id",
    "task identifier",
    "task uuid",
];

const normalizeHeader = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const findTaskIdColumn = (headers) => {
    return headers.find((header) => {
        const normalized = normalizeHeader(header);

        return (
            COLUMN_ALIASES.includes(normalized) ||
            COLUMN_ALIASES.includes(normalized.replace(/\s+/g, ""))
        );
    });
};

const CancelBulkTask = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [result, setResult] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        setUploadStatus("");
        setResult(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const extension = file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        if (!["xlsx", "xls"].includes(extension)) {
            setSelectedFile(null);
            setUploadStatus(
                "Please select a valid Excel file (.xlsx or .xls)."
            );
            return;
        }

        setSelectedFile(file);
    };

    const parseExcelFile = async (file) => {
        const arrayBuffer = await file.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, {
            type: "array",
            cellDates: true,
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
            throw new Error(
                "The Excel file does not contain a worksheet."
            );
        }

        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: true,
        });

        if (!rows.length) {
            throw new Error("The Excel file is empty.");
        }

        const headers = Object.keys(rows[0]);

        const taskIdColumn = findTaskIdColumn(headers);

        if (!taskIdColumn) {
            throw new Error(
                `Missing required Excel column: ${REQUIRED_COLUMN}`
            );
        }

        const taskIds = [];
        const frontendFailedRows = [];

        rows.forEach((row, index) => {
            const excelRowNumber = index + 2;

            const taskId = String(
                row[taskIdColumn] ?? ""
            ).trim();

            // Ignore completely empty rows.
            if (!taskId) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title: "—",
                    error: "Task ID is required",
                });

                return;
            }

            taskIds.push({
                taskId,
                row: excelRowNumber,
            });
        });

        if (!taskIds.length) {
            throw new Error(
                "No valid task IDs were found in the Excel file."
            );
        }

        if (taskIds.length > 500) {
            throw new Error(
                "Maximum 500 tasks can be cancelled at once."
            );
        }

        return {
            taskIds,
            frontendFailedRows,
        };
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus(
                "Please select an Excel file first."
            );
            return;
        }

        try {
            setLoading(true);
            setUploadStatus("");
            setResult(null);

            const {
                taskIds,
                frontendFailedRows,
            } = await parseExcelFile(selectedFile);

            const response = await apiFetch(
                "/api/tasks/bulk-cancel",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tasks: taskIds,
                    }),
                }
            );

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid response received from the server."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Bulk cancellation failed."
                );
            }

            const backendResult = data?.data || {};

            setResult({
                ...backendResult,
                successful:
                    Number(
                        backendResult.successful || 0
                    ),
                failed:
                    Number(
                        backendResult.failed || 0
                    ) + frontendFailedRows.length,
                total:
                    Number(
                        backendResult.total || 0
                    ) + frontendFailedRows.length,
                frontendFailedRows,
            });

            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setUploadStatus(
                "Bulk cancellation processed successfully."
            );

            window.dispatchEvent(
                new CustomEvent("tasks-updated")
            );
        } catch (error) {
            console.error(
                "Bulk cancellation error:",
                error
            );

            setUploadStatus(
                error?.message ||
                "Failed to cancel bulk tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFormat = () => {
        const worksheetData = [
            ["taskId"],
            ["PASTE-TASK-UUID-HERE"],
        ];

        const worksheet =
            XLSX.utils.aoa_to_sheet(
                worksheetData
            );

        worksheet["!cols"] = [
            { wch: 42 },
        ];

        const instructionsData = [
            ["Cancel Bulk Task Instructions"],
            [""],
            ["Required column"],
            [
                "taskId",
                "UUID of the task that should be cancelled",
            ],
            [""],
            ["Rules"],
            [
                "Only existing tasks can be cancelled",
            ],
            [
                "Completed tasks cannot be cancelled",
            ],
            [
                "Already cancelled tasks cannot be cancelled again",
            ],
            [
                "Only Super Admin can perform bulk cancellation",
            ],
            [""],
            ["Maximum rows", "500 tasks per upload"],
        ];

        const instructionsSheet =
            XLSX.utils.aoa_to_sheet(
                instructionsData
            );

        instructionsSheet["!cols"] = [
            { wch: 32 },
            { wch: 70 },
        ];

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Cancel Tasks"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            instructionsSheet,
            "Instructions"
        );

        XLSX.writeFile(
            workbook,
            "cancel-bulk-task-format.xlsx"
        );
    };

    const handleClear = () => {
        setSelectedFile(null);
        setUploadStatus("");
        setResult(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const combinedFailedRows = [
        ...(result?.frontendFailedRows || []),
        ...(result?.failedTasks || []),
    ];

    return (
        <div className="cancel-bulk-task-page">
            <section className="cancel-bulk-task-card">
                <div className="cancel-bulk-task-header">
                    <div>
                        <h1>Cancel Bulk Task</h1>
                        <p>
                            Upload an Excel file to cancel
                            multiple scheduled tasks at once.
                        </p>
                    </div>

                    <div className="cancel-bulk-task-icon">
                        <FileSpreadsheet size={25} />
                    </div>
                </div>

                <div className="cancel-bulk-task-divider" />

                <div className="cancel-bulk-format-row">
                    <div>
                        <h3>Excel Format</h3>

                        <p>
                            Download the template and enter
                            the task IDs that need to be
                            cancelled.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="cancel-bulk-download-button"
                        onClick={handleDownloadFormat}
                        disabled={loading}
                    >
                        <Download size={17} />
                        DOWNLOAD FORMAT
                    </button>
                </div>

                <div className="cancel-bulk-upload-box">
                    <div className="cancel-bulk-upload-content">
                        <Upload size={28} />

                        <h3>Select Excel File</h3>

                        <p>
                            Upload the completed Cancel
                            Bulk Task Excel template.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="cancel-bulk-file-input"
                        />

                        <button
                            type="button"
                            className="cancel-bulk-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={loading}
                        >
                            CHOOSE FILE
                        </button>

                        <span className="cancel-bulk-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </span>
                    </div>
                </div>

                <div className="cancel-bulk-warning">
                    <AlertTriangle size={19} />

                    <div>
                        <strong>
                            Before cancelling
                        </strong>

                        <p>
                            Completed and already cancelled
                            tasks cannot be cancelled.
                        </p>
                    </div>
                </div>

                {uploadStatus && (
                    <div className="cancel-bulk-status">
                        {uploadStatus}
                    </div>
                )}

                {result && (
                    <section className="cancel-bulk-result">
                        <div className="cancel-bulk-result-header">
                            <CheckCircle size={20} />

                            <h3>
                                Bulk Cancellation Result
                            </h3>
                        </div>

                        <div className="cancel-bulk-stats">
                            <div>
                                <strong>Total</strong>

                                <div>
                                    {result.total}
                                </div>
                            </div>

                            <div>
                                <strong>
                                    Successful
                                </strong>

                                <div>
                                    {result.successful}
                                </div>
                            </div>

                            <div>
                                <strong>
                                    Failed
                                </strong>

                                <div>
                                    {result.failed}
                                </div>
                            </div>
                        </div>

                        {combinedFailedRows.length > 0 ? (
                            <div>
                                <h4>Failed Rows</h4>

                                <div className="cancel-bulk-failed-table-wrapper">
                                    <table className="cancel-bulk-failed-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Row
                                                </th>

                                                <th>
                                                    Task ID
                                                </th>

                                                <th>
                                                    Error
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {combinedFailedRows.map(
                                                (
                                                    item,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={`${item.row}-${index}`}
                                                    >
                                                        <td>
                                                            {
                                                                item.row
                                                            }
                                                        </td>

                                                        <td>
                                                            {item.taskId ||
                                                                "—"}
                                                        </td>

                                                        <td>
                                                            {
                                                                item.error
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="cancel-bulk-success-message">
                                <CheckCircle size={18} />

                                <span>
                                    All tasks were cancelled
                                    successfully.
                                </span>
                            </div>
                        )}
                    </section>
                )}

                <div className="cancel-bulk-actions">
                    <button
                        type="button"
                        className="cancel-bulk-clear-button"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="cancel-bulk-upload-button"
                        onClick={handleUpload}
                        disabled={
                            loading ||
                            !selectedFile
                        }
                    >
                        <Upload size={17} />

                        {loading
                            ? "PROCESSING..."
                            : "UPLOAD & CANCEL TASKS"}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default CancelBulkTask;
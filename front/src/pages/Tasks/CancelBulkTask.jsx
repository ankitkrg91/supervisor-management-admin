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

const REQUIRED_COLUMNS = [
    "title",
    "scheduledAt",
    "supervisorEmail",
    "siteCode",
];

const COLUMN_ALIASES = {
    title: [
        "title",
        "task title",
    ],

    scheduledAt: [
        "scheduledat",
        "scheduled at",
        "scheduled date",
        "schedule date",
        "scheduled time",
    ],

    supervisorEmail: [
        "supervisoremail",
        "supervisor email",
        "assigned supervisor email",
        "supervisor",
    ],

    siteCode: [
        "sitecode",
        "site code",
        "site",
        "site name",
    ],

    clientEmail: [
        "clientemail",
        "client email",
        "customer email",
    ],
};

const normalizeHeader = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const findColumnKey = (headers, aliases) => {
    return headers.find((header) => {
        const normalizedHeader =
            normalizeHeader(header);

        const compactHeader =
            normalizedHeader.replace(/\s+/g, "");

        return (
            aliases.includes(normalizedHeader) ||
            aliases.includes(compactHeader)
        );
    });
};

const getExcelDateAsISO = (value) => {
    if (
        value instanceof Date &&
        !Number.isNaN(value.getTime())
    ) {
        return value.toISOString();
    }

    if (typeof value === "number") {
        const parsed =
            XLSX.SSF.parse_date_code(value);

        if (!parsed) {
            return "";
        }

        const date = new Date(
            Date.UTC(
                parsed.y,
                parsed.m - 1,
                parsed.d,
                parsed.H || 0,
                parsed.M || 0,
                parsed.S || 0
            )
        );

        return Number.isNaN(date.getTime())
            ? ""
            : date.toISOString();
    }

    const text =
        String(value ?? "").trim();

    if (!text) {
        return "";
    }

    const parsedDate =
        new Date(text);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "";
    }

    return parsedDate.toISOString();
};

const CancelBulkTask = () => {
    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [uploadStatus, setUploadStatus] =
        useState("");

    const [result, setResult] =
        useState(null);

    const fileInputRef =
        useRef(null);

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        setUploadStatus("");
        setResult(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase();

        if (
            !["xlsx", "xls"].includes(
                extension
            )
        ) {
            setSelectedFile(null);

            setUploadStatus(
                "Please select a valid Excel file (.xlsx or .xls)."
            );

            return;
        }

        setSelectedFile(file);
    };

    const parseExcelFile = async (file) => {
        const arrayBuffer =
            await file.arrayBuffer();

        const workbook =
            XLSX.read(arrayBuffer, {
                type: "array",
                cellDates: true,
            });

        const firstSheetName =
            workbook.SheetNames[0];

        if (!firstSheetName) {
            throw new Error(
                "The Excel file does not contain a worksheet."
            );
        }

        const worksheet =
            workbook.Sheets[
            firstSheetName
            ];

        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: "",
                    raw: true,
                }
            );

        if (!rows.length) {
            throw new Error(
                "The Excel file is empty."
            );
        }

        const headers =
            Object.keys(rows[0]);

        const columnMap = {};

        for (
            const field of Object.keys(
                COLUMN_ALIASES
            )
        ) {
            const matchedColumn =
                findColumnKey(
                    headers,
                    COLUMN_ALIASES[field]
                );

            if (matchedColumn) {
                columnMap[field] =
                    matchedColumn;
            }
        }

        const missingColumns =
            REQUIRED_COLUMNS.filter(
                (column) =>
                    !columnMap[column]
            );

        if (missingColumns.length) {
            throw new Error(
                `Missing required Excel columns: ${missingColumns.join(
                    ", "
                )}. Required format: title, scheduledAt, supervisorEmail, siteCode.`
            );
        }

        const tasks = [];
        const frontendFailedRows = [];

        rows.forEach((row, index) => {
            const excelRowNumber =
                index + 2;

            const title =
                String(
                    row[
                    columnMap.title
                    ] ?? ""
                ).trim();

            const scheduledAt =
                getExcelDateAsISO(
                    row[
                    columnMap.scheduledAt
                    ]
                );

            const supervisorEmail =
                String(
                    row[
                    columnMap
                        .supervisorEmail
                    ] ?? ""
                ).trim();

            const siteCode =
                String(
                    row[
                    columnMap.siteCode
                    ] ?? ""
                ).trim();

            const clientEmail =
                columnMap.clientEmail
                    ? String(
                        row[
                        columnMap
                            .clientEmail
                        ] ?? ""
                    ).trim()
                    : "";

            const isBlankRow =
                !title &&
                !scheduledAt &&
                !supervisorEmail &&
                !siteCode;

            if (isBlankRow) {
                return;
            }

            if (!title) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title: "",
                    error:
                        "Title is required",
                });

                return;
            }

            if (!scheduledAt) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title,
                    error:
                        "Invalid or missing scheduled date",
                });

                return;
            }

            if (!supervisorEmail) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title,
                    error:
                        "Supervisor Email is required",
                });

                return;
            }

            if (!siteCode) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title,
                    error:
                        "Site Code is required",
                });

                return;
            }

            if (clientEmail) {
                const emailRegex =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (
                    !emailRegex.test(
                        clientEmail
                    )
                ) {
                    frontendFailedRows.push({
                        row: excelRowNumber,
                        title,
                        error:
                            "Invalid client email",
                    });

                    return;
                }
            }

            tasks.push({
                title,
                scheduledAt,
                supervisorEmail,
                siteCode,
                clientEmail:
                    clientEmail || null,
            });
        });

        if (!tasks.length) {
            throw new Error(
                "No valid task rows were found in the Excel file."
            );
        }

        if (tasks.length > 500) {
            throw new Error(
                "Maximum 500 tasks can be cancelled at once."
            );
        }

        return {
            tasks,
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
                tasks,
                frontendFailedRows,
            } =
                await parseExcelFile(
                    selectedFile
                );

            const response =
                await apiFetch(
                    "/api/tasks/bulk-cancel",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            tasks,
                        }),
                    }
                );

            let data;

            try {
                data =
                    await response.json();
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

            const backendResult =
                data?.data || {};

            setResult({
                ...backendResult,

                successful:
                    Number(
                        backendResult.successful ||
                        0
                    ),

                failed:
                    Number(
                        backendResult.failed ||
                        0
                    ) +
                    frontendFailedRows.length,

                total:
                    Number(
                        backendResult.total ||
                        0
                    ) +
                    frontendFailedRows.length,

                frontendFailedRows,
            });

            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value =
                    "";
            }

            setUploadStatus(
                "Bulk cancellation processed successfully."
            );

            window.dispatchEvent(
                new CustomEvent(
                    "tasks-updated"
                )
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
            [
                "title",
                "scheduledAt",
                "supervisorEmail",
                "siteCode",
                "clientEmail",
            ],

            [
                "Morning Site Inspection",
                "2026-09-20T09:00:00.000Z",
                "supervisor@example.com",
                "SITE-001",
                "client@example.com",
            ],
        ];

        const worksheet =
            XLSX.utils.aoa_to_sheet(
                worksheetData
            );

        worksheet["!cols"] = [
            { wch: 32 },
            { wch: 30 },
            { wch: 38 },
            { wch: 20 },
            { wch: 34 },
        ];

        const instructionsData = [
            [
                "Cancel Bulk Task Instructions",
            ],

            [""],

            ["Required columns"],

            [
                "title",
                "Exact task title",
            ],

            [
                "scheduledAt",
                "Exact scheduled date/time",
            ],

            [
                "supervisorEmail",
                "Email of the assigned Supervisor",
            ],

            [
                "siteCode",
                "Site Code of the task",
            ],

            [""],

            ["Optional column"],

            [
                "clientEmail",
                "Can be used when duplicate tasks exist",
            ],

            [""],

            ["Important"],

            [
                "No Task UUID is required.",
            ],

            [
                "Supervisor Email and Site Code are automatically resolved by the backend.",
            ],

            [
                "The task must match title + scheduledAt + supervisorEmail + siteCode.",
            ],

            [
                "If multiple matching tasks exist, cancellation will fail for that row to avoid cancelling the wrong task.",
            ],

            [
                "Completed and already cancelled tasks cannot be cancelled.",
            ],

            [""],

            [
                "Maximum rows",
                "500 tasks per upload",
            ],
        ];

        const instructionsSheet =
            XLSX.utils.aoa_to_sheet(
                instructionsData
            );

        instructionsSheet["!cols"] = [
            { wch: 32 },
            { wch: 90 },
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
            fileInputRef.current.value =
                "";
        }
    };

    const combinedFailedRows = [
        ...(result?.frontendFailedRows ||
            []),

        ...(result?.failedTasks || []),
    ];

    return (
        <div className="cancel-bulk-task-page">
            <section className="cancel-bulk-task-card">
                <div className="cancel-bulk-task-header">
                    <div>
                        <h1>
                            Cancel Bulk Task
                        </h1>

                        <p>
                            Upload an Excel file to
                            cancel multiple tasks at
                            once.
                        </p>
                    </div>

                    <div className="cancel-bulk-task-icon">
                        <FileSpreadsheet
                            size={25}
                        />
                    </div>
                </div>

                <div className="cancel-bulk-task-divider" />

                <div className="cancel-bulk-format-row">
                    <div>
                        <h3>
                            Excel Format
                        </h3>

                        <p>
                            Download the template and
                            enter task details. No UUID
                            is required.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="cancel-bulk-download-button"
                        onClick={
                            handleDownloadFormat
                        }
                        disabled={loading}
                    >
                        <Download
                            size={17}
                        />

                        DOWNLOAD FORMAT
                    </button>
                </div>

                <div className="cancel-bulk-upload-box">
                    <div className="cancel-bulk-upload-content">
                        <Upload size={28} />

                        <h3>
                            Select Excel File
                        </h3>

                        <p>
                            Upload the completed Cancel
                            Bulk Task Excel template.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={
                                handleFileChange
                            }
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
                    <AlertTriangle
                        size={19}
                    />

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
                            <CheckCircle
                                size={20}
                            />

                            <h3>
                                Bulk Cancellation Result
                            </h3>
                        </div>

                        <div className="cancel-bulk-stats">
                            <div>
                                <strong>
                                    Total
                                </strong>

                                <div>
                                    {result.total}
                                </div>
                            </div>

                            <div>
                                <strong>
                                    Successful
                                </strong>

                                <div>
                                    {
                                        result.successful
                                    }
                                </div>
                            </div>

                            <div>
                                <strong>
                                    Failed
                                </strong>

                                <div>
                                    {
                                        result.failed
                                    }
                                </div>
                            </div>
                        </div>

                        {combinedFailedRows.length >
                            0 ? (
                            <div>
                                <h4>
                                    Failed Rows
                                </h4>

                                <div className="cancel-bulk-failed-table-wrapper">
                                    <table className="cancel-bulk-failed-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Row
                                                </th>

                                                <th>
                                                    Title
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
                                                            {
                                                                item.title ||
                                                                "—"
                                                            }
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
                                <CheckCircle
                                    size={18}
                                />

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
                        onClick={
                            handleClear
                        }
                        disabled={loading}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="cancel-bulk-upload-button"
                        onClick={
                            handleUpload
                        }
                        disabled={
                            loading ||
                            !selectedFile
                        }
                    >
                        <Upload
                            size={17}
                        />

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
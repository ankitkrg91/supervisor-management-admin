import { useEffect, useRef, useState } from "react";

import {
    Upload,
    FileSpreadsheet,
    Download,
    UserRound,
    ArrowRightLeft,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./ReassignBulkTask.css";

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

const ReassignBulkTask = () => {
    const [selectedFile, setSelectedFile] =
        useState(null);

    const [assignedTo, setAssignedTo] =
        useState("");

    const [supervisors, setSupervisors] =
        useState([]);

    const [loadingSupervisors, setLoadingSupervisors] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [status, setStatus] =
        useState("");

    const [result, setResult] =
        useState(null);

    const fileInputRef =
        useRef(null);

    const fetchSupervisors = async () => {
        try {
            setLoadingSupervisors(true);
            setStatus("");

            const response =
                await apiFetch("/api/users");

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load supervisors"
                );
            }

            const users =
                data?.data?.users ||
                data?.users ||
                [];

            const activeSupervisors =
                users.filter(
                    (user) =>
                        user?.role ===
                        "SUPERVISOR" &&
                        user?.status ===
                        "ACTIVE"
                );

            setSupervisors(
                activeSupervisors
            );
        } catch (error) {
            console.error(
                "Failed to load supervisors:",
                error
            );

            setStatus(
                error?.message ||
                "Failed to load supervisors"
            );
        } finally {
            setLoadingSupervisors(false);
        }
    };

    useEffect(() => {
        fetchSupervisors();
    }, []);

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        setStatus("");
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

            setStatus(
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
                    columnMap
                        .scheduledAt
                    ]
                );

            const supervisorEmail =
                String(
                    row[
                    columnMap
                        .supervisorEmail
                    ] ?? ""
                )
                    .trim()
                    .toLowerCase();

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
                    )
                        .trim()
                        .toLowerCase()
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
                row: excelRowNumber,
            });
        });

        if (!tasks.length) {
            throw new Error(
                "No valid task rows were found in the Excel file."
            );
        }

        if (tasks.length > 500) {
            throw new Error(
                "Maximum 500 tasks can be reassigned at once."
            );
        }

        return {
            tasks,
            frontendFailedRows,
        };
    };

    const handleReassign = async () => {
        if (!selectedFile) {
            setStatus(
                "Please select an Excel file first."
            );
            return;
        }

        if (!assignedTo) {
            setStatus(
                "Please select a supervisor."
            );
            return;
        }

        try {
            setLoading(true);
            setStatus("");
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
                    "/api/tasks/bulk-reassign",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            tasks,
                            assignedToId:
                                assignedTo,
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
                    "Bulk task reassignment failed."
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

            setAssignedTo("");

            setStatus(
                "Bulk task reassignment processed successfully."
            );

            window.dispatchEvent(
                new CustomEvent(
                    "tasks-updated"
                )
            );
        } catch (error) {
            console.error(
                "Bulk reassignment error:",
                error
            );

            setStatus(
                error?.message ||
                "Failed to reassign bulk tasks."
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
                "Reassign Bulk Task Instructions",
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
                "Current assigned Supervisor email",
            ],

            [
                "siteCode",
                "Site Code of the task",
            ],

            [""],

            ["Optional column"],

            [
                "clientEmail",
                "Use this when multiple identical tasks exist",
            ],

            [""],

            ["Rules"],

            [
                "No Task UUID is required.",
            ],

            [
                "Supervisor Email and Site Code are resolved automatically.",
            ],

            [
                "Completed tasks cannot be reassigned.",
            ],

            [
                "Cancelled tasks cannot be reassigned.",
            ],

            [
                "The selected target Supervisor must be active.",
            ],

            [
                "If multiple matching tasks exist, add clientEmail to identify the correct task.",
            ],

            [
                "Only Super Admin can perform bulk reassignment.",
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
            { wch: 38 },
            { wch: 90 },
        ];

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Reassign Tasks"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            instructionsSheet,
            "Instructions"
        );

        XLSX.writeFile(
            workbook,
            "reassign-bulk-task-format.xlsx"
        );
    };

    const handleClear = () => {
        setSelectedFile(null);
        setAssignedTo("");
        setStatus("");
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
        <div className="reassign-bulk-task-page">
            <section className="reassign-bulk-task-card">

                <div className="reassign-bulk-header">
                    <div>
                        <h1>
                            Reassign Bulk Task
                        </h1>

                        <p>
                            Reassign multiple existing
                            tasks to another supervisor.
                        </p>
                    </div>

                    <div className="reassign-bulk-icon">
                        <ArrowRightLeft
                            size={25}
                        />
                    </div>
                </div>

                <div className="reassign-bulk-divider" />

                <div className="reassign-bulk-format-row">
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
                        className="reassign-download-button"
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

                <div className="reassign-upload-box">
                    <div className="reassign-upload-content">

                        <FileSpreadsheet
                            size={30}
                        />

                        <h3>
                            Select Excel File
                        </h3>

                        <p>
                            Upload the completed
                            Reassign Bulk Task
                            Excel template.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={
                                handleFileChange
                            }
                            className="reassign-file-input"
                        />

                        <button
                            type="button"
                            className="reassign-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={loading}
                        >
                            CHOOSE FILE
                        </button>

                        <span className="reassign-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </span>
                    </div>
                </div>

                <div className="reassign-user-section">
                    <div className="reassign-user-title">
                        <UserRound
                            size={19}
                        />

                        <div>
                            <h3>
                                Reassign To
                            </h3>

                            <p>
                                Select the active
                                supervisor who should
                                receive these tasks.
                            </p>
                        </div>
                    </div>

                    <select
                        value={assignedTo}
                        onChange={(event) =>
                            setAssignedTo(
                                event.target.value
                            )
                        }
                        disabled={
                            loading ||
                            loadingSupervisors
                        }
                    >
                        <option value="">
                            {loadingSupervisors
                                ? "Loading Supervisors..."
                                : "Select Supervisor"}
                        </option>

                        {supervisors.map(
                            (supervisor) => (
                                <option
                                    key={
                                        supervisor.id
                                    }
                                    value={
                                        supervisor.id
                                    }
                                >
                                    {
                                        supervisor.name
                                    }

                                    {supervisor.email
                                        ? ` - ${supervisor.email}`
                                        : ""}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="reassign-warning">
                    <AlertTriangle
                        size={19}
                    />

                    <div>
                        <strong>
                            Before reassigning
                        </strong>

                        <p>
                            Completed and cancelled
                            tasks cannot be reassigned.
                        </p>
                    </div>
                </div>

                {status && (
                    <div className="reassign-status">
                        {status}
                    </div>
                )}

                {result && (
                    <section className="reassign-result">

                        <div className="reassign-result-header">
                            <CheckCircle
                                size={20}
                            />

                            <h3>
                                Bulk Reassignment Result
                            </h3>
                        </div>

                        <div className="reassign-stats">

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

                                <div className="reassign-failed-table-wrapper">
                                    <table className="reassign-failed-table">
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
                            <div className="reassign-success-message">
                                <CheckCircle
                                    size={18}
                                />

                                <span>
                                    All tasks were
                                    reassigned successfully.
                                </span>
                            </div>
                        )}
                    </section>
                )}

                <div className="reassign-actions">

                    <button
                        type="button"
                        className="reassign-clear-button"
                        onClick={
                            handleClear
                        }
                        disabled={loading}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="reassign-submit-button"
                        onClick={
                            handleReassign
                        }
                        disabled={
                            loading ||
                            !selectedFile ||
                            !assignedTo
                        }
                    >
                        <ArrowRightLeft
                            size={17}
                        />

                        {loading
                            ? "PROCESSING..."
                            : "REASSIGN TASKS"}
                    </button>

                </div>

            </section>
        </div>
    );
};

export default ReassignBulkTask;
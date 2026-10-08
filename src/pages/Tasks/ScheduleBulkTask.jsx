import { useRef, useState } from "react";

import {
    FileSpreadsheet,
    Upload,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./ScheduleBulkTask.css";

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

    description: [
        "description",
        "task description",
    ],

    clientEmail: [
        "clientemail",
        "client email",
        "customer email",
    ],

    priority: [
        "priority",
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
};

const normalizeHeader = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const findColumnKey = (headers, aliases) => {
    return headers.find((header) => {
        const normalizedHeader = normalizeHeader(header);

        const compactHeader =
            normalizedHeader.replace(/\s+/g, "");

        return (
            aliases.includes(compactHeader) ||
            aliases.includes(normalizedHeader)
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

const ScheduleBulkTask = () => {
    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [result, setResult] =
        useState(null);

    const [error, setError] =
        useState("");

    const fileInputRef =
        useRef(null);

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        setError("");
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

            setError(
                "Please select a valid Excel file (.xlsx or .xls)."
            );

            return;
        }

        setSelectedFile(file);
    };

    const parseExcelFile = async (
        file
    ) => {
        const arrayBuffer =
            await file.arrayBuffer();

        const workbook = XLSX.read(
            arrayBuffer,
            {
                type: "array",
                cellDates: true,
            }
        );

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

        const originalHeaders =
            Object.keys(rows[0]);

        const columnMap = {};

        for (
            const field of Object.keys(
                COLUMN_ALIASES
            )
        ) {
            const matchedColumn =
                findColumnKey(
                    originalHeaders,
                    COLUMN_ALIASES[
                    field
                    ]
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

            const description =
                String(
                    row[
                    columnMap.description
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

            const priorityText =
                String(
                    row[
                    columnMap.priority
                    ] ?? "MEDIUM"
                )
                    .trim()
                    .toUpperCase() ||
                "MEDIUM";

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
                ).trim();

            const siteCode =
                String(
                    row[
                    columnMap.siteCode
                    ] ?? ""
                ).trim();

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
                    error: "Title is required",
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

            if (
                ![
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                ].includes(priorityText)
            ) {
                frontendFailedRows.push({
                    row: excelRowNumber,
                    title,
                    error:
                        "Priority must be LOW, MEDIUM or HIGH",
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
                description:
                    description || null,
                clientEmail:
                    clientEmail || null,
                priority: priorityText,
                scheduledAt,
                supervisorEmail,
                siteCode,
            });
        });

        if (!tasks.length) {
            throw new Error(
                "No valid task rows were found in the Excel file."
            );
        }

        if (tasks.length > 500) {
            throw new Error(
                "Maximum 500 tasks can be uploaded at once."
            );
        }

        return {
            tasks,
            frontendFailedRows,
        };
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError(
                "Please select an Excel file first."
            );

            return;
        }

        try {
            setLoading(true);
            setError("");
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
                    "/api/tasks/bulk",
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
                    "Bulk task upload failed."
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

            window.dispatchEvent(
                new CustomEvent(
                    "tasks-updated"
                )
            );
        } catch (uploadError) {
            console.error(
                "Bulk task upload error:",
                uploadError
            );

            setError(
                uploadError?.message ||
                "Failed to upload bulk tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFormat = () => {
        const worksheetData = [
            [
                "title",
                "description",
                "clientEmail",
                "priority",
                "scheduledAt",
                "supervisorEmail",
                "siteCode",
            ],

            [
                "Morning Site Inspection",
                "Inspect the assigned site",
                "client@example.com",
                "HIGH",
                "2026-09-20T09:00:00.000Z",
                "supervisor@example.com",
                "SITE-001",
            ],
        ];

        const worksheet =
            XLSX.utils.aoa_to_sheet(
                worksheetData
            );

        worksheet["!cols"] = [
            { wch: 28 },
            { wch: 42 },
            { wch: 34 },
            { wch: 12 },
            { wch: 30 },
            { wch: 38 },
            { wch: 20 },
        ];

        const instructionsData = [
            [
                "Bulk Task Upload Instructions",
            ],

            [""],

            ["Required columns"],

            [
                "title",
                "Task title",
            ],

            [
                "scheduledAt",
                "Example: 2026-09-20T09:00:00.000Z",
            ],

            [
                "supervisorEmail",
                "Email of an active Supervisor",
            ],

            [
                "siteCode",
                "Active Site Code or exact Site Name",
            ],

            [""],

            ["Optional columns"],

            [
                "description",
                "Task description",
            ],

            [
                "clientEmail",
                "Client email address",
            ],

            [
                "priority",
                "LOW / MEDIUM / HIGH",
            ],

            [""],

            [
                "Internal mapping",
                "Supervisor Email and Site Code are automatically resolved to UUIDs. Do not enter Supervisor or Site UUIDs.",
            ],

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
            { wch: 25 },
            { wch: 85 },
        ];

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Bulk Tasks"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            instructionsSheet,
            "Instructions"
        );

        XLSX.writeFile(
            workbook,
            "bulk-task-format.xlsx"
        );
    };

    const combinedFailedRows = [
        ...(result?.frontendFailedRows ||
            []),

        ...(result?.failedTasks || []),
    ];

    return (
        <div className="schedule-bulk-task-page">
            <section className="schedule-bulk-card">
                <div className="schedule-bulk-upload-section">
                    <label className="schedule-bulk-label">
                        Select Excel :
                    </label>

                    <div className="schedule-bulk-file-wrapper">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={
                                handleFileChange
                            }
                            className="schedule-bulk-file-input"
                        />

                        <button
                            type="button"
                            className="schedule-bulk-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={loading}
                        >
                            Choose File
                        </button>

                        <span className="schedule-bulk-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file chosen"}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="schedule-bulk-upload-button"
                        onClick={handleUpload}
                        disabled={
                            loading ||
                            !selectedFile
                        }
                    >
                        <Upload size={16} />

                        {loading
                            ? "UPLOADING..."
                            : "UPLOAD"}
                    </button>
                </div>

                <button
                    type="button"
                    className="schedule-bulk-download"
                    onClick={
                        handleDownloadFormat
                    }
                    disabled={loading}
                >
                    <FileSpreadsheet
                        size={17}
                    />

                    Download format
                </button>
            </section>

            {error && (
                <div
                    className="schedule-bulk-result-error"
                    style={{
                        marginTop: "20px",
                        padding: "14px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <AlertCircle
                        size={18}
                    />

                    <span>{error}</span>
                </div>
            )}

            {result && (
                <section
                    className="schedule-bulk-result"
                    style={{
                        marginTop: "24px",
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom:
                                "20px",
                        }}
                    >
                        <CheckCircle
                            size={20}
                        />

                        <h3
                            style={{
                                margin: 0,
                            }}
                        >
                            Bulk Task Upload Result
                        </h3>
                    </div>

                    <div
                        className="schedule-bulk-stats"
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, minmax(0, 1fr))",
                            gap: "12px",
                            marginBottom:
                                "20px",
                        }}
                    >
                        <div
                            style={{
                                padding: "15px",
                                borderRadius:
                                    "8px",
                                border:
                                    "1px solid currentColor",
                            }}
                        >
                            <strong>
                                Total
                            </strong>

                            <div
                                style={{
                                    fontSize:
                                        "24px",
                                    marginTop:
                                        "4px",
                                }}
                            >
                                {result.total}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "15px",
                                borderRadius:
                                    "8px",
                                border:
                                    "1px solid currentColor",
                            }}
                        >
                            <strong>
                                Successful
                            </strong>

                            <div
                                style={{
                                    fontSize:
                                        "24px",
                                    marginTop:
                                        "4px",
                                }}
                            >
                                {
                                    result.successful
                                }
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "15px",
                                borderRadius:
                                    "8px",
                                border:
                                    "1px solid currentColor",
                            }}
                        >
                            <strong>
                                Failed
                            </strong>

                            <div
                                style={{
                                    fontSize:
                                        "24px",
                                    marginTop:
                                        "4px",
                                }}
                            >
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

                            <div
                                style={{
                                    overflowX:
                                        "auto",
                                }}
                            >
                                <table
                                    style={{
                                        width:
                                            "100%",
                                        borderCollapse:
                                            "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding:
                                                        "10px",
                                                }}
                                            >
                                                Row
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding:
                                                        "10px",
                                                }}
                                            >
                                                Title
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding:
                                                        "10px",
                                                }}
                                            >
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
                                                    <td
                                                        style={{
                                                            padding:
                                                                "10px",
                                                        }}
                                                    >
                                                        {
                                                            item.row
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "10px",
                                                        }}
                                                    >
                                                        {
                                                            item.title ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "10px",
                                                        }}
                                                    >
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
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "8px",
                            }}
                        >
                            <CheckCircle
                                size={18}
                            />

                            <span>
                                All uploaded task
                                rows were processed
                                successfully.
                            </span>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default ScheduleBulkTask;
import { useEffect, useMemo, useState } from "react";

import {
    CheckSquare,
    FileSpreadsheet,
    FileText,
    Printer,
    Search,
    Users,
    MapPin,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";
import "./TaskSummary.css";

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const ExportButtons = ({ title, headers, rows }) => {
    const exportExcel = () => {
        try {
            const worksheet = XLSX.utils.aoa_to_sheet([
                headers,
                ...rows,
            ]);

            worksheet["!cols"] = headers.map((header, index) => {
                const longest = rows.reduce(
                    (max, row) =>
                        Math.max(
                            max,
                            String(row[index] ?? "").length
                        ),
                    0
                );

                return {
                    wch: Math.min(
                        Math.max(
                            String(header).length,
                            longest,
                            10
                        ) + 2,
                        45
                    ),
                };
            });

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Task Summary"
            );

            const fileName =
                title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") ||
                "task-summary";

            XLSX.writeFile(
                workbook,
                `${fileName}.xlsx`
            );
        } catch (error) {
            console.error(
                "Task summary Excel export failed:",
                error
            );

            window.alert(
                "Failed to export Excel file."
            );
        }
    };

    const printReport = () => {
        try {
            const printWindow = window.open(
                "",
                "_blank",
                "width=1200,height=800"
            );

            if (!printWindow) {
                window.alert(
                    "Please allow pop-ups for this website."
                );
                return;
            }

            const tableRows = rows.length
                ? rows
                    .map(
                        (row) => `
                            <tr>
                                ${row
                                .map(
                                    (cell) =>
                                        `<td>${escapeHtml(
                                            cell
                                        )}</td>`
                                )
                                .join("")}
                            </tr>
                        `
                    )
                    .join("")
                : `
                    <tr>
                        <td
                            colspan="${headers.length}"
                            class="empty"
                        >
                            No records found
                        </td>
                    </tr>
                `;

            printWindow.document.open();

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8" />
                        <title>${escapeHtml(title)}</title>
                        <style>
                            * { box-sizing: border-box; }

                            body {
                                margin: 0;
                                padding: 20px;
                                font-family: Arial, Helvetica, sans-serif;
                                color: #111827;
                            }

                            h1 {
                                margin: 0 0 6px;
                                font-size: 22px;
                            }

                            .generated {
                                margin-bottom: 18px;
                                color: #6b7280;
                                font-size: 12px;
                            }

                            table {
                                width: 100%;
                                border-collapse: collapse;
                                font-size: 12px;
                            }

                            th,
                            td {
                                padding: 9px;
                                border: 1px solid #d1d5db;
                                text-align: left;
                                word-break: break-word;
                            }

                            th {
                                background: #f3f4f6;
                                font-weight: 700;
                            }

                            tbody tr:nth-child(even) {
                                background: #f9fafb;
                            }

                            .empty {
                                padding: 30px;
                                text-align: center;
                                color: #6b7280;
                            }

                            .footer {
                                margin-top: 15px;
                                color: #6b7280;
                                font-size: 11px;
                            }

                            @page {
                                size: landscape;
                                margin: 10mm;
                            }
                        </style>
                    </head>

                    <body>
                        <h1>${escapeHtml(title)}</h1>

                        <div class="generated">
                            Generated:
                            ${escapeHtml(
                new Date().toLocaleString(
                    "en-IN"
                )
            )}
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    ${headers
                    .map(
                        (header) =>
                            `<th>${escapeHtml(
                                header
                            )}</th>`
                    )
                    .join("")}
                                </tr>
                            </thead>

                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>

                        <div class="footer">
                            Total records: ${rows.length}
                        </div>
                    </body>
                </html>
            `);

            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error(
                "Task summary print failed:",
                error
            );

            window.alert(
                "Failed to create Print/PDF report."
            );
        }
    };

    return (
        <div className="task-summary-export-buttons">
            <button
                type="button"
                title={`Export ${title} to Excel`}
                onClick={exportExcel}
            >
                <FileSpreadsheet size={16} />
            </button>

            <button
                type="button"
                title={`Export ${title} to PDF`}
                onClick={printReport}
            >
                <FileText size={16} />
            </button>

            <button
                type="button"
                title={`Print ${title}`}
                onClick={printReport}
            >
                <Printer size={16} />
            </button>
        </div>
    );
};

const SearchBox = ({
    value,
    onChange,
    placeholder = "Search...",
}) => (
    <div className="task-summary-search">
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(event) =>
                onChange(event.target.value)
            }
        />

        <Search size={17} />
    </div>
);

const TaskSummary = () => {
    const [tasks, setTasks] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    const [loading, setLoading] = useState(true);

    const [loadingSupervisors, setLoadingSupervisors] =
        useState(true);

    const [error, setError] = useState("");

    const [locationSearch, setLocationSearch] =
        useState("");

    const [userSearch, setUserSearch] =
        useState("");

    const [locationPage, setLocationPage] =
        useState(1);

    const [locationPageSize, setLocationPageSize] =
        useState(10);

    const [userPage, setUserPage] =
        useState(1);

    const [userPageSize, setUserPageSize] =
        useState(10);

    /*
     * =========================================================
     * LOAD ALL TASKS
     * =========================================================
     */
    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const firstResponse = await apiFetch(
                "/api/tasks?page=1&limit=100"
            );

            const firstData =
                await firstResponse.json();

            if (!firstResponse.ok) {
                throw new Error(
                    firstData?.message ||
                    "Failed to fetch tasks"
                );
            }

            let allTasks =
                firstData?.data?.tasks ||
                firstData?.tasks ||
                [];

            const totalPages =
                Number(
                    firstData?.data?.pagination?.totalPages
                ) || 1;

            for (
                let page = 2;
                page <= totalPages;
                page += 1
            ) {
                const response = await apiFetch(
                    `/api/tasks?page=${page}&limit=100`
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Failed to fetch task page ${page}`
                    );
                }

                allTasks = [
                    ...allTasks,
                    ...(data?.data?.tasks ||
                        data?.tasks ||
                        []),
                ];
            }

            /*
             * Task Management is Supervisor based.
             *
             * This also protects the page from old
             * FIELD_STAFF task records already present
             * in the database.
             */
            const supervisorTasks =
                allTasks.filter(
                    (task) =>
                        String(
                            task?.assignedTo?.role ||
                            ""
                        ).toUpperCase() ===
                        "SUPERVISOR"
                );

            setTasks(supervisorTasks);
        } catch (error) {
            console.error(
                "Failed to fetch task summary:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch task summary"
            );

            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    /*
     * =========================================================
     * LOAD SUPERVISORS
     * =========================================================
     *
     * Important:
     * Supervisor list comes from Users API directly.
     *
     * Therefore a Supervisor with zero tasks will also appear.
     */
    const fetchSupervisors = async () => {
        try {
            setLoadingSupervisors(true);

            const response = await apiFetch(
                "/api/users?status=ALL&role=SUPERVISOR"
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to fetch supervisors"
                );
            }

            const users =
                data?.data?.users ||
                data?.users ||
                [];

            const supervisorList =
                Array.isArray(users)
                    ? users.filter(
                        (user) =>
                            String(
                                user?.role || ""
                            ).toUpperCase() ===
                            "SUPERVISOR"
                    )
                    : [];

            setSupervisors(
                supervisorList
            );
        } catch (error) {
            console.error(
                "Failed to fetch supervisors:",
                error
            );

            /*
             * Keep task summary usable even if
             * the supervisor list call fails.
             */
            setSupervisors([]);
        } finally {
            setLoadingSupervisors(
                false
            );
        }
    };

    /*
     * =========================================================
     * INITIAL LOAD + REFRESH
     * =========================================================
     */
    useEffect(() => {
        fetchAllTasks();
        fetchSupervisors();

        const interval = setInterval(() => {
            fetchAllTasks();
            fetchSupervisors();
        }, 60000);

        return () => {
            clearInterval(interval);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * =========================================================
     * TASK TOTALS
     * =========================================================
     */

    const totalTasks =
        tasks.length;

    const totalCompleted =
        tasks.filter(
            (task) =>
                task.status ===
                "COMPLETED"
        ).length;

    /*
     * Backend uses SCHEDULED
     * as the pending state.
     */
    const totalPending =
        tasks.filter(
            (task) =>
                task.status ===
                "SCHEDULED"
        ).length;

    const totalInProgress =
        tasks.filter(
            (task) =>
                task.status ===
                "IN_PROGRESS"
        ).length;

    const totalCancelled =
        tasks.filter(
            (task) =>
                task.status ===
                "CANCELLED"
        ).length;

    const totalNotCompleted =
        totalTasks -
        totalCompleted;

    const completionPercentage =
        totalTasks > 0
            ? (totalCompleted /
                totalTasks) *
            100
            : 0;

    /*
     * =========================================================
     * LOCATION SUMMARY
     * =========================================================
     */
    const locationData =
        useMemo(() => {
            const grouped = {};

            tasks.forEach(
                (task) => {
                    const siteId =
                        task?.site?.id ||
                        task?.siteId ||
                        "unknown";

                    if (
                        !grouped[
                        siteId
                        ]
                    ) {
                        grouped[
                            siteId
                        ] = {
                            id: siteId,

                            location: `${task?.site
                                    ?.siteCode ||
                                "NA"
                                } - ${task?.site
                                    ?.name ||
                                "Unknown Site"
                                }`,

                            completed: 0,
                            pending: 0,
                            inProgress: 0,
                            cancelled: 0,
                            total: 0,
                        };
                    }

                    grouped[
                        siteId
                    ].total += 1;

                    if (
                        task.status ===
                        "COMPLETED"
                    ) {
                        grouped[
                            siteId
                        ].completed += 1;
                    } else if (
                        task.status ===
                        "SCHEDULED"
                    ) {
                        grouped[
                            siteId
                        ].pending += 1;
                    } else if (
                        task.status ===
                        "IN_PROGRESS"
                    ) {
                        grouped[
                            siteId
                        ].inProgress += 1;
                    } else if (
                        task.status ===
                        "CANCELLED"
                    ) {
                        grouped[
                            siteId
                        ].cancelled += 1;
                    }
                }
            );

            return Object.values(
                grouped
            ).sort(
                (a, b) =>
                    b.total -
                    a.total ||
                    a.location.localeCompare(
                        b.location
                    )
            );
        }, [tasks]);

    /*
     * =========================================================
     * SUPERVISOR SUMMARY
     * =========================================================
     *
     * Merge:
     *
     * Users API
     * +
     * Tasks API
     *
     * This guarantees every Supervisor appears.
     */
    const userData =
        useMemo(() => {
            const grouped = {};

            /*
             * First create every Supervisor row.
             */
            supervisors.forEach(
                (user) => {
                    grouped[
                        user.id
                    ] = {
                        id: user.id,

                        user:
                            user?.name ||
                            "Unknown Supervisor",

                        email:
                            user?.email ||
                            "",

                        status:
                            user?.status ||
                            "—",

                        site:
                            user?.site?.name
                                ? `${user?.site
                                    ?.siteCode ||
                                "NA"
                                } - ${user
                                    .site
                                    .name
                                }`
                                : "Site Not Assigned",

                        completed: 0,
                        pending: 0,
                        inProgress: 0,
                        cancelled: 0,
                        total: 0,
                    };
                }
            );

            /*
             * Then attach task counts.
             */
            tasks.forEach(
                (task) => {
                    const supervisorId =
                        task?.assignedTo
                            ?.id ||
                        task?.assignedToId ||
                        "unknown";

                    /*
                     * Normally this row already exists
                     * from /api/users.
                     *
                     * This fallback protects the UI if
                     * a task references a Supervisor that
                     * is not returned by Users API.
                     */
                    if (
                        !grouped[
                        supervisorId
                        ]
                    ) {
                        grouped[
                            supervisorId
                        ] = {
                            id: supervisorId,

                            user:
                                task?.assignedTo
                                    ?.name ||
                                "Unknown Supervisor",

                            email:
                                task
                                    ?.assignedTo
                                    ?.email ||
                                "",

                            status:
                                task
                                    ?.assignedTo
                                    ?.status ||
                                "—",

                            site:
                                task?.site
                                    ?.name
                                    ? `${task?.site
                                        ?.siteCode ||
                                    "NA"
                                    } - ${task
                                        .site
                                        .name
                                    }`
                                    : "Site Not Assigned",

                            completed: 0,
                            pending: 0,
                            inProgress: 0,
                            cancelled: 0,
                            total: 0,
                        };
                    }

                    const row =
                        grouped[
                        supervisorId
                        ];

                    /*
                     * If user relation did not contain
                     * site information, use task site.
                     */
                    if (
                        row.site ===
                        "Site Not Assigned" &&
                        task?.site?.name
                    ) {
                        row.site = `${task?.site
                                ?.siteCode ||
                            "NA"
                            } - ${task.site
                                .name
                            }`;
                    }

                    row.total += 1;

                    if (
                        task.status ===
                        "COMPLETED"
                    ) {
                        row.completed += 1;
                    } else if (
                        task.status ===
                        "SCHEDULED"
                    ) {
                        row.pending += 1;
                    } else if (
                        task.status ===
                        "IN_PROGRESS"
                    ) {
                        row.inProgress +=
                            1;
                    } else if (
                        task.status ===
                        "CANCELLED"
                    ) {
                        row.cancelled += 1;
                    }
                }
            );

            return Object.values(
                grouped
            ).sort(
                (a, b) =>
                    b.total -
                    a.total ||
                    a.user.localeCompare(
                        b.user
                    )
            );
        }, [
            supervisors,
            tasks,
        ]);

    /*
     * =========================================================
     * LOCATION SEARCH
     * =========================================================
     */
    const filteredLocations =
        useMemo(() => {
            const search =
                locationSearch
                    .toLowerCase()
                    .trim();

            if (!search) {
                return locationData;
            }

            return locationData.filter(
                (item) =>
                    item.location
                        .toLowerCase()
                        .includes(
                            search
                        )
            );
        }, [
            locationData,
            locationSearch,
        ]);

    /*
     * =========================================================
     * SUPERVISOR SEARCH
     * =========================================================
     */
    const filteredUsers =
        useMemo(() => {
            const search =
                userSearch
                    .toLowerCase()
                    .trim();

            if (!search) {
                return userData;
            }

            return userData.filter(
                (item) => {
                    const name =
                        item.user
                            .toLowerCase();

                    const site =
                        item.site
                            .toLowerCase();

                    const email =
                        item.email
                            .toLowerCase();

                    const status =
                        String(
                            item.status ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(
                            search
                        ) ||
                        site.includes(
                            search
                        ) ||
                        email.includes(
                            search
                        ) ||
                        status.includes(
                            search
                        )
                    );
                }
            );
        }, [
            userData,
            userSearch,
        ]);

    /*
     * =========================================================
     * RESET PAGINATION
     * =========================================================
     */
    useEffect(() => {
        setLocationPage(1);
    }, [
        locationSearch,
        locationPageSize,
    ]);

    useEffect(() => {
        setUserPage(1);
    }, [
        userSearch,
        userPageSize,
    ]);

    /*
     * =========================================================
     * PAGINATION TOTALS
     * =========================================================
     */
    const locationTotalPages =
        Math.max(
            1,
            Math.ceil(
                filteredLocations.length /
                locationPageSize
            )
        );

    const userTotalPages =
        Math.max(
            1,
            Math.ceil(
                filteredUsers.length /
                userPageSize
            )
        );

    useEffect(() => {
        if (
            locationPage >
            locationTotalPages
        ) {
            setLocationPage(
                locationTotalPages
            );
        }
    }, [
        locationPage,
        locationTotalPages,
    ]);

    useEffect(() => {
        if (
            userPage >
            userTotalPages
        ) {
            setUserPage(
                userTotalPages
            );
        }
    }, [
        userPage,
        userTotalPages,
    ]);

    /*
     * =========================================================
     * PAGINATED LOCATION DATA
     * =========================================================
     */
    const paginatedLocations =
        useMemo(() => {
            const start =
                (locationPage -
                    1) *
                locationPageSize;

            return filteredLocations.slice(
                start,
                start +
                locationPageSize
            );
        }, [
            filteredLocations,
            locationPage,
            locationPageSize,
        ]);

    /*
     * =========================================================
     * PAGINATED SUPERVISOR DATA
     * =========================================================
     */
    const paginatedUsers =
        useMemo(() => {
            const start =
                (userPage - 1) *
                userPageSize;

            return filteredUsers.slice(
                start,
                start +
                userPageSize
            );
        }, [
            filteredUsers,
            userPage,
            userPageSize,
        ]);

    /*
     * =========================================================
     * LOCATION SHOWING RANGE
     * =========================================================
     */
    const locationFrom =
        filteredLocations.length === 0
            ? 0
            : (locationPage -
                1) *
            locationPageSize +
            1;

    const locationTo =
        Math.min(
            locationPage *
            locationPageSize,
            filteredLocations.length
        );

    /*
     * =========================================================
     * SUPERVISOR SHOWING RANGE
     * =========================================================
     */
    const userFrom =
        filteredUsers.length === 0
            ? 0
            : (userPage - 1) *
            userPageSize +
            1;

    const userTo =
        Math.min(
            userPage * userPageSize,
            filteredUsers.length
        );

    /*
     * =========================================================
     * LOCATION EXPORT
     * =========================================================
     */
    const locationExportHeaders = [
        "Location",
        "Completed",
        "Pending",
        "In Progress",
        "Cancelled",
        "Total",
    ];

    const locationExportRows =
        filteredLocations.map(
            (item) => [
                item.location,
                item.completed,
                item.pending,
                item.inProgress,
                item.cancelled,
                item.total,
            ]
        );

    /*
     * =========================================================
     * SUPERVISOR EXPORT
     * =========================================================
     */
    const supervisorExportHeaders = [
        "Supervisor",
        "Site",
        "Status",
        "Completed",
        "Pending",
        "In Progress",
        "Cancelled",
        "Total",
    ];

    const supervisorExportRows =
        filteredUsers.map(
            (item) => [
                item.user,
                item.site,
                item.status,
                item.completed,
                item.pending,
                item.inProgress,
                item.cancelled,
                item.total,
            ]
        );

    return (
        <div className="task-summary-page">
            {/* =================================================
                TOP SUMMARY
            ================================================= */}

            <section className="task-summary-chart-card">
                <div className="task-summary-chart-header">
                    <h1>
                        Task Summary
                    </h1>
                </div>

                {loading ? (
                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                        }}
                    >
                        Loading task summary...
                    </div>
                ) : (
                    <div className="task-summary-chart-content">
                        {/* DONUT */}
                        <div className="task-donut">
                            <div
                                className="task-donut-progress"
                                style={{
                                    background:
                                        `conic-gradient(
                                            #16a34a ${completionPercentage}%,
                                            #dc2626 ${completionPercentage}% 100%
                                        )`,
                                }}
                            >
                                <div className="task-donut-inner">
                                    <strong>
                                        {completionPercentage.toFixed(
                                            0
                                        )}
                                        %
                                    </strong>

                                    <span>
                                        COMPLETED
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* STATUS LEGEND */}
                        <div
                            className="task-summary-legend"
                            style={{
                                width:
                                    "100%",
                                maxWidth:
                                    "720px",
                            }}
                        >
                            <div className="legend-item">
                                <span className="legend-dot completed" />

                                <span>
                                    COMPLETED (
                                    {
                                        totalCompleted
                                    }
                                    )
                                </span>
                            </div>

                            <div className="legend-item">
                                <span className="legend-dot missed" />

                                <span>
                                    PENDING (
                                    {
                                        totalPending
                                    }
                                    )
                                </span>
                            </div>

                            <div className="legend-item">
                                <span
                                    className="legend-dot"
                                    style={{
                                        background:
                                            "#2563eb",
                                    }}
                                />

                                <span>
                                    IN PROGRESS (
                                    {
                                        totalInProgress
                                    }
                                    )
                                </span>
                            </div>

                            <div className="legend-item">
                                <span
                                    className="legend-dot"
                                    style={{
                                        background:
                                            "#6b7280",
                                    }}
                                />

                                <span>
                                    CANCELLED (
                                    {
                                        totalCancelled
                                    }
                                    )
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop:
                                        "12px",
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(120px, 1fr))",
                                    gap:
                                        "10px",
                                }}
                            >
                                <div
                                    style={{
                                        padding:
                                            "10px 12px",
                                        border:
                                            "1px solid #e5e7eb",
                                        borderRadius:
                                            "10px",
                                    }}
                                >
                                    <small
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "3px",
                                        }}
                                    >
                                        TOTAL TASKS
                                    </small>

                                    <strong>
                                        {
                                            totalTasks
                                        }
                                    </strong>
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "10px 12px",
                                        border:
                                            "1px solid #e5e7eb",
                                        borderRadius:
                                            "10px",
                                    }}
                                >
                                    <small
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "3px",
                                        }}
                                    >
                                        NOT COMPLETED
                                    </small>

                                    <strong>
                                        {
                                            totalNotCompleted
                                        }
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    style={{
                        padding:
                            "12px 16px",
                        color:
                            "#dc2626",
                        fontSize:
                            "14px",
                    }}
                >
                    {error}
                </div>
            )}

            <div className="task-summary-tables">
                {/* =================================================
                    LOCATION TABLE
                ================================================= */}

                <section className="task-summary-table-card">
                    <div className="task-summary-table-toolbar">
                        <SearchBox
                            value={
                                locationSearch
                            }
                            onChange={
                                setLocationSearch
                            }
                            placeholder="Search location..."
                        />

                        <ExportButtons
                            title="Task Summary Location"
                            headers={
                                locationExportHeaders
                            }
                            rows={
                                locationExportRows
                            }
                        />
                    </div>

                    <div className="task-summary-table-wrapper">
                        <table className="task-summary-table">
                            <thead>
                                <tr>
                                    <th>
                                        <span>
                                            <MapPin
                                                size={
                                                    14
                                                }
                                            />

                                            Location
                                        </span>

                                        <small>
                                            ↕
                                        </small>
                                    </th>

                                    <th>
                                        <span>
                                            <CheckSquare
                                                size={
                                                    14
                                                }
                                            />

                                            Completed
                                        </span>

                                        <small>
                                            ↕
                                        </small>
                                    </th>

                                    <th>
                                        Pending
                                    </th>

                                    <th>
                                        In Progress
                                    </th>

                                    <th>
                                        Cancelled
                                    </th>

                                    <th>
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="task-summary-empty"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedLocations.length >
                                    0 ? (
                                    paginatedLocations.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        item.location
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.completed
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.pending
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.inProgress
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.cancelled
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.total
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="task-summary-empty"
                                        >
                                            No location records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* LOCATION FOOTER */}
                    <div className="task-summary-table-footer">
                        <span>
                            Showing{" "}
                            {
                                locationFrom
                            }{" "}
                            to{" "}
                            {
                                locationTo
                            }{" "}
                            of{" "}
                            {
                                filteredLocations.length
                            }{" "}
                            entries
                        </span>

                        <div className="task-summary-show">
                            <span>
                                Show
                            </span>

                            <select
                                value={
                                    locationPageSize
                                }
                                onChange={(
                                    event
                                ) =>
                                    setLocationPageSize(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                            >
                                <option value="10">
                                    10
                                </option>

                                <option value="25">
                                    25
                                </option>

                                <option value="50">
                                    50
                                </option>
                            </select>

                            <span>
                                entries
                            </span>
                        </div>

                        <div className="task-summary-pagination">
                            <button
                                type="button"
                                disabled={
                                    locationPage ===
                                    1
                                }
                                onClick={() =>
                                    setLocationPage(
                                        (
                                            page
                                        ) =>
                                            page -
                                            1
                                    )
                                }
                            >
                                Previous
                            </button>

                            <button className="active">
                                {
                                    locationPage
                                }
                            </button>

                            <button
                                type="button"
                                disabled={
                                    locationPage >=
                                    locationTotalPages
                                }
                                onClick={() =>
                                    setLocationPage(
                                        (
                                            page
                                        ) =>
                                            page +
                                            1
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    SUPERVISOR TABLE
                ================================================= */}

                <section className="task-summary-table-card">
                    <div className="task-summary-table-toolbar">
                        <SearchBox
                            value={
                                userSearch
                            }
                            onChange={
                                setUserSearch
                            }
                            placeholder="Search supervisor..."
                        />

                        <ExportButtons
                            title="Task Summary Supervisors"
                            headers={
                                supervisorExportHeaders
                            }
                            rows={
                                supervisorExportRows
                            }
                        />
                    </div>

                    <div className="task-summary-table-wrapper">
                        <table className="task-summary-table user-table">
                            <thead>
                                <tr>
                                    <th>
                                        <span>
                                            <Users
                                                size={
                                                    14
                                                }
                                            />

                                            Supervisor
                                        </span>

                                        <small>
                                            ↕
                                        </small>
                                    </th>

                                    <th>
                                        <span>
                                            <MapPin
                                                size={
                                                    14
                                                }
                                            />

                                            Site
                                        </span>

                                        <small>
                                            ↕
                                        </small>
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Completed
                                    </th>

                                    <th>
                                        Pending
                                    </th>

                                    <th>
                                        In Progress
                                    </th>

                                    <th>
                                        Cancelled
                                    </th>

                                    <th>
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ||
                                    loadingSupervisors ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="task-summary-empty"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length >
                                    0 ? (
                                    paginatedUsers.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >
                                                <td
                                                    title={
                                                        item.email
                                                    }
                                                >
                                                    {
                                                        item.user
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.site
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.status
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.completed
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.pending
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.inProgress
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.cancelled
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.total
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="task-summary-empty"
                                        >
                                            No supervisor records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* SUPERVISOR FOOTER */}
                    <div className="task-summary-table-footer">
                        <span>
                            Showing{" "}
                            {userFrom}{" "}
                            to{" "}
                            {userTo}{" "}
                            of{" "}
                            {
                                filteredUsers.length
                            }{" "}
                            entries
                        </span>

                        <div className="task-summary-show">
                            <span>
                                Show
                            </span>

                            <select
                                value={
                                    userPageSize
                                }
                                onChange={(
                                    event
                                ) =>
                                    setUserPageSize(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                            >
                                <option value="10">
                                    10
                                </option>

                                <option value="25">
                                    25
                                </option>

                                <option value="50">
                                    50
                                </option>
                            </select>

                            <span>
                                entries
                            </span>
                        </div>

                        <div className="task-summary-pagination">
                            <button
                                type="button"
                                disabled={
                                    userPage ===
                                    1
                                }
                                onClick={() =>
                                    setUserPage(
                                        (
                                            page
                                        ) =>
                                            page -
                                            1
                                    )
                                }
                            >
                                Previous
                            </button>

                            <button className="active">
                                {userPage}
                            </button>

                            <button
                                type="button"
                                disabled={
                                    userPage >=
                                    userTotalPages
                                }
                                onClick={() =>
                                    setUserPage(
                                        (
                                            page
                                        ) =>
                                            page +
                                            1
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TaskSummary;
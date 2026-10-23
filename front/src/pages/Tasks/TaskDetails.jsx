import { useEffect, useMemo, useState } from "react";

import {
    CheckCircle,
    Clock3,
    Download,
    MessageCircle,
    Search,
    XCircle,
    X,
    Phone,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";
import "./TaskDetails.css";

const extractClientDetails = (desc, task = {}) => {
    const text = String(desc || "");

    // 1. Mobile Number (from task fields or description)
    let mobile = task?.clientMobile || task?.clientPhone || null;
    if (!mobile && text) {
        const m = text.match(/Client Mobile:\s*([^|\n]+)/i) ||
            text.match(/(?:Mobile|Phone):\s*([0-9\+\-\s]{8,15})/i) ||
            text.match(/(?:Mobile|Phone):\s*([^|\n]+)/i);
        if (m) mobile = m[1].trim();
    }

    // 2. Client Name (from task or description)
    let client = task?.clientName || task?.client || null;
    if (!client && text) {
        const c = text.match(/Client:\s*([^|\n]+?)(?=\s*(?:Client Email|Client Mobile|Address|Site|Category|Type|$))/i) ||
            text.match(/Client:\s*([^|\n]+)/i);
        if (c) client = c[1].trim();
    }

    // 3. Client Email (from task or description)
    let email = task?.clientEmail || null;
    if (!email && text) {
        const e = text.match(/Client Email:\s*([^|\n]+?)(?=\s*(?:Address|Site|Category|Type|$))/i) ||
            text.match(/Client Email:\s*([^|\n]+)/i);
        if (e) email = e[1].trim();
    }

    return { client, mobile, email };
};


// =========================================================
// STATUS CONFIG
// =========================================================

const STATUS_CONFIG = [
    {
        label: "PENDING",
        className: "pending",
        icon: Clock3,
        status: "SCHEDULED",
    },

    {
        label: "IN PROGRESS",
        className: "in-progress",
        icon: Clock3,
        status: "IN_PROGRESS",
    },

    {
        label: "COMPLETED",
        className: "completed",
        icon: CheckCircle,
        status: "COMPLETED",
    },

    {
        label: "CANCELLED",
        className: "cancelled",
        icon: XCircle,
        status: "CANCELLED",
    },
];

// =========================================================
// TASK DETAILS
// =========================================================

const TaskDetails = () => {
    const [tasks, setTasks] = useState([]);

    const [search, setSearch] =
        useState("");

    const [activeStatus, setActiveStatus] =
        useState("ALL");

    const [page, setPage] =
        useState(1);

    const [pageSize, setPageSize] =
        useState("25");

    const [loading, setLoading] =
        useState(false);

    const [statusCounts, setStatusCounts] =
        useState({
            PENDING: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0,
        });

    const [total, setTotal] =
        useState(0);

    const [message, setMessage] =
        useState("");

    const [selectedTask, setSelectedTask] =
        useState(null);

    const [loadingTask, setLoadingTask] =
        useState(false);

    const [exporting, setExporting] =
        useState(false);

    // =========================================================
    // FETCH TASKS
    // =========================================================

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setMessage("");

            const params =
                new URLSearchParams();

            params.set(
                "page",
                String(page)
            );

            params.set(
                "limit",
                String(pageSize)
            );

            // -------------------------------
            // SEARCH
            // -------------------------------

            if (search.trim()) {
                params.set(
                    "search",
                    search.trim()
                );
            }

            // -------------------------------
            // STATUS FILTER
            // -------------------------------

            if (
                activeStatus ===
                "COMPLETED"
            ) {
                params.set(
                    "status",
                    "COMPLETED"
                );
            } else if (
                activeStatus ===
                "PENDING"
            ) {
                params.set(
                    "status",
                    "SCHEDULED"
                );
            } else if (
                activeStatus ===
                "IN PROGRESS"
            ) {
                params.set(
                    "status",
                    "IN_PROGRESS"
                );
            } else if (
                activeStatus ===
                "CANCELLED"
            ) {
                params.set(
                    "status",
                    "CANCELLED"
                );
            }

            // -------------------------------
            // API
            // -------------------------------

            const response =
                await apiFetch(
                    `/api/tasks?${params.toString()}`
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load tasks"
                );
            }

            const taskList =
                data?.data?.tasks ||
                data?.tasks ||
                [];

            const pagination =
                data?.data?.pagination ||
                data?.pagination ||
                {};

            setTasks(
                Array.isArray(taskList)
                    ? taskList.filter(
                        (task) =>
                            String(
                                task
                                    ?.assignedTo
                                    ?.role ||
                                ""
                            ).toUpperCase() ===
                            "SUPERVISOR"
                    )
                    : []
            );

            setTotal(
                Number(
                    pagination?.total ||
                    taskList.length ||
                    0
                )
            );
        } catch (error) {
            console.error(
                "Failed to fetch tasks:",
                error
            );

            setTasks([]);
            setTotal(0);

            setMessage(
                error?.message ||
                "Failed to load tasks"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FETCH STATUS COUNTS
    // =========================================================

    const fetchStatusCounts =
        async () => {
            try {
                const statusRequests = [
                    {
                        key: "PENDING",
                        apiStatus:
                            "SCHEDULED",
                    },

                    {
                        key: "IN_PROGRESS",
                        apiStatus:
                            "IN_PROGRESS",
                    },

                    {
                        key: "COMPLETED",
                        apiStatus:
                            "COMPLETED",
                    },

                    {
                        key: "CANCELLED",
                        apiStatus:
                            "CANCELLED",
                    },
                ];

                const responses =
                    await Promise.all(
                        statusRequests.map(
                            async ({
                                key,
                                apiStatus,
                            }) => {
                                try {
                                    const response =
                                        await apiFetch(
                                            `/api/tasks?status=${encodeURIComponent(
                                                apiStatus
                                            )}&limit=1`
                                        );

                                    const data =
                                        await response.json();

                                    if (
                                        !response.ok
                                    ) {
                                        return [
                                            key,
                                            0,
                                        ];
                                    }

                                    return [
                                        key,
                                        Number(
                                            data
                                                ?.data
                                                ?.pagination
                                                ?.total ||
                                            data
                                                ?.pagination
                                                ?.total ||
                                            0
                                        ),
                                    ];
                                } catch {
                                    return [
                                        key,
                                        0,
                                    ];
                                }
                            }
                        )
                    );

                const counts = {
                    PENDING: 0,
                    IN_PROGRESS: 0,
                    COMPLETED: 0,
                    CANCELLED: 0,
                };

                responses.forEach(
                    ([key, value]) => {
                        counts[key] =
                            value;
                    }
                );

                setStatusCounts(
                    counts
                );
            } catch (error) {
                console.error(
                    "Failed to fetch task counts:",
                    error
                );
            }
        };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchTasks();
        fetchStatusCounts();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================
    // LOAD ON FILTER / PAGE CHANGE
    // =========================================================

    useEffect(() => {
        fetchTasks();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page,
        pageSize,
        search,
        activeStatus,
    ]);

    // =========================================================
    // TASK UPDATED EVENT
    // =========================================================

    useEffect(() => {
        const handleTasksUpdated =
            () => {
                fetchTasks();
                fetchStatusCounts();
            };

        window.addEventListener(
            "tasks-updated",
            handleTasksUpdated
        );

        return () => {
            window.removeEventListener(
                "tasks-updated",
                handleTasksUpdated
            );
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page,
        pageSize,
        search,
        activeStatus,
    ]);

    // =========================================================
    // AUTO REFRESH
    // =========================================================

    useEffect(() => {
        const interval =
            setInterval(() => {
                fetchTasks();
                fetchStatusCounts();
            }, 60000);

        return () => {
            clearInterval(
                interval
            );
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        page,
        pageSize,
        search,
        activeStatus,
    ]);

    // =========================================================
    // RESET PAGE
    // =========================================================

    useEffect(() => {
        setPage(1);
    }, [
        search,
        activeStatus,
        pageSize,
    ]);

    // =========================================================
    // HELPERS
    // =========================================================

    const formatDateTime = (
        value
    ) => {
        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return date.toLocaleString(
            "en-IN",
            {
                dateStyle:
                    "medium",
                timeStyle:
                    "short",
            }
        );
    };

    const getStatusLabel = (
        status
    ) => {
        switch (status) {
            case "SCHEDULED":
                return "Pending";

            case "IN_PROGRESS":
                return "In Progress";

            case "COMPLETED":
                return "Completed";

            case "CANCELLED":
                return "Cancelled";

            default:
                return (
                    status || "—"
                );
        }
    };

    const getStatusClass = (
        status
    ) => {
        return String(
            getStatusLabel(
                status
            )
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );
    };

    const getTaskTitle = (
        task
    ) => {
        return (
            task?.title ||
            task?.taskType ||
            "Untitled Task"
        );
    };

    const getSiteName = (
        task
    ) => {
        return (
            task?.site?.name ||
            task?.siteName ||
            "—"
        );
    };

    const getSiteAddress = (
        task
    ) => {
        const site =
            task?.site;

        if (!site) {
            return "—";
        }

        const parts = [
            site.address,
            site.city,
            site.state,
            site.pincode,
        ].filter(Boolean);

        return parts.length
            ? parts.join(", ")
            : "—";
    };

    const getSupervisorName = (
        task
    ) => {
        return (
            task
                ?.assignedTo
                ?.name ||
            "Unassigned"
        );
    };

    const getPriorityLabel = (
        priority
    ) => {
        return (
            priority ||
            "MEDIUM"
        );
    };

    // =========================================================
    // EXPORT TASKS
    // =========================================================

    const handleExport =
        async () => {
            try {
                setMessage("");
                setExporting(
                    true
                );

                const exportTasks =
                    [];

                const exportLimit =
                    100;

                let exportPage =
                    1;

                let totalPagesToFetch =
                    1;

                do {
                    const params =
                        new URLSearchParams();

                    params.set(
                        "page",
                        String(
                            exportPage
                        )
                    );

                    params.set(
                        "limit",
                        String(
                            exportLimit
                        )
                    );

                    // -------------------------------
                    // SEARCH
                    // -------------------------------

                    if (
                        search.trim()
                    ) {
                        params.set(
                            "search",
                            search.trim()
                        );
                    }

                    // -------------------------------
                    // STATUS
                    // -------------------------------

                    if (
                        activeStatus ===
                        "COMPLETED"
                    ) {
                        params.set(
                            "status",
                            "COMPLETED"
                        );
                    } else if (
                        activeStatus ===
                        "PENDING"
                    ) {
                        params.set(
                            "status",
                            "SCHEDULED"
                        );
                    } else if (
                        activeStatus ===
                        "IN PROGRESS"
                    ) {
                        params.set(
                            "status",
                            "IN_PROGRESS"
                        );
                    } else if (
                        activeStatus ===
                        "CANCELLED"
                    ) {
                        params.set(
                            "status",
                            "CANCELLED"
                        );
                    }

                    const response =
                        await apiFetch(
                            `/api/tasks?${params.toString()}`
                        );

                    let data;

                    try {
                        data =
                            await response.json();
                    } catch {
                        throw new Error(
                            "Server returned an invalid response."
                        );
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data?.message ||
                            "Failed to export tasks"
                        );
                    }

                    const pageTasks =
                        Array.isArray(
                            data
                                ?.data
                                ?.tasks
                        )
                            ? data
                                .data
                                .tasks
                            : Array.isArray(
                                data?.tasks
                            )
                                ? data.tasks
                                : [];

                    const supervisorTasks =
                        pageTasks.filter(
                            (task) =>
                                String(
                                    task
                                        ?.assignedTo
                                        ?.role ||
                                    ""
                                ).toUpperCase() ===
                                "SUPERVISOR"
                        );

                    exportTasks.push(
                        ...supervisorTasks
                    );

                    const pagination =
                        data
                            ?.data
                            ?.pagination ||
                        data?.pagination ||
                        {};

                    const reportedTotalPages =
                        Number(
                            pagination?.totalPages ||
                            pagination?.pages ||
                            0
                        );

                    const reportedTotal =
                        Number(
                            pagination?.total ||
                            exportTasks.length
                        );

                    totalPagesToFetch =
                        reportedTotalPages >
                            0
                            ? reportedTotalPages
                            : Math.max(
                                1,
                                Math.ceil(
                                    reportedTotal /
                                    exportLimit
                                )
                            );

                    exportPage += 1;
                } while (
                    exportPage <=
                    totalPagesToFetch &&
                    exportPage <=
                    1000
                );

                // =================================================
                // EXCEL ROWS
                // =================================================

                const rows =
                    exportTasks.map(
                        (task) => ({
                            "Task ID":
                                task?.id ||
                                "",

                            "Task Title":
                                task?.title ||
                                task?.taskType ||
                                "Untitled Task",

                            Status:
                                getStatusLabel(
                                    task?.status
                                ),

                            Priority:
                                getPriorityLabel(
                                    task?.priority
                                ),

                            Supervisor:
                                task
                                    ?.assignedTo
                                    ?.name ||
                                "Unassigned",

                            "Supervisor Email":
                                task
                                    ?.assignedTo
                                    ?.email ||
                                "",

                            Site:
                                task
                                    ?.site
                                    ?.name ||
                                task?.siteName ||
                                "",

                            "Site Code":
                                task
                                    ?.site
                                    ?.siteCode ||
                                "",

                            "Site Address":
                                getSiteAddress(
                                    task
                                ),

                            "Scheduled At":
                                formatDateTime(
                                    task?.scheduledAt
                                ),

                            "Whole Day":
                                task?.wholeDay
                                    ? "Yes"
                                    : "No",

                            "Show In Advance":
                                task
                                    ?.showInAdvance
                                    ? "Yes"
                                    : "No",

                            "Show After Missed":
                                task
                                    ?.showAfterMissed
                                    ? "Yes"
                                    : "No",

                            Description:
                                task?.description ||
                                "",

                            "Created At":
                                formatDateTime(
                                    task?.createdAt
                                ),

                            "Completed At":
                                formatDateTime(
                                    task?.completedAt
                                ),
                        })
                    );

                const headers = [
                    "Task ID",
                    "Task Title",
                    "Status",
                    "Priority",
                    "Supervisor",
                    "Supervisor Email",
                    "Site",
                    "Site Code",
                    "Site Address",
                    "Scheduled At",
                    "Whole Day",
                    "Show In Advance",
                    "Show After Missed",
                    "Description",
                    "Created At",
                    "Completed At",
                ];

                const worksheet =
                    XLSX.utils.json_to_sheet(
                        rows,
                        {
                            header:
                                headers,
                        }
                    );

                worksheet[
                    "!cols"
                ] = [
                        { wch: 40 },
                        { wch: 35 },
                        { wch: 15 },
                        { wch: 12 },
                        { wch: 24 },
                        { wch: 35 },
                        { wch: 28 },
                        { wch: 15 },
                        { wch: 50 },
                        { wch: 25 },
                        { wch: 12 },
                        { wch: 18 },
                        { wch: 20 },
                        { wch: 50 },
                        { wch: 25 },
                        { wch: 25 },
                    ];

                worksheet[
                    "!freeze"
                ] = {
                    xSplit: 0,
                    ySplit: 1,
                };

                const workbook =
                    XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "Task Details"
                );

                XLSX.writeFile(
                    workbook,
                    "task-details.xlsx"
                );

                setMessage(
                    exportTasks.length >
                        0
                        ? `${exportTasks.length} task${exportTasks.length ===
                            1
                            ? ""
                            : "s"
                        } exported successfully.`
                        : "Excel file downloaded. No matching tasks were found."
                );
            } catch (error) {
                console.error(
                    "Task export error:",
                    error
                );

                setMessage(
                    error?.message ||
                    "Failed to export tasks"
                );
            } finally {
                setExporting(
                    false
                );
            }
        };

    // =========================================================
    // OPEN TASK DETAILS
    // =========================================================

    const handleOpenTask =
        async (
            taskId
        ) => {
            try {
                setLoadingTask(
                    true
                );

                setMessage("");

                const response =
                    await apiFetch(
                        `/api/tasks/${taskId}`
                    );

                const data =
                    await response.json();

                if (
                    !response.ok
                ) {
                    throw new Error(
                        data?.message ||
                        "Failed to load task details"
                    );
                }

                const task =
                    data?.data
                        ?.task ||
                    data?.task ||
                    null;

                if (
                    task &&
                    String(
                        task
                            ?.assignedTo
                            ?.role ||
                        ""
                    ).toUpperCase() !==
                    "SUPERVISOR"
                ) {
                    throw new Error(
                        "Only Supervisor tasks are available here."
                    );
                }

                setSelectedTask(
                    task
                );
            } catch (error) {
                console.error(
                    "Task details error:",
                    error
                );

                setMessage(
                    error?.message ||
                    "Failed to load task details"
                );
            } finally {
                setLoadingTask(
                    false
                );
            }
        };

    // =========================================================
    // PAGINATION
    // =========================================================

    const totalPages =
        Math.max(
            Math.ceil(
                total /
                Math.max(
                    Number(
                        pageSize
                    ),
                    1
                )
            ),
            1
        );

    const showingFrom =
        total === 0
            ? 0
            : (page - 1) *
            Number(
                pageSize
            ) +
            1;

    const showingTo =
        Math.min(
            page *
            Number(
                pageSize
            ),
            total
        );

    // =========================================================
    // STATUS CARDS
    // =========================================================

    const statusCards =
        useMemo(
            () =>
                STATUS_CONFIG.map(
                    (card) => ({
                        ...card,

                        value:
                            statusCounts[
                            card.status ===
                                "SCHEDULED"
                                ? "PENDING"
                                : card.status
                            ] || 0,
                    })
                ),
            [statusCounts]
        );

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="task-details-page">
            {/* =================================================
                STATUS CARDS
            ================================================= */}

            <section className="task-status-cards">
                {statusCards.map(
                    (card) => {
                        const Icon =
                            card.icon;

                        const isActive =
                            activeStatus ===
                            card.label;

                        return (
                            <button
                                type="button"
                                key={
                                    card.label
                                }
                                className={`task-status-card ${card.className
                                    } ${isActive
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() => {
                                    setActiveStatus(
                                        isActive
                                            ? "ALL"
                                            : card.label
                                    );

                                    setPage(
                                        1
                                    );
                                }}
                            >
                                <div className="task-status-icon">
                                    <Icon
                                        size={
                                            31
                                        }
                                    />
                                </div>

                                <div className="task-status-info">
                                    <span>
                                        {
                                            card.label
                                        }
                                    </span>

                                    <strong>
                                        {
                                            card.value
                                        }
                                    </strong>
                                </div>
                            </button>
                        );
                    }
                )}
            </section>

            {/* =================================================
                TABLE CARD
            ================================================= */}

            <section className="task-details-card">
                {/* TOOLBAR */}
                <div className="task-details-toolbar">
                    <div className="task-details-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                        <Search
                            size={
                                18
                            }
                        />
                    </div>

                    <button
                        type="button"
                        className="task-details-export"
                        onClick={
                            handleExport
                        }
                        disabled={
                            exporting
                        }
                        title={
                            exporting
                                ? "Preparing Excel file..."
                                : "Download Excel"
                        }
                        aria-label={
                            exporting
                                ? "Preparing Excel file"
                                : "Download task details as Excel"
                        }
                    >
                        <Download
                            size={
                                18
                            }
                        />
                    </button>
                </div>

                {/* MESSAGE */}
                {message && (
                    <div className="task-details-message">
                        {
                            message
                        }
                    </div>
                )}

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="task-details-table-wrapper">
                    <table className="task-details-table">
                        <thead>
                            <tr>
                                <th>
                                    <MessageCircle
                                        size={
                                            14
                                        }
                                    />
                                </th>

                                <th>
                                    Task Details
                                </th>

                                <th>
                                    Task No
                                </th>

                                <th>
                                    Site
                                </th>

                                <th>
                                    Supervisor
                                </th>

                                <th>
                                    Task Title
                                </th>

                                <th>
                                    Priority
                                </th>

                                <th>
                                    Scheduled At
                                </th>

                                <th>
                                    Whole Day
                                </th>

                                <th>
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="task-details-empty"
                                    >
                                        Loading tasks...
                                    </td>
                                </tr>
                            ) : (
                                tasks.map(
                                    (
                                        task
                                    ) => (
                                        <tr
                                            key={
                                                task.id
                                            }
                                        >
                                            {/* COMMENT / VIEW ICON */}
                                            <td className="task-comment-cell">
                                                <button
                                                    type="button"
                                                    className="task-details-icon-button"
                                                    onClick={() =>
                                                        handleOpenTask(
                                                            task.id
                                                        )
                                                    }
                                                    title="View task details"
                                                >
                                                    <MessageCircle
                                                        size={
                                                            15
                                                        }
                                                    />
                                                </button>
                                            </td>

                                            {/* VIEW DETAILS */}
                                            <td>
                                                <button
                                                    type="button"
                                                    className="task-updates-link"
                                                    onClick={() =>
                                                        handleOpenTask(
                                                            task.id
                                                        )
                                                    }
                                                >
                                                    VIEW
                                                    <br />
                                                    DETAILS
                                                </button>
                                            </td>

                                            {/* TASK ID */}
                                            <td>
                                                {
                                                    task.id
                                                }
                                            </td>

                                            {/* SITE */}
                                            <td>
                                                <strong>
                                                    {getSiteName(
                                                        task
                                                    )}
                                                </strong>

                                                <br />

                                                <small>
                                                    {
                                                        task
                                                            ?.site
                                                            ?.siteCode ||
                                                        "—"
                                                    }
                                                </small>
                                            </td>

                                            {/* SUPERVISOR */}
                                            <td>
                                                {getSupervisorName(
                                                    task
                                                )}
                                            </td>

                                            {/* TASK TITLE */}
                                            <td>
                                                {getTaskTitle(
                                                    task
                                                )}
                                            </td>

                                            {/* PRIORITY */}
                                            <td>
                                                {getPriorityLabel(
                                                    task.priority
                                                )}
                                            </td>

                                            {/* SCHEDULE */}
                                            <td>
                                                {formatDateTime(
                                                    task.scheduledAt
                                                )}
                                            </td>

                                            {/* WHOLE DAY */}
                                            <td>
                                                {task.wholeDay
                                                    ? "Yes"
                                                    : "No"}
                                            </td>

                                            {/* STATUS */}
                                            <td>
                                                <span
                                                    className={`task-detail-status ${getStatusClass(
                                                        task.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        task.status
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}

                            {!loading &&
                                tasks.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="task-details-empty"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="task-details-footer">
                    <span>
                        Showing{" "}
                        {
                            showingFrom
                        }{" "}
                        to{" "}
                        {
                            showingTo
                        }{" "}
                        of{" "}
                        {total}{" "}
                        entries
                    </span>

                    <div className="task-details-show">
                        <span>
                            Show
                        </span>

                        <select
                            value={
                                pageSize
                            }
                            onChange={(
                                event
                            ) =>
                                setPageSize(
                                    event
                                        .target
                                        .value
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

                            <option value="100">
                                100
                            </option>
                        </select>

                        <span>
                            entries
                        </span>
                    </div>

                    <div className="task-details-pagination">
                        <button
                            type="button"
                            disabled={
                                page <=
                                1
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.max(
                                            current -
                                            1,
                                            1
                                        )
                                )
                            }
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            {
                                page
                            }
                        </button>

                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.min(
                                            current +
                                            1,
                                            totalPages
                                        )
                                )
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {/* =================================================
                TASK DETAIL MODAL
            ================================================= */}

            {selectedTask && (
                <div
                    className="task-details-modal-overlay"
                    onClick={() =>
                        setSelectedTask(
                            null
                        )
                    }
                >
                    <div
                        className="task-details-modal"
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        {/* HEADER */}
                        <div className="task-details-modal-header">
                            <div>
                                <h2>
                                    Task Details
                                </h2>

                                <p>
                                    {
                                        selectedTask.id
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTask(
                                        null
                                    )
                                }
                                title="Close"
                            >
                                <X
                                    size={
                                        20
                                    }
                                />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="task-details-modal-body">
                            {/* TASK TITLE */}
                            <div className="task-detail-field">
                                <span>
                                    Task Title
                                </span>

                                <strong>
                                    {selectedTask.title ||
                                        "—"}
                                </strong>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="task-detail-field">
                                <span>
                                    Description
                                </span>

                                <strong>
                                    {selectedTask.description ||
                                        "—"}
                                </strong>
                            </div>

                            {/* CLIENT DETAILS (ALWAYS VISIBLE) */}
                            {(() => {
                                const details = extractClientDetails(selectedTask.description, selectedTask);
                                return (
                                    <>
                                        {/* CLIENT NAME */}
                                        <div className="task-detail-field">
                                            <span>Client</span>
                                            <strong>{details.client || "—"}</strong>
                                        </div>

                                        {/* CLIENT MOBILE (ALWAYS VISIBLE WITH CALL LINK OR DASH) */}
                                        <div className="task-detail-field">
                                            <span>Client Mobile</span>
                                            <strong>
                                                {details.mobile ? (
                                                    <a
                                                        href={`tel:${details.mobile}`}
                                                        style={{
                                                            color: "#2563eb",
                                                            textDecoration: "none",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <Phone size={14} />
                                                        {details.mobile}
                                                    </a>
                                                ) : (
                                                    "—"
                                                )}
                                            </strong>
                                        </div>

                                        {/* CLIENT EMAIL */}
                                        <div className="task-detail-field">
                                            <span>Client Email</span>
                                            <strong>
                                                {details.email ? (
                                                    <a
                                                        href={`mailto:${details.email}`}
                                                        style={{ color: "#2563eb", textDecoration: "none" }}
                                                    >
                                                        {details.email}
                                                    </a>
                                                ) : (
                                                    "—"
                                                )}
                                            </strong>
                                        </div>
                                    </>
                                );
                            })()}

                            {/* STATUS */}
                            <div className="task-detail-field">
                                <span>
                                    Status
                                </span>

                                <strong>
                                    {getStatusLabel(
                                        selectedTask.status
                                    )}
                                </strong>
                            </div>

                            {/* PRIORITY */}
                            <div className="task-detail-field">
                                <span>
                                    Priority
                                </span>

                                <strong>
                                    {getPriorityLabel(
                                        selectedTask.priority
                                    )}
                                </strong>
                            </div>

                            {/* SCHEDULE */}
                            <div className="task-detail-field">
                                <span>
                                    Scheduled At
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedTask.scheduledAt
                                    )}
                                </strong>
                            </div>

                            {/* WHOLE DAY */}
                            <div className="task-detail-field">
                                <span>
                                    Whole Day
                                </span>

                                <strong>
                                    {selectedTask.wholeDay
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                            {/* SHOW IN ADVANCE */}
                            <div className="task-detail-field">
                                <span>
                                    Show In Advance
                                </span>

                                <strong>
                                    {selectedTask.showInAdvance
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                            {/* SHOW AFTER MISSED */}
                            <div className="task-detail-field">
                                <span>
                                    Show After Missed
                                </span>

                                <strong>
                                    {selectedTask.showAfterMissed
                                        ? "Yes"
                                        : "No"}
                                </strong>
                            </div>

                            {/* SUPERVISOR */}
                            <div className="task-detail-field">
                                <span>
                                    Supervisor
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.assignedTo
                                        ?.name ||
                                        "—"}
                                </strong>
                            </div>

                            {/* SUPERVISOR EMAIL */}
                            <div className="task-detail-field">
                                <span>
                                    Supervisor Email
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.assignedTo
                                        ?.email ||
                                        "—"}
                                </strong>
                            </div>

                            {/* ASSIGNED BY */}
                            <div className="task-detail-field">
                                <span>
                                    Assigned By
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.assignedBy
                                        ?.name ||
                                        "—"}
                                </strong>
                            </div>

                            {/* SITE */}
                            <div className="task-detail-field">
                                <span>
                                    Site
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.site
                                        ?.name ||
                                        "—"}
                                </strong>
                            </div>

                            {/* SITE CODE */}
                            <div className="task-detail-field">
                                <span>
                                    Site Code
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.site
                                        ?.siteCode ||
                                        "—"}
                                </strong>
                            </div>

                            {/* SITE ADDRESS */}
                            <div className="task-detail-field">
                                <span>
                                    Site Address
                                </span>

                                <strong>
                                    {getSiteAddress(
                                        selectedTask
                                    )}
                                </strong>
                            </div>

                            {/* CAMPAIGN */}
                            <div className="task-detail-field">
                                <span>
                                    Campaign
                                </span>

                                <strong>
                                    {selectedTask
                                        ?.campaign
                                        ?.name ||
                                        "—"}
                                </strong>
                            </div>

                            {/* CREATED AT */}
                            <div className="task-detail-field">
                                <span>
                                    Created At
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedTask.createdAt
                                    )}
                                </strong>
                            </div>

                            {/* COMPLETED AT */}
                            <div className="task-detail-field">
                                <span>
                                    Completed At
                                </span>

                                <strong>
                                    {formatDateTime(
                                        selectedTask.completedAt
                                    )}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LOADING OVERLAY */}
            {loadingTask && (
                <div className="task-details-loading-overlay">
                    Loading task details...
                </div>
            )}
        </div>
    );
};

export default TaskDetails;
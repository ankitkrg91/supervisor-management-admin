import { useEffect, useMemo, useState } from "react";

import {
    CalendarDays,
    ChevronDown,
} from "lucide-react";

import { apiFetch } from "../../utils/api";

import "./Dashboard.css";

const MultiSelect = ({
    label,
    value,
    options,
    onChange,
}) => {
    const [open, setOpen] =
        useState(false);

    return (
        <div className="task-filter-group">
            <label>{label}</label>

            <div
                className="task-multi-select"
                onClick={() =>
                    setOpen((current) => !current)
                }
            >
                <span>{value}</span>

                <ChevronDown size={16} />

                {open && (
                    <div className="task-dropdown">
                        {options.map(
                            (option) => (
                                <label
                                    key={option}
                                    className="task-dropdown-option"
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            value.includes(
                                                option
                                            )
                                        }
                                        onChange={() =>
                                            onChange(
                                                option
                                            )
                                        }
                                    />

                                    <span>
                                        {option}
                                    </span>
                                </label>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskDashboard = () => {
    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [tasks, setTasks] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedPriorities, setSelectedPriorities] =
        useState([]);

    const [selectedStatuses, setSelectedStatuses] =
        useState([]);

    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const firstResponse =
                await apiFetch(
                    "/api/tasks?page=1&limit=100",
                    {
                        method: "GET",
                    }
                );

            const firstData =
                await firstResponse.json();

            if (!firstResponse.ok) {
                throw new Error(
                    firstData?.message ||
                    "Failed to fetch tasks"
                );
            }

            const firstTasks =
                firstData?.data?.tasks || [];

            const totalPages =
                firstData?.data?.pagination
                    ?.totalPages || 1;

            let allTasks = [
                ...firstTasks,
            ];

            /*
             * The backend supports pagination.
             * Fetch remaining pages so the
             * dashboard totals are not limited
             * to the first 100 records.
             */
            if (totalPages > 1) {
                for (
                    let page = 2;
                    page <= totalPages;
                    page++
                ) {
                    const response =
                        await apiFetch(
                            `/api/tasks?page=${page}&limit=100`,
                            {
                                method: "GET",
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data?.message ||
                            "Failed to fetch task page"
                        );
                    }

                    allTasks = [
                        ...allTasks,
                        ...(data?.data?.tasks ||
                            []),
                    ];
                }
            }

            setTasks(allTasks);
        } catch (error) {
            console.error(
                "Failed to fetch task dashboard:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch task dashboard"
            );

            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllTasks();

        const interval =
            setInterval(() => {
                fetchAllTasks();
            }, 60000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const priorityOptions = [
        "LOW",
        "MEDIUM",
        "HIGH",
    ];

    const statusOptions = [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ];

    const togglePriority = (priority) => {
        setSelectedPriorities(
            (current) =>
                current.includes(priority)
                    ? current.filter(
                        (item) =>
                            item !==
                            priority
                    )
                    : [
                        ...current,
                        priority,
                    ]
        );
    };

    const toggleStatus = (status) => {
        setSelectedStatuses(
            (current) =>
                current.includes(status)
                    ? current.filter(
                        (item) =>
                            item !==
                            status
                    )
                    : [
                        ...current,
                        status,
                    ]
        );
    };

    const isWithinDateRange = (
        task
    ) => {
        if (!fromDate && !toDate) {
            return true;
        }

        if (!task?.scheduledAt) {
            return false;
        }

        const taskDate =
            new Date(
                task.scheduledAt
            );

        if (Number.isNaN(taskDate.getTime())) {
            return false;
        }

        if (fromDate) {
            const start =
                new Date(
                    `${fromDate}T00:00:00`
                );

            if (taskDate < start) {
                return false;
            }
        }

        if (toDate) {
            const end =
                new Date(
                    `${toDate}T23:59:59.999`
                );

            if (taskDate > end) {
                return false;
            }
        }

        return true;
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesPriority =
                selectedPriorities.length ===
                0 ||
                selectedPriorities.includes(
                    task.priority
                );

            const matchesStatus =
                selectedStatuses.length ===
                0 ||
                selectedStatuses.includes(
                    task.status
                );

            return (
                matchesPriority &&
                matchesStatus &&
                isWithinDateRange(task)
            );
        });
    }, [
        tasks,
        fromDate,
        toDate,
        selectedPriorities,
        selectedStatuses,
    ]);

    const getStatusStats = (
        status
    ) => {
        const total =
            filteredTasks.length;

        const count =
            filteredTasks.filter(
                (task) =>
                    task.status === status
            ).length;

        const percentage =
            total > 0
                ? (count / total) *
                100
                : 0;

        return {
            count,
            total,
            percentage,
        };
    };

    const statusStats = {
        SCHEDULED:
            getStatusStats(
                "SCHEDULED"
            ),

        IN_PROGRESS:
            getStatusStats(
                "IN_PROGRESS"
            ),

        COMPLETED:
            getStatusStats(
                "COMPLETED"
            ),

        CANCELLED:
            getStatusStats(
                "CANCELLED"
            ),
    };

    const priorityLabel = () => {
        if (
            selectedPriorities.length ===
            0
        ) {
            return "ALL SELECTED";
        }

        return selectedPriorities.join(
            ", "
        );
    };

    const statusLabel = () => {
        if (
            selectedStatuses.length === 0
        ) {
            return "ALL SELECTED";
        }

        return selectedStatuses.join(
            ", "
        );
    };

    const handleApply = () => {
        /*
         * Filtering is already reactive.
         * This button is kept because it
         * matches the existing interface.
         */
        console.log(
            "Task dashboard filters applied",
            {
                fromDate,
                toDate,
                selectedPriorities,
                selectedStatuses,
            }
        );
    };

    const renderStatusCard = (
        title,
        status,
        stats
    ) => {
        return (
            <div
                className="task-type-card"
                key={status}
            >
                <div className="task-type-top">
                    <span className="task-type-name">
                        {title}
                    </span>

                    <span className="task-type-percentage">
                        {stats.percentage.toFixed(
                            2
                        )}
                        %
                    </span>
                </div>

                <div className="task-progress">
                    <div
                        className="task-progress-fill"
                        style={{
                            width: `${stats.percentage}%`,
                        }}
                    />
                </div>

                <div className="task-type-bottom">
                    <div>
                        <div className="task-count">
                            {stats.count}
                            <span>
                                {" "}
                                /{" "}
                                {
                                    stats.total
                                }
                            </span>
                        </div>

                        <div className="task-label">
                            {status ===
                                "COMPLETED"
                                ? "TASKS COMPLETED"
                                : "TASKS"}
                        </div>
                    </div>

                    <div className="task-incidents">
                        <div className="incident-count">
                            {status ===
                                "SCHEDULED"
                                ? stats.count
                                : 0}
                        </div>

                        <div className="task-label">
                            {status ===
                                "SCHEDULED"
                                ? "PENDING TASKS"
                                : "OPEN INCIDENTS"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="task-dashboard-page">

            {/* =========================
                FILTER
            ========================= */}

            <section className="task-filter-card">

                <div className="task-filter-title">
                    <CalendarDays
                        size={16}
                    />

                    <span>
                        Filter:
                    </span>
                </div>

                <div className="task-filter-group">

                    <label>
                        From
                    </label>

                    <div className="task-date-input">
                        <input
                            type="date"
                            value={
                                fromDate
                            }
                            onChange={(e) =>
                                setFromDate(
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                </div>

                <div className="task-filter-group">

                    <label>
                        To
                    </label>

                    <div className="task-date-input">
                        <input
                            type="date"
                            value={
                                toDate
                            }
                            onChange={(e) =>
                                setToDate(
                                    e.target
                                        .value
                                )
                            }
                        />
                    </div>

                </div>

                <MultiSelect
                    label="Priority"
                    value={
                        priorityLabel()
                    }
                    options={
                        priorityOptions
                    }
                    onChange={
                        togglePriority
                    }
                />

                <MultiSelect
                    label="Status"
                    value={
                        statusLabel()
                    }
                    options={
                        statusOptions
                    }
                    onChange={
                        toggleStatus
                    }
                />

                <button
                    type="button"
                    className="task-apply-button"
                    onClick={
                        handleApply
                    }
                >
                    Apply
                </button>

            </section>

            {/* =========================
                ERROR
            ========================= */}

            {error && (
                <div
                    style={{
                        marginBottom:
                            "16px",
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

            {/* =========================
                OVERVIEW
            ========================= */}

            <section className="task-overview">

                <h1>
                    Task Status Wise Overview
                </h1>

                {loading ? (
                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                        }}
                    >
                        Loading task dashboard...
                    </div>
                ) : filteredTasks.length ===
                    0 ? (
                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                        }}
                    >
                        No tasks found.
                    </div>
                ) : (
                    <div className="task-type-grid">

                        {renderStatusCard(
                            "SCHEDULED",
                            "SCHEDULED",
                            statusStats.SCHEDULED
                        )}

                        {renderStatusCard(
                            "IN PROGRESS",
                            "IN_PROGRESS",
                            statusStats.IN_PROGRESS
                        )}

                        {renderStatusCard(
                            "COMPLETED",
                            "COMPLETED",
                            statusStats.COMPLETED
                        )}

                        {renderStatusCard(
                            "CANCELLED",
                            "CANCELLED",
                            statusStats.CANCELLED
                        )}

                    </div>
                )}

            </section>

        </div>
    );
};

export default TaskDashboard;
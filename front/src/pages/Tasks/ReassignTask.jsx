import { useEffect, useMemo, useState } from "react";
import {
    ArrowRightLeft,
    CheckCircle,
    Search,
    UserRound,
    AlertTriangle,
} from "lucide-react";

import { apiFetch } from "../../utils/api";
import "./ReassignTask.css";

const ReassignTask = () => {
    const [tasks, setTasks] = useState([]);
    const [supervisors, setSupervisors] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);
    const [assignedTo, setAssignedTo] = useState("");

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [loadingSupervisors, setLoadingSupervisors] =
        useState(false);

    const [status, setStatus] = useState("");

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDateTime = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    // =========================================================
    // FETCH SUPERVISORS
    // =========================================================

    const fetchSupervisors = async () => {
        try {
            setLoadingSupervisors(true);

            const response = await apiFetch("/api/users");
            const data = await response.json();

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

            const activeSupervisors = users.filter(
                (user) =>
                    user?.role === "SUPERVISOR" &&
                    user?.status === "ACTIVE"
            );

            setSupervisors(activeSupervisors);
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

    // =========================================================
    // FETCH TASKS
    // =========================================================

    const fetchTasks = async () => {
        try {
            setLoadingTasks(true);
            setStatus("");

            const response = await apiFetch(
                "/api/tasks?limit=100"
            );

            const data = await response.json();

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

            const supervisorTasks = Array.isArray(
                taskList
            )
                ? taskList.filter(
                    (task) =>
                        String(
                            task?.assignedTo?.role ||
                            ""
                        ).toUpperCase() ===
                        "SUPERVISOR" &&
                        task?.status !== "COMPLETED" &&
                        task?.status !== "CANCELLED"
                )
                : [];

            setTasks(supervisorTasks);
        } catch (error) {
            console.error(
                "Failed to load tasks:",
                error
            );

            setTasks([]);

            setStatus(
                error?.message ||
                "Failed to load tasks"
            );
        } finally {
            setLoadingTasks(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchTasks();
        fetchSupervisors();
    }, []);

    // =========================================================
    // FILTER TASKS
    // =========================================================

    const filteredTasks = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return tasks;
        }

        return tasks.filter((task) => {
            const title = String(
                task?.title || ""
            ).toLowerCase();

            const supervisor = String(
                task?.assignedTo?.name || ""
            ).toLowerCase();

            const supervisorEmail = String(
                task?.assignedTo?.email || ""
            ).toLowerCase();

            const site = String(
                task?.site?.name || ""
            ).toLowerCase();

            const siteCode = String(
                task?.site?.siteCode || ""
            ).toLowerCase();

            return (
                title.includes(value) ||
                supervisor.includes(value) ||
                supervisorEmail.includes(value) ||
                site.includes(value) ||
                siteCode.includes(value)
            );
        });
    }, [tasks, search]);

    // =========================================================
    // SELECT TASK
    // =========================================================

    const handleSelectTask = (task) => {
        setSelectedTask(task);
        setAssignedTo("");
        setStatus("");
    };

    // =========================================================
    // REASSIGN SINGLE TASK
    // =========================================================

    const handleReassign = async () => {
        if (!selectedTask) {
            setStatus("Please select a task first.");
            return;
        }

        if (!assignedTo) {
            setStatus(
                "Please select a supervisor."
            );
            return;
        }

        if (
            String(selectedTask?.assignedToId || "") ===
            String(assignedTo)
        ) {
            setStatus(
                "Please select a different supervisor."
            );
            return;
        }

        try {
            setLoading(true);
            setStatus("");

            const response = await apiFetch(
                `/api/tasks/${selectedTask.id}/reassign`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        assignedToId: assignedTo,
                    }),
                }
            );

            let data;

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Task reassignment failed."
                );
            }

            setStatus(
                data?.message ||
                "Task reassigned successfully."
            );

            setSelectedTask(null);
            setAssignedTo("");

            await fetchTasks();

            window.dispatchEvent(
                new CustomEvent("tasks-updated")
            );
        } catch (error) {
            console.error(
                "Task reassignment error:",
                error
            );

            setStatus(
                error?.message ||
                "Failed to reassign task."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CLEAR
    // =========================================================

    const handleClear = () => {
        setSelectedTask(null);
        setAssignedTo("");
        setStatus("");
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="reassign-bulk-task-page">
            <section className="reassign-bulk-task-card">

                {/* HEADER */}
                <div className="reassign-bulk-header">
                    <div>
                        <h1>Reassign Task</h1>

                        <p>
                            Reassign one existing task
                            to another supervisor.
                        </p>
                    </div>

                    <div className="reassign-bulk-icon">
                        <ArrowRightLeft size={25} />
                    </div>
                </div>

                <div className="reassign-bulk-divider" />

                {/* SEARCH */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "20px",
                    }}
                >
                    <Search size={20} />

                    <input
                        type="text"
                        placeholder="Search task, supervisor, site..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        style={{
                            flex: 1,
                            padding: "12px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}
                    />
                </div>

                {/* TASK LIST */}
                <div
                    style={{
                        overflowX: "auto",
                        marginBottom: "25px",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
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
                                            "12px",
                                    }}
                                >
                                    Select
                                </th>

                                <th
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "12px",
                                    }}
                                >
                                    Task
                                </th>

                                <th
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "12px",
                                    }}
                                >
                                    Supervisor
                                </th>

                                <th
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "12px",
                                    }}
                                >
                                    Site
                                </th>

                                <th
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "12px",
                                    }}
                                >
                                    Scheduled At
                                </th>

                                <th
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "12px",
                                    }}
                                >
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingTasks ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        style={{
                                            padding:
                                                "25px",
                                            textAlign:
                                                "center",
                                        }}
                                    >
                                        Loading tasks...
                                    </td>
                                </tr>
                            ) : filteredTasks.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        style={{
                                            padding:
                                                "25px",
                                            textAlign:
                                                "center",
                                        }}
                                    >
                                        No tasks found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(
                                    (task) => (
                                        <tr
                                            key={
                                                task.id
                                            }
                                            style={{
                                                borderTop:
                                                    "1px solid #e5e7eb",
                                                background:
                                                    selectedTask?.id ===
                                                        task.id
                                                        ? "#f3f4f6"
                                                        : "transparent",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="selectedTask"
                                                    checked={
                                                        selectedTask?.id ===
                                                        task.id
                                                    }
                                                    onChange={() =>
                                                        handleSelectTask(
                                                            task
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        task?.title
                                                    }
                                                </strong>
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {
                                                    task
                                                        ?.assignedTo
                                                        ?.name
                                                }

                                                <br />

                                                <small>
                                                    {
                                                        task
                                                            ?.assignedTo
                                                            ?.email
                                                    }
                                                </small>
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {
                                                    task
                                                        ?.site
                                                        ?.name
                                                }

                                                <br />

                                                <small>
                                                    {
                                                        task
                                                            ?.site
                                                            ?.siteCode
                                                    }
                                                </small>
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {formatDateTime(
                                                    task?.scheduledAt
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {
                                                    task?.status
                                                }
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* TARGET SUPERVISOR */}
                <div className="reassign-user-section">
                    <div className="reassign-user-title">
                        <UserRound size={19} />

                        <div>
                            <h3>
                                Reassign To
                            </h3>

                            <p>
                                Select the active
                                supervisor who should
                                receive this task.
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
                            loadingSupervisors ||
                            !selectedTask
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
                                    {supervisor.name}
                                    {supervisor.email
                                        ? ` - ${supervisor.email}`
                                        : ""}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* WARNING */}
                <div className="reassign-warning">
                    <AlertTriangle size={19} />

                    <div>
                        <strong>
                            Before reassigning
                        </strong>

                        <p>
                            Completed and cancelled
                            tasks cannot be
                            reassigned.
                        </p>
                    </div>
                </div>

                {/* STATUS */}
                {status && (
                    <div className="reassign-status">
                        {status}
                    </div>
                )}

                {/* SELECTED TASK */}
                {selectedTask && (
                    <div
                        className="reassign-result"
                        style={{
                            marginTop: "20px",
                        }}
                    >
                        <div className="reassign-result-header">
                            <CheckCircle size={20} />

                            <h3>
                                Selected Task
                            </h3>
                        </div>

                        <div
                            style={{
                                padding: "15px",
                            }}
                        >
                            <strong>
                                {selectedTask.title}
                            </strong>

                            <p>
                                Current Supervisor:{" "}
                                {
                                    selectedTask
                                        ?.assignedTo
                                        ?.name
                                }
                            </p>

                            <p>
                                Site:{" "}
                                {
                                    selectedTask
                                        ?.site?.name
                                }
                            </p>

                            <p>
                                Scheduled:{" "}
                                {formatDateTime(
                                    selectedTask?.scheduledAt
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="reassign-actions">
                    <button
                        type="button"
                        className="reassign-clear-button"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="reassign-submit-button"
                        onClick={handleReassign}
                        disabled={
                            loading ||
                            !selectedTask ||
                            !assignedTo
                        }
                    >
                        <ArrowRightLeft size={17} />

                        {loading
                            ? "REASSIGNING..."
                            : "REASSIGN TASK"}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ReassignTask;
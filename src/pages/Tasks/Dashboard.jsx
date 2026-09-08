import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import "./Dashboard.css";

const taskTypeData = [
    {
        type: "MFM",
        completed: 29,
        total: 29,
        incidents: 0,
    },
    {
        type: "MSF",
        completed: 403,
        total: 424,
        incidents: 0,
    },
    {
        type: "NIGHT VISIT",
        completed: 9,
        total: 9,
        incidents: 0,
    },
    {
        type: "OTHER VISIT",
        completed: 3,
        total: 3,
        incidents: 0,
    },
];

const MultiSelect = ({ label, value, options }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="task-filter-group">
            <label>{label}</label>

            <div
                className="task-multi-select"
                onClick={() => setOpen(!open)}
            >
                <span>{value}</span>
                <ChevronDown size={16} />

                {open && (
                    <div className="task-dropdown">
                        {options.map((option) => (
                            <label
                                key={option}
                                className="task-dropdown-option"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input type="checkbox" defaultChecked />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskDashboard = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const handleApply = () => {
        console.log("Task dashboard filters applied", {
            fromDate,
            toDate,
        });
    };

    return (
        <div className="task-dashboard-page">
            {/* Filter */}
            <section className="task-filter-card">
                <div className="task-filter-title">
                    <CalendarDays size={16} />
                    <span>Filter:</span>
                </div>

                <div className="task-filter-group">
                    <label>From</label>
                    <div className="task-date-input">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="task-filter-group">
                    <label>To</label>
                    <div className="task-date-input">
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>

                <MultiSelect
                    label="Region"
                    value="ALL SELECTED (12)"
                    options={[
                        "North",
                        "South",
                        "East",
                        "West",
                    ]}
                />

                <MultiSelect
                    label="Branch"
                    value="ALL SELECTED (82)"
                    options={[
                        "Ludhiana",
                        "Chandigarh",
                        "Delhi",
                        "Amritsar",
                    ]}
                />

                <MultiSelect
                    label="Client"
                    value="ALL SELECTED (115...)"
                    options={[
                        "IIFL",
                        "AXIS",
                        "HDFC",
                        "ICICI",
                    ]}
                />

                <button
                    type="button"
                    className="task-apply-button"
                    onClick={handleApply}
                >
                    Apply
                </button>
            </section>

            {/* Overview */}
            <section className="task-overview">
                <h1>Task Type Wise Overview</h1>

                <div className="task-type-grid">
                    {taskTypeData.map((item) => {
                        const percentage =
                            item.total > 0
                                ? (item.completed / item.total) * 100
                                : 0;

                        return (
                            <div
                                className="task-type-card"
                                key={item.type}
                            >
                                <div className="task-type-top">
                                    <span className="task-type-name">
                                        {item.type}
                                    </span>

                                    <span className="task-type-percentage">
                                        {percentage.toFixed(2)}%
                                    </span>
                                </div>

                                <div className="task-progress">
                                    <div
                                        className="task-progress-fill"
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />
                                </div>

                                <div className="task-type-bottom">
                                    <div>
                                        <div className="task-count">
                                            {item.completed}
                                            <span> / {item.total}</span>
                                        </div>

                                        <div className="task-label">
                                            TASKS COMPLETED
                                        </div>
                                    </div>

                                    <div className="task-incidents">
                                        <div className="incident-count">
                                            {item.incidents}
                                        </div>

                                        <div className="task-label">
                                            OPEN INCIDENTS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default TaskDashboard;
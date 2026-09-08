import { useMemo, useState } from "react";
import {
    CheckSquare,
    FileSpreadsheet,
    FileText,
    Printer,
    Search,
    XSquare,
    Users,
    MapPin,
} from "lucide-react";
import "./TaskSummary.css";

const locationData = [
    {
        id: 1,
        location: "18585 - 18585LOHGARH",
        completed: 1,
        missed: 0,
    },
    {
        id: 2,
        location: "18609 - 18609RANIAN",
        completed: 1,
        missed: 0,
    },
    {
        id: 3,
        location: "18662 - 18662RAYYA (2143)",
        completed: 1,
        missed: 0,
    },
    {
        id: 4,
        location: "18665 - 18665SULARGHARAT 3563",
        completed: 1,
        missed: 0,
    },
    {
        id: 5,
        location: "18666 - 18666TAI WANDI BHAI 2832",
        completed: 2,
        missed: 0,
    },
    {
        id: 6,
        location: "21037 - 21037PATRAN",
        completed: 1,
        missed: 0,
    },
    {
        id: 7,
        location: "22719 - 22719DIRBA",
        completed: 1,
        missed: 0,
    },
    {
        id: 8,
        location: "23983 - 239835373 RATTAN PAKHOWAL ROAD",
        completed: 1,
        missed: 0,
    },
    {
        id: 9,
        location: "25289 - 25289PAKHOWAL ROAD 3371",
        completed: 1,
        missed: 0,
    },
    {
        id: 10,
        location: "25528 - 25528JAKHAL ROAD",
        completed: 1,
        missed: 0,
    },
];

const userData = [
    {
        id: 1,
        user: "GURMEET SINGH",
        completed: 1,
        missed: 0,
    },
    {
        id: 2,
        user: "GURVINDER SINGH",
        completed: 4,
        missed: 0,
    },
    {
        id: 3,
        user: "SANJIV KUMAR",
        completed: 13,
        missed: 0,
    },
    {
        id: 4,
        user: "SUKHCHAIN SINGH",
        completed: 4,
        missed: 0,
    },
    {
        id: 5,
        user: "VIKRAM NISCHAL",
        completed: 1,
        missed: 0,
    },
];

const ExportButtons = () => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="task-summary-export-buttons">
            <button
                type="button"
                title="Export Excel"
                onClick={() =>
                    console.log("Excel export will be connected later")
                }
            >
                <FileSpreadsheet size={16} />
            </button>

            <button
                type="button"
                title="Export PDF"
                onClick={() =>
                    console.log("PDF export will be connected later")
                }
            >
                <FileText size={16} />
            </button>

            <button
                type="button"
                title="Print"
                onClick={handlePrint}
            >
                <Printer size={16} />
            </button>
        </div>
    );
};

const SearchBox = ({ value, onChange }) => {
    return (
        <div className="task-summary-search">
            <input
                type="text"
                placeholder="Search..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <Search size={17} />
        </div>
    );
};

const TaskSummary = () => {
    const [locationSearch, setLocationSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const filteredLocations = useMemo(() => {
        const search = locationSearch.toLowerCase().trim();

        if (!search) {
            return locationData;
        }

        return locationData.filter((item) =>
            item.location.toLowerCase().includes(search)
        );
    }, [locationSearch]);

    const filteredUsers = useMemo(() => {
        const search = userSearch.toLowerCase().trim();

        if (!search) {
            return userData;
        }

        return userData.filter((item) =>
            item.user.toLowerCase().includes(search)
        );
    }, [userSearch]);

    const totalCompleted = locationData.reduce(
        (sum, item) => sum + item.completed,
        0
    );

    const totalMissed = locationData.reduce(
        (sum, item) => sum + item.missed,
        0
    );

    const totalTasks = totalCompleted + totalMissed;

    const completionPercentage =
        totalTasks > 0
            ? (totalCompleted / totalTasks) * 100
            : 0;

    return (
        <div className="task-summary-page">

            {/* =========================
          TOP TASK STATUS CHART
      ========================= */}

            <section className="task-summary-chart-card">
                <div className="task-summary-chart-header">
                    <h1>Task Summary</h1>
                </div>

                <div className="task-summary-chart-content">
                    <div className="task-donut">
                        <div
                            className="task-donut-progress"
                            style={{
                                background: `conic-gradient(
                  #16a34a ${completionPercentage}%,
                  #dc2626 ${completionPercentage}% 100%
                )`,
                            }}
                        >
                            <div className="task-donut-inner">
                                <strong>
                                    {completionPercentage.toFixed(0)}%
                                </strong>
                                <span>COMPLETED</span>
                            </div>
                        </div>
                    </div>

                    <div className="task-summary-legend">
                        <div className="legend-item">
                            <span className="legend-dot completed" />
                            <span>COMPLETED</span>
                        </div>

                        <div className="legend-item">
                            <span className="legend-dot missed" />
                            <span>MISSED</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================
          TABLES
      ========================= */}

            <div className="task-summary-tables">

                {/* LOCATION TABLE */}

                <section className="task-summary-table-card">
                    <div className="task-summary-table-toolbar">
                        <SearchBox
                            value={locationSearch}
                            onChange={setLocationSearch}
                        />

                        <ExportButtons />
                    </div>

                    <div className="task-summary-table-wrapper">
                        <table className="task-summary-table">
                            <thead>
                                <tr>
                                    <th>
                                        <span>
                                            <MapPin size={14} />
                                            Location
                                        </span>
                                        <small>↕</small>
                                    </th>

                                    <th>
                                        <span>
                                            <CheckSquare size={14} />
                                            Completed
                                        </span>
                                        <small>↕</small>
                                    </th>

                                    <th>
                                        <span>
                                            <XSquare size={14} />
                                            MISSED
                                        </span>
                                        <small>↕</small>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLocations.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <a href="#location">
                                                {item.location}
                                            </a>
                                        </td>

                                        <td>
                                            <a href="#completed">
                                                {item.completed}
                                            </a>
                                        </td>

                                        <td>
                                            <a href="#missed">
                                                {item.missed}
                                            </a>
                                        </td>
                                    </tr>
                                ))}

                                {filteredLocations.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="task-summary-empty"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="task-summary-table-footer">
                        <span>
                            Showing 1 to {filteredLocations.length} of{" "}
                            {filteredLocations.length} entries
                        </span>

                        <div className="task-summary-pagination">
                            <button disabled>Previous</button>
                            <button className="active">1</button>
                            <button disabled>Next</button>
                        </div>
                    </div>
                </section>

                {/* USER TABLE */}

                <section className="task-summary-table-card">
                    <div className="task-summary-table-toolbar">
                        <SearchBox
                            value={userSearch}
                            onChange={setUserSearch}
                        />

                        <ExportButtons />
                    </div>

                    <div className="task-summary-table-wrapper">
                        <table className="task-summary-table user-table">
                            <thead>
                                <tr>
                                    <th>
                                        <span>
                                            <Users size={14} />
                                            Users
                                        </span>
                                        <small>↕</small>
                                    </th>

                                    <th>
                                        <span>
                                            <CheckSquare size={14} />
                                            Completed
                                        </span>
                                        <small>↕</small>
                                    </th>

                                    <th>
                                        <span>
                                            <XSquare size={14} />
                                            Missed
                                        </span>
                                        <small>↕</small>
                                    </th>

                                    <th>
                                        <span>Total</span>
                                        <small>↕</small>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((item) => {
                                    const total =
                                        item.completed + item.missed;

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <a href="#user">{item.user}</a>
                                            </td>

                                            <td>
                                                <a href="#user-completed">
                                                    {item.completed}
                                                </a>
                                            </td>

                                            <td>
                                                <a href="#user-missed">
                                                    {item.missed}
                                                </a>
                                            </td>

                                            <td>
                                                <a href="#user-total">
                                                    {total}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="task-summary-empty"
                                        >
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="task-summary-table-footer">
                        <span>
                            Showing 1 to {filteredUsers.length} of{" "}
                            {filteredUsers.length} entries
                        </span>

                        <div className="task-summary-show">
                            <span>Show</span>
                            <select defaultValue="10">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="task-summary-pagination">
                            <button disabled>Previous</button>
                            <button className="active">1</button>
                            <button disabled>Next</button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default TaskSummary;
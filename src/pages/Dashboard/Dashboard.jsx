import { useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronDown,
    Check,
    Filter,
    Users,
    Wifi,
    WifiOff,
    BatteryLow,
    LogIn,
    MapPin,
    ClipboardList,
    CheckCircle2,
    Clock3,
    XCircle,
    AlertTriangle,
    ArrowUpRight,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

import "./Dashboard.css";

const regionOptions = [
    "AHMEDABAD",
    "ARUNACHAL PRADESH",
    "AUNDH PUNE",
    "AURANGABAD",
    "BADDI",
    "BANASWADI - BENGALURU",
    "BENGALURU - AIRPORT",
    "BHOPAL",
    "CHANDIGARH",
    "CHENNAI",
];

const branchOptions = [
    "LUDHIANA",
    "CHANDIGARH",
    "AMRITSAR",
    "JALANDHAR",
    "PATIALA",
    "DELHI",
    "AHMEDABAD",
    "BENGALURU",
    "PUNE",
    "MUMBAI",
];

const clientOptions = [
    "HDFC BANK LTD.",
    "AXIS BANK LIMITED",
    "IIFL FINANCE LIMITED",
    "IDFC FIRST BANK LIMITED",
    "ICICI BANK",
    "STATE BANK OF INDIA",
    "KOTAK MAHINDRA BANK",
];

const MultiSelect = ({
    label,
    options,
    selected,
    setSelected,
    displayText,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = useMemo(() => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return options;
        }

        return options.filter((option) =>
            option.toLowerCase().includes(value)
        );
    }, [options, search]);

    const allSelected =
        selected.length === options.length;

    const toggleOption = (option) => {
        setSelected((current) =>
            current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option]
        );
    };

    const toggleAll = () => {
        setSelected(allSelected ? [] : options);
    };

    return (
        <div className="dashboard-filter-field">
            <label>{label}</label>

            <div className="dashboard-multiselect">
                <button
                    type="button"
                    className="dashboard-select-button"
                    onClick={() => setOpen((current) => !current)}
                >
                    <span>{displayText}</span>
                    <ChevronDown size={16} />
                </button>

                {open && (
                    <div className="dashboard-dropdown">

                        <input
                            type="text"
                            className="dashboard-dropdown-search"
                            placeholder="Search..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                        <button
                            type="button"
                            className="dashboard-select-all"
                            onClick={toggleAll}
                        >
                            <span
                                className={
                                    allSelected
                                        ? "dashboard-checkbox checked"
                                        : "dashboard-checkbox"
                                }
                            >
                                {allSelected && <Check size={13} />}
                            </span>

                            <span>Select all</span>
                        </button>

                        <div className="dashboard-options">
                            {filteredOptions.map((option) => {
                                const checked =
                                    selected.includes(option);

                                return (
                                    <button
                                        type="button"
                                        className="dashboard-option"
                                        key={option}
                                        onClick={() =>
                                            toggleOption(option)
                                        }
                                    >
                                        <span
                                            className={
                                                checked
                                                    ? "dashboard-checkbox checked"
                                                    : "dashboard-checkbox"
                                            }
                                        >
                                            {checked && <Check size={13} />}
                                        </span>

                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({
    value,
    title,
    type,
}) => {
    return (
        <div className={`dashboard-summary-card ${type}`}>

            <div className="summary-card-value">
                {value}
            </div>

            <div className="summary-card-footer">
                <span className="summary-card-status">
                    {type === "verified" && "✓"}
                    {type === "total" && "✓"}
                    {type === "rejected" && "×"}
                    {type === "pending" && "×"}
                </span>

                <span>{title}</span>

                <span className="summary-card-arrow">
                    →
                </span>
            </div>

        </div>
    );
};

const Dashboard = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [selectedRegions, setSelectedRegions] =
        useState(regionOptions);

    const [selectedBranches, setSelectedBranches] =
        useState(branchOptions);

    const [selectedClients, setSelectedClients] =
        useState(clientOptions);

    const [applied, setApplied] = useState(false);

    const currentMonthData = [
        {
            name: "VISITED",
            value: 360,
        },
        {
            name: "NOT-VISITED",
            value: 140,
        },
    ];

    const lastMonthData = [
        {
            name: "VISITED",
            value: 493,
        },
        {
            name: "NOT-VISITED",
            value: 7,
        },
    ];

    const fieldForceStats = [
        {
            title: "Total Field Force",
            value: 10,
            icon: Users,
            type: "total",
        },
        {
            title: "Online",
            value: 6,
            icon: Wifi,
            type: "online",
        },
        {
            title: "Offline",
            value: 3,
            icon: WifiOff,
            type: "offline",
        },
        {
            title: "Battery Low",
            value: 2,
            icon: BatteryLow,
            type: "battery",
        },
    ];

    const visitStats = [
        {
            title: "Today's Visits",
            value: 28,
            icon: MapPin,
            type: "total",
        },
        {
            title: "Completed",
            value: 21,
            icon: CheckCircle2,
            type: "completed",
        },
        {
            title: "Pending",
            value: 7,
            icon: Clock3,
            type: "pending",
        },
        {
            title: "Unverified",
            value: 4,
            icon: AlertTriangle,
            type: "warning",
        },
    ];

    const taskStats = [
        {
            title: "Total Tasks",
            value: 42,
            icon: ClipboardList,
            type: "total",
        },
        {
            title: "Assigned",
            value: 18,
            icon: Users,
            type: "assigned",
        },
        {
            title: "In Progress",
            value: 11,
            icon: Clock3,
            type: "progress",
        },
        {
            title: "Completed",
            value: 13,
            icon: CheckCircle2,
            type: "completed",
        },
    ];

    const recentVisits = [
        {
            id: 1,
            name: "SANJIV KUMAR",
            site: "GHAGGA",
            client: "HDFC BANK LTD.",
            time: "16:12:03",
            status: "Completed",
            distance: "8.46 KM",
        },
        {
            id: 2,
            name: "VIKRAM NISCHAL",
            site: "FOCAL POINT",
            client: "HDFC BANK LTD.",
            time: "16:05:59",
            status: "Completed",
            distance: "45.32 KM",
        },
        {
            id: 3,
            name: "GURMEET SINGH",
            site: "MODEL TOWN",
            client: "HDFC BANK LTD.",
            time: "15:42:18",
            status: "Pending",
            distance: "1.55 KM",
        },
        {
            id: 4,
            name: "GURVINDER SINGH",
            site: "CIVIL LINES",
            client: "AXIS BANK LIMITED",
            time: "14:38:45",
            status: "Unverified",
            distance: "12.20 KM",
        },
        {
            id: 5,
            name: "AMIT SAINI",
            site: "DUGRI",
            client: "IIFL FINANCE",
            time: "13:22:10",
            status: "Completed",
            distance: "18.75 KM",
        },
    ];

    const alerts = [
        {
            id: 1,
            title: "Field Force Offline",
            description:
                "3 field force members are currently offline.",
            type: "danger",
            icon: WifiOff,
        },
        {
            id: 2,
            title: "Low Battery",
            description:
                "2 devices have battery below 20%.",
            type: "warning",
            icon: BatteryLow,
        },
        {
            id: 3,
            title: "Visits Pending Verification",
            description:
                "4 visits are waiting for verification.",
            type: "warning",
            icon: AlertTriangle,
        },
        {
            id: 4,
            title: "Not Checked In",
            description:
                "1 field force member has not checked in.",
            type: "danger",
            icon: LogIn,
        },
    ];

    const handleApply = () => {
        setApplied(true);

        console.log({
            fromDate,
            toDate,
            selectedRegions,
            selectedBranches,
            selectedClients,
        });
    };

    const renderStatSection = (
        title,
        stats,
        sectionClass = ""
    ) => {
        return (
            <section
                className={`dashboard-management-section ${sectionClass}`}
            >
                <div className="dashboard-section-heading">
                    <div>
                        <h2>{title}</h2>
                        <span>Today's overview</span>
                    </div>
                </div>

                <div className="dashboard-management-grid">
                    {stats.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                className={`dashboard-management-card ${item.type}`}
                                key={item.title}
                            >
                                <div className="management-card-icon">
                                    <Icon size={21} />
                                </div>

                                <div className="management-card-content">
                                    <span>{item.title}</span>
                                    <strong>{item.value}</strong>
                                </div>

                                <ArrowUpRight
                                    className="management-card-arrow"
                                    size={18}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    };

    return (
        <div className="dashboard-page">

            {/* =========================
          FILTER BAR
      ========================= */}

            <div className="dashboard-filter-card">

                <div className="dashboard-filter-row">

                    <div className="dashboard-filter-title">
                        <Filter size={16} />
                        <span>Filter:</span>
                    </div>

                    <div className="dashboard-date-field">
                        <label>From</label>

                        <div className="dashboard-date-input">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) =>
                                    setFromDate(event.target.value)
                                }
                            />

                            <CalendarDays size={17} />
                        </div>
                    </div>

                    <div className="dashboard-date-field">
                        <label>To</label>

                        <div className="dashboard-date-input">
                            <input
                                type="date"
                                value={toDate}
                                onChange={(event) =>
                                    setToDate(event.target.value)
                                }
                            />

                            <CalendarDays size={17} />
                        </div>
                    </div>

                    <MultiSelect
                        label="Region"
                        options={regionOptions}
                        selected={selectedRegions}
                        setSelected={setSelectedRegions}
                        displayText={
                            selectedRegions.length ===
                                regionOptions.length
                                ? "ALL SELECTED (12)"
                                : `${selectedRegions.length} SELECTED`
                        }
                    />

                    <MultiSelect
                        label="Branch"
                        options={branchOptions}
                        selected={selectedBranches}
                        setSelected={setSelectedBranches}
                        displayText={
                            selectedBranches.length ===
                                branchOptions.length
                                ? "ALL SELECTED (82)"
                                : `${selectedBranches.length} SELECTED`
                        }
                    />

                </div>

                <div className="dashboard-filter-row dashboard-filter-row-bottom">

                    <MultiSelect
                        label="Client"
                        options={clientOptions}
                        selected={selectedClients}
                        setSelected={setSelectedClients}
                        displayText={
                            selectedClients.length ===
                                clientOptions.length
                                ? "ALL SELECTED (1153)"
                                : `${selectedClients.length} SELECTED`
                        }
                    />

                    <button
                        type="button"
                        className="dashboard-apply-button"
                        onClick={handleApply}
                    >
                        Apply
                    </button>

                    {applied && (
                        <span className="dashboard-filter-applied">
                            Filters applied
                        </span>
                    )}

                </div>

            </div>

            {/* =========================
          SUMMARY CARDS
      ========================= */}

            <div className="dashboard-summary-grid">

                <SummaryCard
                    value="6033"
                    title="TOTAL AUDITS"
                    type="total"
                />

                <SummaryCard
                    value="5852"
                    title="TOTAL VERIFIED"
                    type="verified"
                />

                <SummaryCard
                    value="14"
                    title="REJECTED AUDITS"
                    type="rejected"
                />

                <SummaryCard
                    value="167"
                    title="VERIFICATION PENDING"
                    type="pending"
                />

            </div>

            {/* =========================
          CHARTS
      ========================= */}

            <div className="dashboard-chart-grid">

                <div className="dashboard-chart-card">

                    <h3>
                        Current Month Audit Complete VS Pending
                    </h3>

                    <div className="dashboard-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <PieChart>

                                <Pie
                                    data={currentMonthData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="52%"
                                    outerRadius="72%"
                                    label={({ name, value }) =>
                                        `${name}: ${value}`
                                    }
                                    labelLine={false}
                                >
                                    <Cell fill="#28a745" />
                                    <Cell fill="#dc3545" />
                                </Pie>

                                <Tooltip />

                                <Legend
                                    verticalAlign="top"
                                    height={45}
                                />

                            </PieChart>
                        </ResponsiveContainer>

                    </div>

                </div>

                <div className="dashboard-chart-card">

                    <h3>
                        Last Month Audit Complete VS Pending
                    </h3>

                    <div className="dashboard-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <PieChart>

                                <Pie
                                    data={lastMonthData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="52%"
                                    outerRadius="72%"
                                    label={({ name, value }) =>
                                        `${name}: ${value}`
                                    }
                                    labelLine={false}
                                >
                                    <Cell fill="#28a745" />
                                    <Cell fill="#dc3545" />
                                </Pie>

                                <Tooltip />

                                <Legend
                                    verticalAlign="top"
                                    height={45}
                                />

                            </PieChart>
                        </ResponsiveContainer>

                    </div>

                </div>

            </div>

            {/* =========================
          FIELD FORCE OVERVIEW
      ========================= */}

            {renderStatSection(
                "Field Force Overview",
                fieldForceStats
            )}

            {/* =========================
          VISIT OVERVIEW
      ========================= */}

            {renderStatSection(
                "Visit & Check-In Overview",
                visitStats
            )}

            {/* =========================
          TASK OVERVIEW
      ========================= */}

            {renderStatSection(
                "Task Overview",
                taskStats
            )}

            {/* =========================
          RECENT ACTIVITY
      ========================= */}

            <div className="dashboard-bottom-grid">

                {/* Recent Visits */}

                <section className="dashboard-recent-card">

                    <div className="dashboard-section-heading">
                        <div>
                            <h2>Recent Visits</h2>
                            <span>Latest field activity</span>
                        </div>

                        <button
                            type="button"
                            className="dashboard-view-all"
                        >
                            View All
                        </button>
                    </div>

                    <div className="dashboard-recent-table-wrapper">

                        <table className="dashboard-recent-table">

                            <thead>
                                <tr>
                                    <th>Field Force</th>
                                    <th>Site</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Distance</th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentVisits.map((visit) => (
                                    <tr key={visit.id}>

                                        <td>
                                            <div className="dashboard-person">
                                                <div className="dashboard-person-avatar">
                                                    {visit.name.charAt(0)}
                                                </div>

                                                <span>{visit.name}</span>
                                            </div>
                                        </td>

                                        <td>{visit.site}</td>

                                        <td>{visit.time}</td>

                                        <td>
                                            <span
                                                className={`dashboard-status ${visit.status
                                                    .toLowerCase()
                                                    .replace(" ", "-")}`}
                                            >
                                                {visit.status}
                                            </span>
                                        </td>

                                        <td>{visit.distance}</td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>

                    </div>

                </section>

                {/* Attention Required */}

                <section className="dashboard-alert-card">

                    <div className="dashboard-section-heading">
                        <div>
                            <h2>Attention Required</h2>
                            <span>Items requiring action</span>
                        </div>

                        <span className="dashboard-alert-count">
                            {alerts.length}
                        </span>
                    </div>

                    <div className="dashboard-alert-list">

                        {alerts.map((alert) => {
                            const Icon = alert.icon;

                            return (
                                <div
                                    className={`dashboard-alert-item ${alert.type}`}
                                    key={alert.id}
                                >
                                    <div className="dashboard-alert-icon">
                                        <Icon size={19} />
                                    </div>

                                    <div className="dashboard-alert-content">
                                        <strong>{alert.title}</strong>
                                        <span>{alert.description}</span>
                                    </div>

                                    <ArrowUpRight
                                        size={17}
                                        className="dashboard-alert-arrow"
                                    />
                                </div>
                            );
                        })}

                    </div>

                </section>

            </div>

        </div>
    );
};

export default Dashboard;
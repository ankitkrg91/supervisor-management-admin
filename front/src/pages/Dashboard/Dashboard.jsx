import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
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

import {
    Link,
} from "react-router-dom";

import {
    apiFetch,
} from "../../utils/api";

import "./Dashboard.css";

import {
    useTheme,
} from "../../context/ThemeContext";


// ============================================================
// MULTI SELECT
// ============================================================

const MultiSelect = ({
    label,
    options,
    selected,
    setSelected,
    displayText,
}) => {
    const [open, setOpen] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const filteredOptions =
        useMemo(() => {
            const value =
                search
                    .toLowerCase()
                    .trim();

            if (!value) {
                return options;
            }

            return options.filter(
                (option) =>
                    option
                        .toLowerCase()
                        .includes(value)
            );
        }, [
            options,
            search,
        ]);

    const allSelected =
        options.length > 0 &&
        selected.length ===
        options.length;

    const toggleOption = (
        option
    ) => {
        setSelected(
            (current) =>
                current.includes(
                    option
                )
                    ? current.filter(
                        (item) =>
                            item !==
                            option
                    )
                    : [
                        ...current,
                        option,
                    ]
        );
    };

    const toggleAll = () => {
        setSelected(
            allSelected
                ? []
                : [...options]
        );
    };

    return (
        <div className="dashboard-filter-field">

            <label>
                {label}
            </label>

            <div className="dashboard-multiselect">

                <button
                    type="button"
                    className="dashboard-select-button"
                    onClick={() =>
                        setOpen(
                            (current) =>
                                !current
                        )
                    }
                >
                    <span>
                        {displayText}
                    </span>

                    <ChevronDown
                        size={16}
                    />
                </button>


                {open && (
                    <div className="dashboard-dropdown">

                        <input
                            type="text"
                            className="dashboard-dropdown-search"
                            placeholder="Search..."
                            value={search}
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


                        <button
                            type="button"
                            className="dashboard-select-all"
                            onClick={
                                toggleAll
                            }
                        >

                            <span
                                className={
                                    allSelected
                                        ? "dashboard-checkbox checked"
                                        : "dashboard-checkbox"
                                }
                            >
                                {allSelected && (
                                    <Check
                                        size={13}
                                    />
                                )}
                            </span>

                            <span>
                                Select all
                            </span>

                        </button>


                        <div className="dashboard-options">

                            {filteredOptions.map(
                                (option) => {

                                    const checked =
                                        selected.includes(
                                            option
                                        );

                                    return (
                                        <button
                                            type="button"
                                            className="dashboard-option"
                                            key={
                                                option
                                            }
                                            onClick={() =>
                                                toggleOption(
                                                    option
                                                )
                                            }
                                        >

                                            <span
                                                className={
                                                    checked
                                                        ? "dashboard-checkbox checked"
                                                        : "dashboard-checkbox"
                                                }
                                            >
                                                {checked && (
                                                    <Check
                                                        size={
                                                            13
                                                        }
                                                    />
                                                )}
                                            </span>

                                            <span>
                                                {
                                                    option
                                                }
                                            </span>

                                        </button>
                                    );
                                }
                            )}

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
};


// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard = ({
    value,
    title,
    type,
    path = "/dashboard",
}) => {
    return (
        <Link
            to={path}
            className={`dashboard-summary-card ${type}`}
        >

            <div className="summary-card-value">
                {value}
            </div>


            <div className="summary-card-footer">

                <span className="summary-card-status">

                    {type ===
                        "verified" &&
                        "✓"}

                    {type ===
                        "total" &&
                        "✓"}

                    {type ===
                        "rejected" &&
                        "×"}

                    {type ===
                        "pending" &&
                        "×"}

                </span>


                <span>
                    {title}
                </span>


                <span className="summary-card-arrow">
                    →
                </span>

            </div>

        </Link>
    );
};


// ============================================================
// MANAGEMENT SECTION
// ============================================================

const ManagementSection = ({
    title,
    stats,
}) => {
    return (
        <section className="dashboard-management-section">

            <div className="dashboard-section-heading">

                <div>

                    <h2>
                        {title}
                    </h2>

                    <span>
                        Today's overview
                    </span>

                </div>

            </div>


            <div className="dashboard-management-grid">

                {stats.map(
                    (item) => {

                        const Icon =
                            item.icon;

                        return (
                            <Link
                                key={
                                    item.title
                                }
                                to={
                                    item.path ||
                                    "/dashboard"
                                }
                                className={`dashboard-management-card ${item.type}`}
                            >

                                <div className="management-card-icon">

                                    <Icon
                                        size={21}
                                    />

                                </div>


                                <div className="management-card-content">

                                    <span>
                                        {
                                            item.title
                                        }
                                    </span>

                                    <strong>
                                        {
                                            item.value
                                        }
                                    </strong>

                                </div>


                                <ArrowUpRight
                                    className="management-card-arrow"
                                    size={18}
                                />

                            </Link>
                        );
                    }
                )}

            </div>

        </section>
    );
};


// ============================================================
// DASHBOARD
// ============================================================

const Dashboard = () => {

    // ==========================================================
    // FILTER STATE
    // ==========================================================

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [regionOptions, setRegionOptions] =
        useState([]);

    const [branchOptions, setBranchOptions] =
        useState([]);

    const [clientOptions, setClientOptions] =
        useState([]);

    const [selectedRegions, setSelectedRegions] =
        useState([]);

    const [selectedBranches, setSelectedBranches] =
        useState([]);

    const [selectedClients, setSelectedClients] =
        useState([]);

    const [applied, setApplied] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [lastQuery, setLastQuery] =
        useState("");


    // ==========================================================
    // AUDIT STATE
    // ==========================================================

    const [summary, setSummary] =
        useState({
            totalAudits: 0,
            totalVerified: 0,
            rejectedAudits: 0,
            verificationPending: 0,
        });


    // ==========================================================
    // CHART STATE
    // ==========================================================

    const [charts, setCharts] =
        useState({

            currentMonth: [
                {
                    name:
                        "VISITED",
                    value: 0,
                },
                {
                    name:
                        "NOT-VISITED",
                    value: 0,
                },
            ],

            lastMonth: [
                {
                    name:
                        "VISITED",
                    value: 0,
                },
                {
                    name:
                        "NOT-VISITED",
                    value: 0,
                },
            ],

        });


    // ==========================================================
    // SUPERVISOR STATE
    // ==========================================================

    const [
        supervisorsStats,
        setSupervisorsStats,
    ] = useState({

        total: 0,
        online: 0,
        offline: 0,
        batteryLow: 0,

    });


    // ==========================================================
    // VISIT STATE
    // ==========================================================

    const [visits, setVisits] =
        useState({

            today: 0,
            completed: 0,
            pending: 0,
            unverified: 0,

        });


    // ==========================================================
    // CHECK-IN / CHECK-OUT STATE
    // ==========================================================

    const [
        checkIns,
        setCheckIns,
    ] = useState({

        today: 0,
        checkedOut: 0,
        currentlyCheckedIn: 0,
        notCheckedIn: 0,

    });


    // ==========================================================
    // TASK STATE
    // ==========================================================

    const [tasks, setTasks] =
        useState({

            total: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0,

        });


    // ==========================================================
    // OTHER STATE
    // ==========================================================

    const [
        recentVisits,
        setRecentVisits,
    ] = useState([]);

    const [
        alerts,
        setAlerts,
    ] = useState([]);


    const { theme } =
        useTheme();


    // ==========================================================
    // FETCH DASHBOARD
    // ==========================================================

    const fetchDashboard = async (
        query = "",
        silent = false
    ) => {

        try {

            if (!silent) {
                setLoading(true);
            }

            setError("");


            const endpoint =
                query
                    ? `/api/dashboard?${query}`
                    : "/api/dashboard";


            const response =
                await apiFetch(
                    endpoint,
                    {
                        method:
                            "GET",
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    "Failed to load dashboard"
                );

            }


            const dashboard =
                data?.data || {};


            // ==================================================
            // FILTERS
            // ==================================================

            if (
                dashboard.filters
            ) {

                const regions =
                    dashboard
                        .filters
                        .regions ||
                    [];


                const branches =
                    dashboard
                        .filters
                        .branches ||
                    [];


                const clients =
                    dashboard
                        .filters
                        .clients ||
                    [];


                if (
                    regionOptions.length ===
                    0
                ) {

                    setRegionOptions(
                        regions
                    );

                    setSelectedRegions(
                        regions
                    );

                }


                if (
                    branchOptions.length ===
                    0
                ) {

                    setBranchOptions(
                        branches
                    );

                    setSelectedBranches(
                        branches
                    );

                }


                if (
                    clientOptions.length ===
                    0
                ) {

                    setClientOptions(
                        clients
                    );

                    setSelectedClients(
                        clients
                    );

                }

            }


            // ==================================================
            // AUDIT
            // ==================================================

            setSummary(
                dashboard.summary ||
                {
                    totalAudits:
                        0,

                    totalVerified:
                        0,

                    rejectedAudits:
                        0,

                    verificationPending:
                        0,
                }
            );


            // ==================================================
            // CHARTS
            // ==================================================

            setCharts(
                dashboard.charts ||
                {
                    currentMonth:
                        [],

                    lastMonth:
                        [],
                }
            );


            // ==================================================
            // SUPERVISORS
            // ==================================================

            setSupervisorsStats(
                dashboard.fieldForce ||
                {
                    total:
                        0,

                    online:
                        0,

                    offline:
                        0,

                    batteryLow:
                        0,
                }
            );


            // ==================================================
            // VISITS
            // ==================================================

            setVisits(
                dashboard.visits ||
                {
                    today:
                        0,

                    completed:
                        0,

                    pending:
                        0,

                    unverified:
                        0,
                }
            );


            // ==================================================
            // CHECK-IN / CHECK-OUT
            // ==================================================

            setCheckIns(
                dashboard.checkIns ||
                {
                    today:
                        0,

                    checkedOut:
                        0,

                    currentlyCheckedIn:
                        0,

                    notCheckedIn:
                        0,
                }
            );


            // ==================================================
            // TASKS
            // ==================================================

            setTasks(
                dashboard.tasks ||
                {
                    total:
                        0,

                    assigned:
                        0,

                    inProgress:
                        0,

                    completed:
                        0,
                }
            );


            // ==================================================
            // RECENT VISITS
            // ==================================================

            setRecentVisits(
                dashboard.recentVisits ||
                []
            );


            // ==================================================
            // ALERTS
            // ==================================================

            setAlerts(
                dashboard.alerts ||
                []
            );

        } catch (
        err
        ) {

            console.error(
                "Dashboard fetch error:",
                err
            );


            setError(
                err?.message ||
                "Failed to load dashboard"
            );

        } finally {

            if (!silent) {
                setLoading(false);
            }

        }

    };


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {

        fetchDashboard();

    }, []);


    // ==========================================================
    // AUTO REFRESH
    // ==========================================================

    useEffect(() => {

        if (
            lastQuery ===
            ""
        ) {
            return;
        }


        const interval =
            setInterval(
                () => {

                    fetchDashboard(
                        lastQuery,
                        true
                    );

                },
                60000
            );


        return () =>
            clearInterval(
                interval
            );

    }, [
        lastQuery,
    ]);


    // ==========================================================
    // BUILD QUERY
    // ==========================================================

    const buildQuery = () => {

        const params =
            new URLSearchParams();


        if (fromDate) {

            params.set(
                "fromDate",
                fromDate
            );

        }


        if (toDate) {

            params.set(
                "toDate",
                toDate
            );

        }


        params.set(
            "regions",
            selectedRegions.join(",")
        );


        params.set(
            "branches",
            selectedBranches.join(",")
        );


        params.set(
            "clients",
            selectedClients.join(",")
        );


        return params.toString();

    };


    // ==========================================================
    // APPLY FILTERS
    // ==========================================================

    const handleApply =
        async () => {

            if (
                fromDate &&
                toDate &&
                fromDate >
                toDate
            ) {

                setError(
                    "From date cannot be after To date."
                );

                return;
            }


            setApplied(true);


            const query =
                buildQuery();


            setLastQuery(
                query
            );


            await fetchDashboard(
                query
            );

        };


    // ==========================================================
    // SUPERVISOR STATS
    // ==========================================================

    const fieldForceStats = [

        {
            title:
                "Total Supervisors",

            value:
                supervisorsStats.total,

            icon:
                Users,

            type:
                "total",

            path:
                "/field-tracker/track",
        },


        {
            title:
                "Online",

            value:
                supervisorsStats.online,

            icon:
                Wifi,

            type:
                "online",

            path:
                "/field-tracker/online",
        },


        {
            title:
                "Offline",

            value:
                supervisorsStats.offline,

            icon:
                WifiOff,

            type:
                "offline",

            path:
                "/field-tracker/offline",
        },


        {
            title:
                "Battery Low",

            value:
                supervisorsStats.batteryLow,

            icon:
                BatteryLow,

            type:
                "battery",

            path:
                "/field-tracker/battery-low",
        },

    ];


    // ==========================================================
    // VISIT STATS
    // ==========================================================

    const visitStats = [

        {
            title:
                "Today's Visits",

            value:
                visits.today,

            icon:
                MapPin,

            type:
                "total",

            path:
                "/visits/latest",
        },


        {
            title:
                "Visits Verified",

            value:
                visits.completed,

            icon:
                CheckCircle2,

            type:
                "completed",

            path:
                "/visits/verified",
        },


        {
            title:
                "Visits Pending Verification",

            value:
                visits.pending,

            icon:
                Clock3,

            type:
                "pending",

            path:
                "/visits/verified",
        },


        {
            title:
                "Visits Unverified",

            value:
                visits.unverified,

            icon:
                AlertTriangle,

            type:
                "warning",

            path:
                "/visits/verified",
        },

    ];


    // ==========================================================
    // CHECK-IN / CHECK-OUT STATS
    // ==========================================================

    const checkInStats = [

        {
            title:
                "Today's Check-Ins",

            value:
                checkIns.today,

            icon:
                LogIn,

            type:
                "total",

            path:
                "/check-in/latest",
        },


        {
            title:
                "Checked-Out",

            value:
                checkIns.checkedOut,

            icon:
                CheckCircle2,

            type:
                "completed",

            path:
                "/check-in/latest",
        },


        {
            title:
                "Currently Checked-In",

            value:
                checkIns.currentlyCheckedIn,

            icon:
                Clock3,

            type:
                "progress",

            path:
                "/check-in/latest",
        },


        {
            title:
                "Not Checked-In",

            value:
                checkIns.notCheckedIn,

            icon:
                LogIn,

            type:
                "warning",

            path:
                "/field-tracker/not-checked-in",
        },

    ];


    // ==========================================================
    // TASK STATS
    // ==========================================================

    const taskStats = [

        {
            title:
                "Total Tasks",

            value:
                tasks.total,

            icon:
                ClipboardList,

            type:
                "total",

            path:
                "/tasks/dashboard",
        },


        {
            title:
                "Assigned",

            value:
                tasks.assigned,

            icon:
                Users,

            type:
                "assigned",

            path:
                "/tasks/dashboard",
        },


        {
            title:
                "In Progress",

            value:
                tasks.inProgress,

            icon:
                Clock3,

            type:
                "progress",

            path:
                "/tasks/dashboard",
        },


        {
            title:
                "Completed",

            value:
                tasks.completed,

            icon:
                CheckCircle2,

            type:
                "completed",

            path:
                "/tasks/dashboard",
        },

    ];


    // ==========================================================
    // ALERT ICON
    // ==========================================================

    const getAlertIcon = (
        iconName
    ) => {

        const iconMap = {

            WifiOff,

            BatteryLow,

            AlertTriangle,

            LogIn,

        };


        return (
            iconMap[
            iconName
            ] ||
            AlertTriangle
        );

    };


    // ==========================================================
    // RENDER
    // ==========================================================

    return (

        <div className="dashboard-page">


            {/* ==================================================
                FILTER
            ================================================== */}

            <div className="dashboard-filter-card">


                <div className="dashboard-filter-row">


                    <div className="dashboard-filter-title">

                        <Filter
                            size={16}
                        />

                        <span>
                            Filter:
                        </span>

                    </div>


                    <div className="dashboard-date-field">

                        <label>
                            From
                        </label>


                        <div className="dashboard-date-input">

                            <input
                                type="date"
                                value={
                                    fromDate
                                }
                                style={{
                                    colorScheme:
                                        theme ===
                                            "dark"
                                            ? "dark"
                                            : "light",
                                }}
                                onChange={(
                                    event
                                ) =>
                                    setFromDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />

                        </div>

                    </div>


                    <div className="dashboard-date-field">

                        <label>
                            To
                        </label>


                        <div className="dashboard-date-input">

                            <input
                                type="date"
                                value={
                                    toDate
                                }
                                style={{
                                    colorScheme:
                                        theme ===
                                            "dark"
                                            ? "dark"
                                            : "light",
                                }}
                                onChange={(
                                    event
                                ) =>
                                    setToDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />

                        </div>

                    </div>


                    <MultiSelect
                        label="Region"
                        options={
                            regionOptions
                        }
                        selected={
                            selectedRegions
                        }
                        setSelected={
                            setSelectedRegions
                        }
                        displayText={
                            selectedRegions.length ===
                                regionOptions.length
                                ? `ALL SELECTED (${regionOptions.length})`
                                : `${selectedRegions.length} SELECTED`
                        }
                    />


                    <MultiSelect
                        label="Branch"
                        options={
                            branchOptions
                        }
                        selected={
                            selectedBranches
                        }
                        setSelected={
                            setSelectedBranches
                        }
                        displayText={
                            selectedBranches.length ===
                                branchOptions.length
                                ? `ALL SELECTED (${branchOptions.length})`
                                : `${selectedBranches.length} SELECTED`
                        }
                    />

                </div>


                <div className="dashboard-filter-row dashboard-filter-row-bottom">


                    <MultiSelect
                        label="Client"
                        options={
                            clientOptions
                        }
                        selected={
                            selectedClients
                        }
                        setSelected={
                            setSelectedClients
                        }
                        displayText={
                            selectedClients.length ===
                                clientOptions.length
                                ? `ALL SELECTED (${clientOptions.length})`
                                : `${selectedClients.length} SELECTED`
                        }
                    />


                    <button
                        type="button"
                        className="dashboard-apply-button"
                        onClick={
                            handleApply
                        }
                        disabled={
                            loading
                        }
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


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="dashboard-error-message">

                    {error}

                </div>

            )}


            {/* ==================================================
                LOADING
            ================================================== */}

            {loading && (

                <div className="dashboard-loading">

                    Loading dashboard...

                </div>

            )}


            {/* ==================================================
                AUDIT SUMMARY
            ================================================== */}

            <div className="dashboard-summary-grid">


                <SummaryCard
                    value={
                        summary.totalAudits
                    }
                    title="AUDITS SUBMITTED"
                    type="total"
                />


                <SummaryCard
                    value={
                        summary.totalVerified
                    }
                    title="AUDITS VERIFIED BY ADMIN"
                    type="verified"
                />


                <SummaryCard
                    value={
                        summary.rejectedAudits
                    }
                    title="AUDITS REJECTED"
                    type="rejected"
                />


                <SummaryCard
                    value={
                        summary.verificationPending
                    }
                    title="AUDITS PENDING VERIFICATION"
                    type="pending"
                />

            </div>


            {/* ==================================================
                SITE VISIT CHARTS
            ================================================== */}

            <div className="dashboard-chart-grid">


                <div className="dashboard-chart-card">

                    <h3>
                        Current Month Sites Visited VS Not-Visited
                    </h3>


                    <div className="dashboard-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <PieChart>

                                <Pie
                                    data={
                                        charts.currentMonth ||
                                        []
                                    }
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="52%"
                                    outerRadius="72%"
                                    label={({
                                        name,
                                        value,
                                    }) =>
                                        `${name}: ${value}`
                                    }
                                    labelLine={
                                        false
                                    }
                                >

                                    <Cell
                                        fill="#28a745"
                                    />

                                    <Cell
                                        fill="#dc3545"
                                    />

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
                        Last Month Sites Visited VS Not-Visited
                    </h3>


                    <div className="dashboard-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <PieChart>

                                <Pie
                                    data={
                                        charts.lastMonth ||
                                        []
                                    }
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="52%"
                                    outerRadius="72%"
                                    label={({
                                        name,
                                        value,
                                    }) =>
                                        `${name}: ${value}`
                                    }
                                    labelLine={
                                        false
                                    }
                                >

                                    <Cell
                                        fill="#28a745"
                                    />

                                    <Cell
                                        fill="#dc3545"
                                    />

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


            {/* ==================================================
                SUPERVISOR
            ================================================== */}

            <ManagementSection
                title="Supervisor Overview"
                stats={
                    fieldForceStats
                }
            />


            {/* ==================================================
                VISITS
            ================================================== */}

            <ManagementSection
                title="Visit Overview"
                stats={
                    visitStats
                }
            />


            {/* ==================================================
                CHECK-IN / CHECK-OUT
            ================================================== */}

            <ManagementSection
                title="Check-In & Check-Out Overview"
                stats={
                    checkInStats
                }
            />


            {/* ==================================================
                TASKS
            ================================================== */}

            <ManagementSection
                title="Task Overview"
                stats={
                    taskStats
                }
            />


            {/* ==================================================
                BOTTOM
            ================================================== */}

            <div className="dashboard-bottom-grid">


                {/* ==================================================
                    RECENT VISITS
                ================================================== */}

                <section className="dashboard-recent-card">


                    <div className="dashboard-section-heading">

                        <div>

                            <h2>
                                Recent Visits
                            </h2>

                            <span>
                                Latest supervisor activity
                            </span>

                        </div>


                        <Link
                            to="/visits/latest"
                            className="dashboard-view-all"
                        >
                            View All
                        </Link>

                    </div>


                    <div className="dashboard-recent-table-wrapper">


                        <table className="dashboard-recent-table">


                            <thead>

                                <tr>

                                    <th>
                                        Supervisor
                                    </th>

                                    <th>
                                        Site
                                    </th>

                                    <th>
                                        Time
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Distance
                                    </th>

                                </tr>

                            </thead>


                            <tbody>


                                {recentVisits.length ===
                                    0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center",

                                                padding:
                                                    "25px",
                                            }}
                                        >

                                            No recent visits found.

                                        </td>

                                    </tr>

                                ) : (

                                    recentVisits.map(
                                        (
                                            visit
                                        ) => (

                                            <tr
                                                key={
                                                    visit.id
                                                }
                                            >


                                                <td>

                                                    <div className="dashboard-person">


                                                        <div className="dashboard-person-avatar">

                                                            {visit.name
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase() ||
                                                                "?"}

                                                        </div>


                                                        <span>

                                                            {
                                                                visit.name
                                                            }

                                                        </span>


                                                    </div>

                                                </td>


                                                <td>

                                                    {
                                                        visit.site
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        visit.time
                                                    }

                                                </td>


                                                <td>

                                                    <span
                                                        className={`dashboard-status ${visit.status
                                                                ?.toLowerCase()
                                                                .replace(
                                                                    /\s+/g,
                                                                    "-"
                                                                )
                                                            }`}
                                                    >

                                                        {
                                                            visit.status
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        visit.distance
                                                    }

                                                </td>


                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* ==================================================
                    ATTENTION REQUIRED
                ================================================== */}

                <section className="dashboard-alert-card">


                    <div className="dashboard-section-heading">

                        <div>

                            <h2>
                                Attention Required
                            </h2>

                            <span>
                                Items requiring action
                            </span>

                        </div>


                        <span className="dashboard-alert-count">

                            {
                                alerts.length
                            }

                        </span>

                    </div>


                    <div className="dashboard-alert-list">


                        {alerts.length ===
                            0 ? (

                            <div
                                style={{
                                    padding:
                                        "25px 4px",

                                    color:
                                        "var(--text-muted)",

                                    fontSize:
                                        "12px",
                                }}
                            >

                                No attention required.

                            </div>

                        ) : (

                            alerts.map(
                                (alert) => {

                                    const Icon =
                                        getAlertIcon(
                                            alert.icon
                                        );

                                    return (

                                        <div
                                            className={`dashboard-alert-item ${alert.type}`}
                                            key={
                                                alert.id
                                            }
                                        >

                                            <div className="dashboard-alert-icon">

                                                <Icon
                                                    size={
                                                        19
                                                    }
                                                />

                                            </div>


                                            <div className="dashboard-alert-content">

                                                <strong>

                                                    {
                                                        alert.title
                                                    }

                                                </strong>


                                                <span>

                                                    {
                                                        alert.description
                                                    }

                                                </span>

                                            </div>


                                            <ArrowUpRight
                                                size={
                                                    17
                                                }
                                                className="dashboard-alert-arrow"
                                            />

                                        </div>

                                    );

                                }
                            )

                        )}

                    </div>

                </section>

            </div>

        </div>
    );
};


export default Dashboard;
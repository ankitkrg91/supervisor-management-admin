import {
    LayoutDashboard,
    MapPin,
    LogIn,
    ClipboardList,
    ClipboardCheck,
    Map,
    FileText,
    Settings,
    KeyRound,
    Compass,
    LogOut,
    ChevronDown,
    Menu,
} from "lucide-react";

import {
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import logo from "../../assets/logo.png";

import "./Sidebar.css";

const menuItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
    },

    {
        label: "Field Tracker",
        icon: MapPin,
        children: [
            {
                label: "Online",
                path: "/field-tracker/online",
            },
            {
                label: "Offline",
                path: "/field-tracker/offline",
            },
            {
                label: "Battery Low",
                path: "/field-tracker/battery-low",
            },
            {
                label: "Track Field Force",
                path: "/field-tracker/track",
            },
            {
                label: "Not Checked In",
                path: "/field-tracker/not-checked-in",
            },
        ],
    },

    {
        label: "Check In & Check Out",
        icon: LogIn,
        children: [
            {
                label: "Latest Check In",
                path: "/check-in/latest",
            },
        ],
    },

    {
        label: "Visits",
        icon: ClipboardList,
        children: [
            {
                label: "Latest Visits",
                path: "/visits/latest",
            },
            {
                label: "Verified/Unverified Visit",
                path: "/visits/verified",
            },
        ],
    },

    {
        label: "Task",
        icon: ClipboardList,
        children: [
            {
                label: "Dashboard",
                path: "/tasks/dashboard",
            },
            {
                label: "Task Summary",
                path: "/tasks/summary",
            },
            {
                label: "Schedule Task",
                path: "/tasks/schedule",
            },
            {
                label: "Schedule Bulk Task",
                path: "/tasks/schedule-bulk",
            },
            {
                label: "Cancel Bulk Task",
                path: "/tasks/cancel-bulk",
            },
            {
                label: "Reassign Task",
                path: "/tasks/reassign",
            },
            {
                label: "Reassign Bulk Task",
                path: "/tasks/reassign-bulk",
            },
            {
                label: "Task Details",
                path: "/tasks/details",
            },
            {
                label: "Create Campaign",
                path: "/tasks/create-campaign",
            },
            {
                label: "Campaign",
                path: "/tasks/campaign",
            },
        ],
    },

    {
        label: "Distance Report",
        icon: Map,
        path: "/distance-report",
    },

    {
        label: "Reports",
        icon: FileText,
        path: "/reports",
    },

    {
        label: "Audit Management",
        icon: ClipboardCheck,
        path: "/audit-management",
    },

    {
        label: "Settings",
        icon: Settings,
        path: "/settings",
    },

    {
        label: "Change Password",
        icon: KeyRound,
        path: "/change-password",
    },

    {
        label: "Take Tour",
        icon: Compass,
        path: "/take-tour",
    },

    {
        label: "Logout",
        icon: LogOut,
        action: "logout",
    },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [openMenus, setOpenMenus] = useState({
        "Field Tracker": true,
        "Check In & Check Out": false,
        Visits: false,
        Task: false,
    });

    useEffect(() => {
        menuItems.forEach((item) => {
            if (!item.children) return;

            const childActive = item.children.some(
                (child) =>
                    location.pathname.startsWith(
                        child.path
                    )
            );

            if (childActive) {
                setOpenMenus((current) => ({
                    ...current,
                    [item.label]: true,
                }));
            }
        });
    }, [location.pathname]);

    const toggleMenu = (label) => {
        setOpenMenus((current) => ({
            ...current,
            [label]: !current[label],
        }));
    };

    /*
     * ==========================================
     * LOGOUT
     * ==========================================
     */

    const handleLogout = () => {
        const confirmed = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmed) {
            return;
        }

        /*
         * Remove authentication/session data.
         *
         * These keys are prepared for the real
         * authentication system that we will
         * connect later with the backend.
         */

        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("supervisor-user");

        /*
         * Clear session storage as well.
         */

        sessionStorage.clear();

        /*
         * Redirect to login page.
         */

        navigate("/login", {
            replace: true,
        });
    };

    return (
        <aside
            className={`sidebar ${collapsed ? "collapsed" : ""
                }`}
        >

            {/* =================================
                SIDEBAR HEADER
            ================================= */}

            <div className="sidebar-header">

                {!collapsed && (
                    <div className="sidebar-logo">
                        <img
                            src={logo}
                            alt="Supervisor"
                        />
                    </div>
                )}

                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() =>
                        setCollapsed(!collapsed)
                    }
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                >
                    <Menu size={21} />
                </button>

            </div>

            {/* =================================
                NAVIGATION
            ================================= */}

            <nav className="sidebar-nav">

                {menuItems.map((item) => {
                    const Icon = item.icon;

                    /*
                     * ==================================
                     * LOGOUT
                     * ==================================
                     */

                    if (item.action === "logout") {
                        return (
                            <button
                                key={item.label}
                                type="button"
                                className="sidebar-item sidebar-action logout-item"
                                onClick={handleLogout}
                                title={
                                    collapsed
                                        ? item.label
                                        : undefined
                                }
                            >
                                <span className="sidebar-icon">
                                    <Icon size={20} />
                                </span>

                                {!collapsed && (
                                    <span className="sidebar-label">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    }

                    /*
                     * ==================================
                     * PARENT MENU WITH CHILDREN
                     * ==================================
                     */

                    if (item.children) {
                        const isOpen =
                            openMenus[item.label];

                        const parentActive =
                            item.children.some(
                                (child) =>
                                    location.pathname.startsWith(
                                        child.path
                                    )
                            );

                        return (
                            <div
                                className="sidebar-group"
                                key={item.label}
                            >

                                <button
                                    type="button"
                                    className={`sidebar-parent ${parentActive
                                            ? "parent-active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        toggleMenu(
                                            item.label
                                        )
                                    }
                                    title={
                                        collapsed
                                            ? item.label
                                            : undefined
                                    }
                                >

                                    <span className="sidebar-icon">
                                        <Icon size={20} />
                                    </span>

                                    {!collapsed && (
                                        <>
                                            <span className="sidebar-label">
                                                {item.label}
                                            </span>

                                            <span
                                                className={`sidebar-chevron ${isOpen
                                                        ? "open"
                                                        : ""
                                                    }`}
                                            >
                                                <ChevronDown
                                                    size={15}
                                                />
                                            </span>
                                        </>
                                    )}

                                </button>

                                {!collapsed &&
                                    isOpen && (
                                        <div className="sidebar-submenu">

                                            {item.children.map(
                                                (child) => (
                                                    <NavLink
                                                        key={
                                                            child.path
                                                        }
                                                        to={
                                                            child.path
                                                        }
                                                        className={({
                                                            isActive,
                                                        }) =>
                                                            `sidebar-subitem ${isActive
                                                                ? "active"
                                                                : ""
                                                            }`
                                                        }
                                                    >
                                                        {
                                                            child.label
                                                        }
                                                    </NavLink>
                                                )
                                            )}

                                        </div>
                                    )}

                            </div>
                        );
                    }

                    /*
                     * ==================================
                     * NORMAL MENU ITEM
                     * ==================================
                     */

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-item ${isActive
                                    ? "active"
                                    : ""
                                }`
                            }
                            title={
                                collapsed
                                    ? item.label
                                    : undefined
                            }
                        >
                            <span className="sidebar-icon">
                                <Icon size={20} />
                            </span>

                            {!collapsed && (
                                <span className="sidebar-label">
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    );
                })}

            </nav>

        </aside>
    );
};

export default Sidebar;
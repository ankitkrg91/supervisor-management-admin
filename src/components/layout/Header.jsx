import {
    Bell,
    Maximize,
    Sun,
    Moon,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useTheme,
} from "../../context/ThemeContext";

import {
    apiFetch,
} from "../../utils/api";

import "./Header.css";


const Header = () => {
    const {
        theme,
        toggleTheme,
    } = useTheme();

    const navigate = useNavigate();

    const [showNotifications, setShowNotifications] =
        useState(false);

    const [notifications, setNotifications] =
        useState([]);

    const [loadingNotifications, setLoadingNotifications] =
        useState(false);

    const [user, setUser] =
        useState(null);


    // =========================================================
    // LOAD LOGGED-IN USER
    // =========================================================

    useEffect(() => {
        try {
            const storedUser =
                localStorage.getItem("user");

            if (storedUser) {
                setUser(
                    JSON.parse(storedUser)
                );
            }
        } catch (error) {
            console.error(
                "Failed to read logged-in user:",
                error
            );
        }
    }, []);


    // =========================================================
    // LOAD NOTIFICATIONS
    // =========================================================

    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);

            const response =
                await apiFetch(
                    "/api/dashboard",
                    {
                        method: "GET",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load notifications"
                );
            }

            const alerts =
                data?.data?.alerts || [];

            setNotifications(
                Array.isArray(alerts)
                    ? alerts
                    : []
            );
        } catch (error) {
            console.error(
                "Notification fetch error:",
                error
            );

            setNotifications([]);
        } finally {
            setLoadingNotifications(false);
        }
    };


    // =========================================================
    // INITIAL NOTIFICATIONS
    // =========================================================

    useEffect(() => {
        fetchNotifications();

        const interval =
            setInterval(() => {
                fetchNotifications();
            }, 60000);

        return () =>
            clearInterval(
                interval
            );
    }, []);


    // =========================================================
    // CLOSE DROPDOWN WITH ESC
    // =========================================================

    useEffect(() => {
        const handleEscape = (
            event
        ) => {
            if (
                event.key === "Escape"
            ) {
                setShowNotifications(
                    false
                );
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);


    // =========================================================
    // NOTIFICATION COUNT
    // =========================================================

    const notificationCount =
        notifications.length;


    // =========================================================
    // USER DISPLAY
    // =========================================================

    const displayName =
        user?.name ||
        "Admin";

    const displayRole =
        user?.role ===
            "SUPER_ADMIN"
            ? "Super Admin"
            : "Admin";

    const avatarLetter =
        displayName
            .charAt(0)
            .toUpperCase();


    // =========================================================
    // FULLSCREEN
    // =========================================================

    const handleFullscreen = () => {
        if (
            !document.fullscreenElement
        ) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };


    // =========================================================
    // NOTIFICATION ROUTE
    // =========================================================

    const getNotificationRoute = (
        notification
    ) => {
        switch (
        notification?.id
        ) {
            case "offline":
                return "/field-tracker/offline";

            case "battery":
                return "/field-tracker/battery-low";

            case "verification":
                return "/visits/verified";

            case "checkin":
                return "/check-in/latest";

            default:
                return "/dashboard";
        }
    };


    // =========================================================
    // OPEN NOTIFICATION
    // =========================================================

    const handleNotificationClick = (
        notification
    ) => {
        setShowNotifications(
            false
        );

        navigate(
            getNotificationRoute(
                notification
            )
        );
    };


    // =========================================================
    // TOGGLE NOTIFICATIONS
    // =========================================================

    const handleNotificationToggle = () => {
        setShowNotifications(
            (current) => !current
        );

        if (
            !showNotifications
        ) {
            fetchNotifications();
        }
    };


    return (
        <header className="header">

            <div className="header-actions">

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="header-notification-wrapper">

                    <button
                        type="button"
                        className="header-button"
                        aria-label="Notifications"
                        aria-expanded={
                            showNotifications
                        }
                        onClick={
                            handleNotificationToggle
                        }
                    >
                        <Bell
                            size={20}
                        />

                        {notificationCount >
                            0 && (
                                <span className="notification-badge">
                                    {notificationCount >
                                        99
                                        ? "99+"
                                        : notificationCount}
                                </span>
                            )}
                    </button>


                    {showNotifications && (
                        <div className="notification-panel">

                            <div className="notification-header">

                                <div>
                                    <strong>
                                        Notifications
                                    </strong>

                                    <span>
                                        {notificationCount ===
                                            0
                                            ? "No pending alerts"
                                            : `${notificationCount} alert${notificationCount !==
                                                1
                                                ? "s"
                                                : ""
                                            }`}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="notification-close"
                                    onClick={() =>
                                        setShowNotifications(
                                            false
                                        )
                                    }
                                    aria-label="Close notifications"
                                >
                                    <X
                                        size={16}
                                    />
                                </button>

                            </div>


                            <div className="notification-list">

                                {loadingNotifications ? (
                                    <div className="notification-empty">
                                        Loading notifications...
                                    </div>
                                ) : notifications.length ===
                                    0 ? (
                                    <div className="notification-empty">
                                        <Bell
                                            size={24}
                                        />

                                        <span>
                                            No new notifications
                                        </span>
                                    </div>
                                ) : (
                                    notifications.map(
                                        (
                                            notification,
                                            index
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    notification.id ||
                                                    index
                                                }
                                                className={`notification-item ${notification.type ||
                                                    "warning"
                                                    }`}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >
                                                <div className="notification-item-icon">
                                                    <Bell
                                                        size={16}
                                                    />
                                                </div>

                                                <div className="notification-item-content">

                                                    <strong>
                                                        {
                                                            notification.title
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            notification.description
                                                        }
                                                    </span>

                                                </div>
                                            </button>
                                        )
                                    )
                                )}

                            </div>

                        </div>
                    )}

                </div>


                {/* =================================================
                    THEME
                ================================================= */}

                <button
                    type="button"
                    className="header-button"
                    onClick={
                        toggleTheme
                    }
                    aria-label="Toggle theme"
                >
                    {theme ===
                        "dark" ? (
                        <Sun
                            size={20}
                        />
                    ) : (
                        <Moon
                            size={20}
                        />
                    )}
                </button>


                {/* =================================================
                    FULLSCREEN
                ================================================= */}

                <button
                    type="button"
                    className="header-button"
                    onClick={
                        handleFullscreen
                    }
                    aria-label="Fullscreen"
                >
                    <Maximize
                        size={19}
                    />
                </button>


                {/* =================================================
                    ADMIN PROFILE
                ================================================= */}

                <div className="admin-profile">

                    <div className="admin-avatar">
                        {
                            avatarLetter
                        }
                    </div>

                    <div className="admin-info">

                        <strong>
                            {
                                displayName
                            }
                        </strong>

                        <span>
                            {
                                displayRole
                            }
                        </span>

                    </div>

                </div>

            </div>

        </header>
    );
};

export default Header;
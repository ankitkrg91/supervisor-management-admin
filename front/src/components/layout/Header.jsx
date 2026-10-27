import {
    Bell,
    Maximize,
    Sun,
    Moon,
    X,
} from "lucide-react";

import {
    useEffect,
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

// IMPORTANT: Logo file must exist at src/assets/vinicia-logo.png
import viniciaLogo from "../../assets/vinicia-logo.png";

import "./Header.css";

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Load notifications from backend
    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);

            const response = await apiFetch("/api/dashboard", {
                method: "GET",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message || "Failed to load notifications"
                );
            }

            const alerts = data?.data?.alerts || [];

            setNotifications(
                Array.isArray(alerts) ? alerts : []
            );
        } catch (error) {
            console.error("Notification fetch error:", error);
            setNotifications([]);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Initial notifications and refresh every 60 seconds
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Close notification dropdown with Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setShowNotifications(false);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const notificationCount = notifications.length;

    // Fullscreen toggle
    const handleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen?.();
            } else {
                await document.exitFullscreen?.();
            }
        } catch (error) {
            console.error("Fullscreen error:", error);
        }
    };

    // Select page based on notification type
    const getNotificationRoute = (notification) => {
        switch (notification?.id) {
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

    const handleNotificationClick = (notification) => {
        setShowNotifications(false);
        navigate(getNotificationRoute(notification));
    };

    const handleNotificationToggle = () => {
        const nextState = !showNotifications;
        setShowNotifications(nextState);

        if (nextState) {
            fetchNotifications();
        }
    };

    return (
        <header className="header">
            <div className="header-actions">

                {/* Notifications */}
                <div className="header-notification-wrapper">
                    <button
                        type="button"
                        className="header-button"
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                        onClick={handleNotificationToggle}
                    >
                        <Bell size={20} />

                        {notificationCount > 0 && (
                            <span className="notification-badge">
                                {notificationCount > 99
                                    ? "99+"
                                    : notificationCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-panel">
                            <div className="notification-header">
                                <div>
                                    <strong>Notifications</strong>

                                    <span>
                                        {notificationCount === 0
                                            ? "No pending alerts"
                                            : `${notificationCount} alert${notificationCount !== 1
                                                ? "s"
                                                : ""
                                            }`}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="notification-close"
                                    onClick={() =>
                                        setShowNotifications(false)
                                    }
                                    aria-label="Close notifications"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="notification-list">
                                {loadingNotifications ? (
                                    <div className="notification-empty">
                                        Loading notifications...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="notification-empty">
                                        <Bell size={24} />
                                        <span>No new notifications</span>
                                    </div>
                                ) : (
                                    notifications.map(
                                        (notification, index) => (
                                            <button
                                                type="button"
                                                key={
                                                    notification.id || index
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
                                                    <Bell size={16} />
                                                </div>

                                                <div className="notification-item-content">
                                                    <strong>
                                                        {notification.title}
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

                {/* Theme toggle */}
                <button
                    type="button"
                    className="header-button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun size={20} />
                    ) : (
                        <Moon size={20} />
                    )}
                </button>

                {/* Fullscreen toggle */}
                <button
                    type="button"
                    className="header-button"
                    onClick={handleFullscreen}
                    aria-label="Fullscreen"
                >
                    <Maximize size={19} />
                </button>

                {/* Vinicia logo replaces Super Admin profile */}
                <div className="header-company-logo">
                    <img
                        src={viniciaLogo}
                        alt="Vinicia Security Services Pvt Ltd"
                    />
                </div>

            </div>
        </header>
    );
};

export default Header;
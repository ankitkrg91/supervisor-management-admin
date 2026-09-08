import {
    Bell,
    Maximize,
    Sun,
    Moon,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import "./Header.css";

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    return (
        <header className="header">
            <div className="header-actions">
                <button
                    type="button"
                    className="header-button"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span className="notification-badge">12</span>
                </button>

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

                <button
                    type="button"
                    className="header-button"
                    onClick={handleFullscreen}
                    aria-label="Fullscreen"
                >
                    <Maximize size={19} />
                </button>

                <div className="admin-profile">
                    <div className="admin-avatar">A</div>

                    <div className="admin-info">
                        <strong>Admin</strong>
                        <span>Super Admin</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
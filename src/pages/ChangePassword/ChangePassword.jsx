import { useState } from "react";
import {
    Eye,
    EyeOff,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";

import "./ChangePassword.css";

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showCurrent, setShowCurrent] =
        useState(false);

    const [showNew, setShowNew] =
        useState(false);

    const [showConfirm, setShowConfirm] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const getPasswordStrength = () => {
        if (!newPassword) {
            return {
                label: "",
                className: "",
            };
        }

        let score = 0;

        if (newPassword.length >= 8) {
            score++;
        }

        if (/[A-Z]/.test(newPassword)) {
            score++;
        }

        if (/[a-z]/.test(newPassword)) {
            score++;
        }

        if (/[0-9]/.test(newPassword)) {
            score++;
        }

        if (/[^A-Za-z0-9]/.test(newPassword)) {
            score++;
        }

        if (score <= 2) {
            return {
                label: "Weak",
                className: "weak",
            };
        }

        if (score <= 4) {
            return {
                label: "Medium",
                className: "medium",
            };
        }

        return {
            label: "Strong",
            className: "strong",
        };
    };

    const passwordStrength =
        getPasswordStrength();

    const validatePassword = () => {
        if (!currentPassword) {
            return "Please enter your current password.";
        }

        if (!newPassword) {
            return "Please enter a new password.";
        }

        if (newPassword.length < 8) {
            return "New password must contain at least 8 characters.";
        }

        if (newPassword === currentPassword) {
            return "New password must be different from your current password.";
        }

        if (!confirmPassword) {
            return "Please confirm your new password.";
        }

        if (newPassword !== confirmPassword) {
            return "New password and confirm password do not match.";
        }

        return "";
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        const error = validatePassword();

        if (error) {
            setMessage(error);
            setMessageType("error");
            return;
        }

        /*
          Backend API will be connected here later.
    
          Example:
          await axios.put("/api/auth/change-password", {
            currentPassword,
            newPassword,
          });
        */

        console.log("Change password request:", {
            currentPassword,
            newPassword,
        });

        setMessage(
            "Password changed successfully."
        );

        setMessageType("success");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleCancel = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setMessage("");
        setMessageType("");
    };

    return (
        <div className="change-password-page">

            <div className="change-password-card">

                {/* =========================
            HEADER
        ========================= */}

                <div className="change-password-header">

                    <div className="change-password-icon">
                        <LockKeyhole size={25} />
                    </div>

                    <div>
                        <h2>Change Password</h2>

                        <p>
                            Update your account password
                            to keep your account secure.
                        </p>
                    </div>

                </div>

                {/* =========================
            SECURITY INFO
        ========================= */}

                <div className="password-security-info">

                    <ShieldCheck size={19} />

                    <div>
                        <strong>
                            Password Security
                        </strong>

                        <span>
                            Use a strong password with at
                            least 8 characters, including
                            uppercase, lowercase, numbers
                            and special characters.
                        </span>
                    </div>

                </div>

                {/* =========================
            MESSAGE
        ========================= */}

                {message && (
                    <div
                        className={`password-message ${messageType}`}
                    >
                        {message}
                    </div>
                )}

                {/* =========================
            FORM
        ========================= */}

                <form
                    className="change-password-form"
                    onSubmit={handleSubmit}
                >

                    {/* CURRENT PASSWORD */}

                    <div className="password-field">

                        <label htmlFor="currentPassword">
                            Current Password
                        </label>

                        <div className="password-input-wrapper">

                            <LockKeyhole size={17} />

                            <input
                                id="currentPassword"
                                type={
                                    showCurrent
                                        ? "text"
                                        : "password"
                                }
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter current password"
                            />

                            <button
                                type="button"
                                className="password-eye-button"
                                onClick={() =>
                                    setShowCurrent(
                                        (value) => !value
                                    )
                                }
                                aria-label={
                                    showCurrent
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showCurrent ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* NEW PASSWORD */}

                    <div className="password-field">

                        <label htmlFor="newPassword">
                            New Password
                        </label>

                        <div className="password-input-wrapper">

                            <LockKeyhole size={17} />

                            <input
                                id="newPassword"
                                type={
                                    showNew
                                        ? "text"
                                        : "password"
                                }
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter new password"
                            />

                            <button
                                type="button"
                                className="password-eye-button"
                                onClick={() =>
                                    setShowNew(
                                        (value) => !value
                                    )
                                }
                                aria-label={
                                    showNew
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showNew ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>

                        </div>

                        {/* PASSWORD STRENGTH */}

                        {newPassword && (
                            <div className="password-strength">

                                <div className="strength-top">

                                    <span>
                                        Password strength
                                    </span>

                                    <strong
                                        className={
                                            passwordStrength.className
                                        }
                                    >
                                        {passwordStrength.label}
                                    </strong>

                                </div>

                                <div className="strength-bar">

                                    <span
                                        className={
                                            passwordStrength.className
                                        }
                                    />

                                </div>

                            </div>
                        )}

                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="password-field">

                        <label htmlFor="confirmPassword">
                            Confirm New Password
                        </label>

                        <div className="password-input-wrapper">

                            <LockKeyhole size={17} />

                            <input
                                id="confirmPassword"
                                type={
                                    showConfirm
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Re-enter new password"
                            />

                            <button
                                type="button"
                                className="password-eye-button"
                                onClick={() =>
                                    setShowConfirm(
                                        (value) => !value
                                    )
                                }
                                aria-label={
                                    showConfirm
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirm ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* =========================
              BUTTONS
          ========================= */}

                    <div className="change-password-actions">

                        <button
                            type="button"
                            className="password-cancel-button"
                            onClick={handleCancel}
                        >
                            CANCEL
                        </button>

                        <button
                            type="submit"
                            className="password-submit-button"
                        >
                            <ShieldCheck size={17} />
                            CHANGE PASSWORD
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default ChangePassword;
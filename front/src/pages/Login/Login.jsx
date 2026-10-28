import { useState } from "react";

import {
    Eye,
    EyeOff,
    Lock,
    Mail,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiFetch } from "../../utils/api";

import "./Login.css";

const Login = () => {
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (
            !identifier.trim() ||
            !password.trim()
        ) {
            setError(
                "Please enter your email or mobile number and password."
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await apiFetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                identifier: identifier.trim(),
                                password,
                            }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Login failed"
                );
            }

            /* =================================================
               BACKEND ALLOWS ONLY SUPER_ADMIN
            ================================================= */

            if (
                data?.data?.user?.role !==
                "SUPER_ADMIN"
            ) {
                throw new Error(
                    "Only Super Admin can access this portal."
                );
            }

            /* =================================================
               STORE ACCESS TOKEN
            ================================================= */

            localStorage.setItem(
                "token",
                data.data.accessToken
            );

            /* =================================================
               STORE REFRESH TOKEN
            ================================================= */

            localStorage.setItem(
                "refreshToken",
                data.data.refreshToken
            );

            /* =================================================
               STORE LOGGED-IN USER
            ================================================= */

            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.data.user
                )
            );

            /* =================================================
               GO TO DASHBOARD
            ================================================= */

            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );
        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            setError(
                error?.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Brand */}
                <div className="login-brand">
                    <div className="login-logo">
                        SM
                    </div>

                    <h1>
                        Supervisor Management
                    </h1>

                    <p>
                        Super Admin Portal
                    </p>
                </div>

                {/* Heading */}
                <div className="login-heading">
                    <h2>
                        Welcome Back
                    </h2>

                    <p>
                        Sign in to continue to your admin dashboard.
                    </p>
                </div>

                {/* Form */}
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    {/* Email or Mobile Number */}
                    <div className="login-field">
                        <label htmlFor="identifier">
                            Email or Mobile Number
                        </label>

                        <div className="login-input-wrapper">
                            <Mail size={18} />

                            <input
                                id="identifier"
                                type="text"
                                inputMode="text"
                                placeholder="Enter email or mobile number"
                                value={identifier}
                                onChange={(e) =>
                                    setIdentifier(
                                        e.target.value
                                    )
                                }
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="login-input-wrapper">
                            <Lock size={18} />

                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (current) =>
                                            !current
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Sign In"}
                    </button>

                </form>

                {/* Footer */}
                <div className="login-footer">
                    Supervisor Management System
                </div>

            </div>
        </div>
    );
};

export default Login;
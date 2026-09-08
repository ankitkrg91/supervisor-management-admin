import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter email and password.");
            return;
        }

        // Temporary frontend login.
        // Backend JWT authentication will replace this later.
        localStorage.setItem("token", "demo-access-token");

        localStorage.setItem(
            "user",
            JSON.stringify({
                name: "Super Admin",
                email: email,
                role: "SUPER_ADMIN",
            })
        );

        navigate("/dashboard", { replace: true });
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
                    <h2>Welcome Back</h2>

                    <p>
                        Sign in to continue to your admin dashboard.
                    </p>
                </div>

                {/* Form */}
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    {/* Email */}
                    <div className="login-field">
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <div className="login-input-wrapper">
                            <Mail size={18} />

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
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
                                    setPassword(e.target.value)
                                }
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (current) => !current
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
                    >
                        Sign In
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
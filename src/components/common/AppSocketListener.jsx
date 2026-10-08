import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

import {
    API_BASE_URL,
    refreshAccessToken,
} from "../../utils/api";

const AppSocketListener = () => {
    const location = useLocation();

    useEffect(() => {
        // Do not create a socket on the login page
        if (location.pathname === "/login") {
            return;
        }

        const userData = localStorage.getItem("user");

        if (!userData) {
            return;
        }

        let user;

        try {
            user = JSON.parse(userData);
        } catch (error) {
            console.error(
                "❌ Invalid user data in localStorage"
            );
            return;
        }

        // Only Super Admin uses this Admin socket
        if (user?.role !== "SUPER_ADMIN") {
            return;
        }

        let socket = null;
        let refreshing = false;

        const connectSocket = () => {
            const token =
                localStorage.getItem("token");

            if (!token) {
                return;
            }

            socket = io(
                API_BASE_URL,
                {
                    auth: {
                        token,
                    },

                    transports: [
                        "polling",
                    ],

                    reconnection: true,

                    reconnectionAttempts:
                        Infinity,

                    reconnectionDelay:
                        1000,
                }
            );

            socket.on(
                "connect",
                () => {
                    console.log(
                        "✅ SUPER_ADMIN SOCKET CONNECTED"
                    );

                    console.log(
                        "🆔 Socket ID:",
                        socket.id
                    );
                }
            );

            socket.on(
                "field-location-updated",
                (data) => {
                    console.log(
                        "📍 LIVE LOCATION RECEIVED BY ADMIN"
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "field-location-updated",
                            {
                                detail: data,
                            }
                        )
                    );
                }
            );

            socket.on(
                "connect_error",
                async (error) => {
                    console.error(
                        "❌ SUPER_ADMIN SOCKET ERROR:",
                        error.message
                    );

                    // Refresh token only once at a time
                    if (
                        error.message ===
                        "Invalid or expired access token" &&
                        !refreshing
                    ) {
                        try {
                            refreshing = true;

                            const newToken =
                                await refreshAccessToken();

                            console.log(
                                "🔄 Access token refreshed for socket"
                            );

                            // Update socket authentication
                            socket.auth = {
                                token:
                                    newToken,
                            };

                            // Reconnect using fresh token
                            socket.disconnect();
                            socket.connect();
                        } catch (
                        refreshError
                        ) {
                            console.error(
                                "❌ Socket token refresh failed:",
                                refreshError.message
                            );

                            localStorage.removeItem(
                                "token"
                            );

                            localStorage.removeItem(
                                "refreshToken"
                            );

                            localStorage.removeItem(
                                "user"
                            );

                            window.location.href =
                                "/login";
                        } finally {
                            refreshing = false;
                        }
                    }
                }
            );

            socket.on(
                "disconnect",
                (reason) => {
                    console.warn(
                        "🔌 SUPER_ADMIN SOCKET DISCONNECTED:",
                        reason
                    );
                }
            );
        };

        connectSocket();

        /*
         * Refresh the access token every 10 minutes.
         * This keeps the Socket.IO connection authenticated
         * before the 15-minute access token expires.
         */
        const refreshInterval =
            setInterval(
                async () => {
                    try {
                        const newToken =
                            await refreshAccessToken();

                        if (socket) {
                            socket.auth = {
                                token:
                                    newToken,
                            };

                            // Reconnect with the fresh token
                            socket.disconnect();
                            socket.connect();
                        }
                    } catch (error) {
                        console.error(
                            "❌ Background token refresh failed:",
                            error.message
                        );
                    }
                },
                10 * 60 * 1000
            );

        return () => {
            clearInterval(
                refreshInterval
            );

            if (socket) {
                socket.disconnect();
            }
        };
    }, [location.pathname]);

    return null;
};

export default AppSocketListener;
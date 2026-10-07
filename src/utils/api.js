const API_BASE_URL = "http://localhost:5000";

let refreshPromise = null;

const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
};

const refreshAccessToken = async () => {
    // Prevent multiple requests from refreshing at the same time
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken =
            localStorage.getItem("refreshToken");

        if (!refreshToken) {
            throw new Error(
                "No refresh token available"
            );
        }

        const response = await fetch(
            `${API_BASE_URL}/api/auth/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refreshToken,
                }),
            }
        );

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "Invalid response from refresh endpoint"
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                "Unable to refresh access token"
            );
        }

        const newAccessToken =
            data?.data?.accessToken;

        if (!newAccessToken) {
            throw new Error(
                "Refresh endpoint did not return an access token"
            );
        }

        localStorage.setItem(
            "token",
            newAccessToken
        );

        if (data?.data?.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(data.data.user)
            );
        }

        return newAccessToken;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
};

const apiFetch = async (
    endpoint,
    options = {}
) => {
    let token = localStorage.getItem("token");

    const makeRequest = async (accessToken) => {
        const headers = {
            ...(options.headers || {}),
        };

        if (accessToken) {
            headers.Authorization =
                `Bearer ${accessToken}`;
        }

        return fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        );
    };

    // First request
    let response = await makeRequest(token);

    // Access token expired
    if (response.status === 401) {
        try {
            // Get a fresh access token
            token = await refreshAccessToken();

            // Retry original request exactly once
            response = await makeRequest(token);
        } catch (error) {
            console.error(
                "Authentication refresh failed:",
                error.message
            );

            clearAuth();

            // Send user back to login
            if (
                window.location.pathname !==
                "/login"
            ) {
                window.location.replace(
                    "/login"
                );
            }

            throw error;
        }
    }

    return response;
};

export {
    apiFetch,
    refreshAccessToken,
};
const API_BASE_URL =
    (
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000"
    ).replace(/\/+$/, "");

let refreshPromise = null;

/* =========================================================
   CLEAR AUTH
========================================================= */

const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
};

/* =========================================================
   REFRESH ACCESS TOKEN
========================================================= */

const refreshAccessToken = async () => {
    /*
     * Prevent multiple requests from refreshing
     * the token at the same time.
     */
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );

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
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    refreshToken,
                }),
            }
        );

        let data;

        try {
            data =
                await response.json();
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
                JSON.stringify(
                    data.data.user
                )
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

/* =========================================================
   API FETCH
========================================================= */

const apiFetch = async (
    endpoint,
    options = {}
) => {
    let token =
        localStorage.getItem("token");

    const makeRequest = async (
        accessToken
    ) => {
        const headers = {
            "Content-Type":
                "application/json",
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
                cache: "no-store",
            }
        );
    };

    /* =====================================================
       FIRST REQUEST
    ===================================================== */

    let response =
        await makeRequest(token);

    /* =====================================================
       ACCESS TOKEN EXPIRED
    ===================================================== */

    if (response.status === 401) {
        try {
            /*
             * Get a fresh access token.
             */
            token =
                await refreshAccessToken();

            /*
             * Retry the original request
             * exactly once.
             */
            response =
                await makeRequest(token);
        } catch (error) {
            console.error(
                "Authentication refresh failed:",
                error?.message
            );

            clearAuth();

            /*
             * Redirect to login.
             */
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

/* =========================================================
   EXPORT
========================================================= */

export {
    apiFetch,
    refreshAccessToken,
};
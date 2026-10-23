// Central config for the public (no-login) audit / feedback pages.
// Set VITE_API_URL (backend) and VITE_PUBLIC_APP_URL (this frontend) in Render.
const BACKEND_FALLBACK = "https://supervisor-management-backend.onrender.com";

export const PUBLIC_API_BASE = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : BACKEND_FALLBACK)
).replace(/\/+$/, "");

export const PUBLIC_APP_URL = (
    import.meta.env.VITE_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

export const auditUrl = (visitId) => `${PUBLIC_APP_URL}/audit-view/${visitId}`;
export const feedbackUrl = (visitId) => `${PUBLIC_APP_URL}/feedback/${visitId}`;

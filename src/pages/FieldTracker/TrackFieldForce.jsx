import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    Smartphone,
    WifiOff,
    BatteryLow,
    LogIn,
    MapPin,
    Filter,
    X,
} from "lucide-react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    ZoomControl,
    useMap,
} from "react-leaflet";

import L from "leaflet";

import { apiFetch } from "../../utils/api";

import "leaflet/dist/leaflet.css";
import "./TrackFieldForce.css";

/*
 * Fix Leaflet's default marker icons when using Vite.
 */
const markerIcon = new L.Icon({
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],

    iconAnchor: [12, 41],

    popupAnchor: [1, -34],

    shadowSize: [41, 41],
});

/*
 * Moves the map to all available Supervisor locations.
 *
 * fitTrigger changes only when the user clicks
 * the Location button, so the button now works.
 */
const MapAutoFit = ({
    supervisors,
    fitTrigger,
}) => {
    const map = useMap();

    useEffect(() => {
        if (!fitTrigger) {
            return;
        }

        const validPoints = supervisors
            .filter(
                (item) =>
                    item.location?.latitude !==
                    undefined &&
                    item.location?.longitude !==
                    undefined
            )
            .map((item) => [
                Number(
                    item.location.latitude
                ),
                Number(
                    item.location.longitude
                ),
            ]);

        if (validPoints.length === 0) {
            return;
        }

        if (validPoints.length === 1) {
            map.setView(
                validPoints[0],
                14
            );
            return;
        }

        const bounds =
            L.latLngBounds(validPoints);

        map.fitBounds(bounds, {
            padding: [50, 50],
        });
    }, [fitTrigger, supervisors, map]);

    return null;
};

const TrackFieldForce = () => {
    const [fieldForce, setFieldForce] = useState([]);
    const [notCheckedInCount, setNotCheckedInCount] = useState(0);

    const [activeFilter, setActiveFilter] = useState("ALL");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const [fitTrigger, setFitTrigger] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // FETCH SUPERVISORS + LOCATIONS + NOT CHECKED IN
    // =========================================================

    const fetchData = async () => {
        try {
            setError("");

            const [
                trackResponse,
                notCheckedInResponse,
            ] = await Promise.all([
                apiFetch(
                    "/api/location/track",
                    {
                        method: "GET",
                    }
                ),

                apiFetch(
                    "/api/location/not-checked-in",
                    {
                        method: "GET",
                    }
                ),
            ]);

            const trackData =
                await trackResponse.json();

            const notCheckedInData =
                await notCheckedInResponse.json();

            if (!trackResponse.ok) {
                throw new Error(
                    trackData?.message ||
                    "Failed to fetch tracked field force"
                );
            }

            if (!notCheckedInResponse.ok) {
                throw new Error(
                    notCheckedInData?.message ||
                    "Failed to fetch not checked-in supervisors"
                );
            }

            setFieldForce(
                trackData?.data?.fieldForce || []
            );

            setNotCheckedInCount(
                notCheckedInData?.data?.notCheckedIn?.length || 0
            );
        } catch (error) {
            console.error(
                "Track field force fetch error:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch tracking data"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD + AUTO REFRESH + LIVE SOCKET LISTENER
    // =========================================================

    useEffect(() => {
        fetchData();

        const refreshInterval =
            setInterval(() => {
                fetchData();
            }, 60000);

        const handleLiveLocation = (event) => {
            const data = event.detail;

            if (
                !data?.user?.id ||
                !data?.location
            ) {
                return;
            }

            setFieldForce((current) => {
                const existingIndex =
                    current.findIndex(
                        (item) =>
                            item.user?.id ===
                            data.user.id
                    );

                const updatedPerson = {
                    user: data.user,
                    site:
                        existingIndex !== -1
                            ? current[existingIndex].site
                            : null,
                    location: data.location,
                    trackingStatus: "ONLINE",
                    batteryStatus:
                        data.location?.batteryLevel !== null &&
                            data.location?.batteryLevel !== undefined
                            ? data.location.batteryLevel <= 20
                                ? "BATTERY_LOW"
                                : "NORMAL"
                            : "UNKNOWN",
                };

                if (existingIndex === -1) {
                    return [
                        ...current,
                        updatedPerson,
                    ];
                }

                const updated = [...current];

                updated[existingIndex] = {
                    ...updated[existingIndex],
                    location: data.location,
                    trackingStatus: "ONLINE",
                    batteryStatus:
                        updatedPerson.batteryStatus,
                };

                return updated;
            });
        };

        window.addEventListener(
            "field-location-updated",
            handleLiveLocation
        );

        return () => {
            clearInterval(refreshInterval);

            window.removeEventListener(
                "field-location-updated",
                handleLiveLocation
            );
        };
    }, []);

    // =========================================================
    // SUMMARY COUNTS
    // =========================================================

    const onlineCount = useMemo(() => {
        return fieldForce.filter(
            (item) =>
                item.trackingStatus === "ONLINE"
        ).length;
    }, [fieldForce]);

    const offlineCount = useMemo(() => {
        return fieldForce.filter(
            (item) =>
                item.trackingStatus === "OFFLINE"
        ).length;
    }, [fieldForce]);

    const batteryLowCount = useMemo(() => {
        return fieldForce.filter(
            (item) =>
                item.batteryStatus === "BATTERY_LOW"
        ).length;
    }, [fieldForce]);

    // =========================================================
    // FILTERED SUPERVISORS FOR MAP DISPLAY
    // =========================================================

    const filteredSupervisors = useMemo(() => {
        return fieldForce.filter((item) => {
            if (activeFilter === "ONLINE") {
                return (
                    item.trackingStatus === "ONLINE"
                );
            }

            if (activeFilter === "OFFLINE") {
                return (
                    item.trackingStatus === "OFFLINE"
                );
            }

            if (activeFilter === "BATTERY_LOW") {
                return (
                    item.batteryStatus === "BATTERY_LOW"
                );
            }

            return true;
        });
    }, [fieldForce, activeFilter]);

    // =========================================================
    // LOCATION BUTTON CLICK
    // =========================================================

    const handleShowAllLocations = () => {
        setFitTrigger((current) => current + 1);
    };

    // =========================================================
    // FILTER BUTTON MENU
    // =========================================================

    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        setFilterMenuOpen(false);

        setFitTrigger((current) => current + 1);
    };

    const summaryCards = [
        {
            title: "Online",
            value: onlineCount,
            type: "online",
            icon: Smartphone,
            path: "/field-tracker/online",
        },
        {
            title: "Offline",
            value: offlineCount,
            type: "offline",
            icon: WifiOff,
            path: "/field-tracker/offline",
        },
        {
            title: "Battery Low",
            value: batteryLowCount,
            type: "battery",
            icon: BatteryLow,
            path: "/field-tracker/battery-low",
        },
        {
            title: "Not Checked-In",
            value: notCheckedInCount,
            type: "not-checked",
            icon: LogIn,
            path: "/field-tracker/not-checked-in",
        },
    ];

    const defaultCenter = [31.634, 74.8723];

    return (
        <div className="track-field-force-page">
            <section className="track-content-card">
                {/* =========================
                    TOP ACTION BAR
                ========================= */}
                <div className="track-toolbar">
                    <div className="track-toolbar-line" />

                    <div className="track-actions" style={{ position: "relative" }}>
                        {/* LOCATION BUTTON */}
                        <button
                            type="button"
                            className="track-action-button"
                            title="Show all Supervisor locations"
                            onClick={handleShowAllLocations}
                            disabled={filteredSupervisors.length === 0}
                            style={{
                                opacity: filteredSupervisors.length === 0 ? 0.5 : 1,
                                cursor: filteredSupervisors.length === 0 ? "not-allowed" : "pointer",
                            }}
                        >
                            <MapPin size={20} />
                        </button>

                        {/* FILTER BUTTON */}
                        <button
                            type="button"
                            className="track-action-button"
                            title="Filter Map by status"
                            onClick={() => setFilterMenuOpen((open) => !open)}
                            style={{
                                background: activeFilter !== "ALL" ? "#1e40af" : undefined,
                            }}
                        >
                            {activeFilter !== "ALL" ? <X size={20} /> : <Filter size={20} />}
                        </button>

                        {/* FILTER POPUP */}
                        {filterMenuOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "56px",
                                    right: "0",
                                    background: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                    width: "180px",
                                    padding: "6px",
                                    zIndex: 1000,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("ALL")}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: activeFilter === "ALL" ? "#f3f4f6" : "transparent",
                                        padding: "9px 10px",
                                        textAlign: "left",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: activeFilter === "ALL" ? 700 : 500,
                                    }}
                                >
                                    All ({fieldForce.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("ONLINE")}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: activeFilter === "ONLINE" ? "#f3f4f6" : "transparent",
                                        padding: "9px 10px",
                                        textAlign: "left",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: activeFilter === "ONLINE" ? 700 : 500,
                                    }}
                                >
                                    Online
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("OFFLINE")}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: activeFilter === "OFFLINE" ? "#f3f4f6" : "transparent",
                                        padding: "9px 10px",
                                        textAlign: "left",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: activeFilter === "OFFLINE" ? 700 : 500,
                                    }}
                                >
                                    Offline
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleFilterChange("BATTERY_LOW")}
                                    style={{
                                        width: "100%",
                                        border: "none",
                                        background: activeFilter === "BATTERY_LOW" ? "#f3f4f6" : "transparent",
                                        padding: "9px 10px",
                                        textAlign: "left",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: activeFilter === "BATTERY_LOW" ? 700 : 500,
                                    }}
                                >
                                    Battery Low
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* =========================
                    ACTIVE FILTER
                ========================= */}
                {activeFilter !== "ALL" && (
                    <div
                        style={{
                            padding: "8px 20px 0",
                            fontSize: "13px",
                            color: "#6b7280",
                        }}
                    >
                        Showing:{" "}
                        <strong>
                            {activeFilter === "BATTERY_LOW" ? "Battery Low" : activeFilter}
                        </strong>{" "}
                        ({filteredSupervisors.length})
                    </div>
                )}

                {/* =========================
                    SUMMARY CARDS (CLICKABLE NAV)
                ========================= */}
                <div className="track-summary">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <Link
                                key={card.title}
                                to={card.path}
                                className="track-card-link"
                            >
                                <div className={`track-summary-card track-summary-${card.type}`}>
                                    <div className="track-summary-content">
                                        <span className="track-summary-title">
                                            {card.title}
                                        </span>

                                        <span className="track-summary-value">
                                            {card.value}
                                        </span>
                                    </div>

                                    <div className="track-summary-icon">
                                        <Icon size={22} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* =========================
                    ERROR
                ========================= */}
                {error && (
                    <div
                        style={{
                            padding: "15px 20px",
                            color: "#dc2626",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* =========================
                    MAP
                ========================= */}
                <div className="tracking-map">
                    <MapContainer
                        center={defaultCenter}
                        zoom={6}
                        zoomControl={false}
                        className="leaflet-map"
                    >
                        <ZoomControl position="topleft" />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapAutoFit
                            supervisors={filteredSupervisors}
                            fitTrigger={fitTrigger}
                        />

                        {filteredSupervisors
                            .filter(
                                (person) =>
                                    person.location?.latitude !== undefined &&
                                    person.location?.longitude !== undefined
                            )
                            .map((person) => (
                                <Marker
                                    key={person.user.id}
                                    position={[
                                        Number(person.location.latitude),
                                        Number(person.location.longitude),
                                    ]}
                                    icon={markerIcon}
                                >
                                    <Popup>
                                        <div className="field-force-popup">
                                            <strong>{person.user.name}</strong>

                                            <span>{person.user?.role || "SUPERVISOR"}</span>

                                            {person.site && (
                                                <span>Site: {person.site.name}</span>
                                            )}

                                            <span>
                                                Battery:{" "}
                                                {(person.location?.batteryLevel ?? person.location?.batteryPercentage) !== null &&
                                                    (person.location?.batteryLevel ?? person.location?.batteryPercentage) !== undefined
                                                    ? `${person.location.batteryLevel ?? person.location.batteryPercentage}%`
                                                    : "N/A"}
                                            </span>

                                            <span>Status: {person.trackingStatus}</span>

                                            <span>Latitude: {person.location.latitude}</span>

                                            <span>Longitude: {person.location.longitude}</span>

                                            <span>
                                                Last Seen:{" "}
                                                {person.location?.recordedAt
                                                    ? new Date(person.location.recordedAt).toLocaleString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "No location"}
                                            </span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                    </MapContainer>
                </div>
            </section>
        </div>
    );
};

export default TrackFieldForce;
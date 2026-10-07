import { useEffect, useMemo, useState } from "react";

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
        const validLocations = supervisors
            .filter(
                (person) =>
                    person?.location?.latitude !==
                    undefined &&
                    person?.location?.latitude !==
                    null &&
                    person?.location?.longitude !==
                    undefined &&
                    person?.location?.longitude !==
                    null
            )
            .map((person) => [
                Number(person.location.latitude),
                Number(person.location.longitude),
            ])
            .filter(
                ([latitude, longitude]) =>
                    Number.isFinite(latitude) &&
                    Number.isFinite(longitude)
            );

        if (validLocations.length === 0) {
            return;
        }

        if (validLocations.length === 1) {
            map.setView(
                validLocations[0],
                13
            );

            return;
        }

        const bounds =
            L.latLngBounds(validLocations);

        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 14,
        });
    }, [
        map,
        supervisors,
        fitTrigger,
    ]);

    return null;
};

const TrackFieldForce = () => {
    const [fieldForce, setFieldForce] =
        useState([]);

    const [notCheckedInCount, setNotCheckedInCount] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [filterOpen, setFilterOpen] =
        useState(false);

    const [activeFilter, setActiveFilter] =
        useState("ALL");

    const [fitTrigger, setFitTrigger] =
        useState(0);

    const fetchFieldForce = async () => {
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
                    "Failed to fetch tracked supervisors"
                );
            }

            if (!notCheckedInResponse.ok) {
                throw new Error(
                    notCheckedInData?.message ||
                    "Failed to fetch not checked-in supervisors"
                );
            }

            const supervisors =
                trackData?.data?.fieldForce ||
                [];

            const notCheckedIn =
                notCheckedInData?.data
                    ?.notCheckedIn || [];

            setFieldForce(
                supervisors
            );

            setNotCheckedInCount(
                notCheckedIn.length
            );
        } catch (error) {
            console.error(
                "Failed to fetch tracked supervisors:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch tracked supervisors"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFieldForce();

        /*
         * Refresh every minute.
         */
        const refreshInterval =
            setInterval(() => {
                fetchFieldForce();
            }, 60000);

        /*
         * Receive live Supervisor location
         * from AppSocketListener.
         */
        const handleLiveLocation = (event) => {
            const data = event.detail;

            if (
                !data?.user?.id ||
                !data?.location
            ) {
                return;
            }

            const liveLocation =
                data.location;

            const batteryStatus =
                liveLocation.batteryLevel !==
                    null &&
                    liveLocation.batteryLevel !==
                    undefined
                    ? liveLocation.batteryLevel <=
                        20
                        ? "BATTERY_LOW"
                        : "NORMAL"
                    : "UNKNOWN";

            const updatedSupervisor = {
                user: {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    siteId: data.user.siteId,
                },

                site: null,

                location: liveLocation,

                trackingStatus: "ONLINE",

                batteryStatus,
            };

            setFieldForce((current) => {
                const existingIndex =
                    current.findIndex(
                        (item) =>
                            item?.user?.id ===
                            data.user.id
                    );

                if (existingIndex === -1) {
                    return [
                        ...current,
                        updatedSupervisor,
                    ];
                }

                const updated = [
                    ...current,
                ];

                updated[
                    existingIndex
                ] = {
                    ...updated[
                    existingIndex
                    ],

                    ...updatedSupervisor,

                    site:
                        updated[
                            existingIndex
                        ]?.site || null,
                };

                return updated;
            });
        };

        window.addEventListener(
            "field-location-updated",
            handleLiveLocation
        );

        return () => {
            clearInterval(
                refreshInterval
            );

            window.removeEventListener(
                "field-location-updated",
                handleLiveLocation
            );
        };
    }, []);

    const onlineCount = useMemo(() => {
        return fieldForce.filter(
            (person) =>
                person.trackingStatus ===
                "ONLINE"
        ).length;
    }, [fieldForce]);

    const offlineCount = useMemo(() => {
        return fieldForce.filter(
            (person) =>
                person.trackingStatus ===
                "OFFLINE"
        ).length;
    }, [fieldForce]);

    const batteryLowCount = useMemo(() => {
        return fieldForce.filter(
            (person) =>
                person.batteryStatus ===
                "BATTERY_LOW"
        ).length;
    }, [fieldForce]);

    /*
     * Only people with valid GPS coordinates
     * can appear on the map.
     */
    const supervisorsWithLocation =
        useMemo(() => {
            return fieldForce.filter(
                (person) => {
                    const latitude =
                        Number(
                            person?.location
                                ?.latitude
                        );

                    const longitude =
                        Number(
                            person?.location
                                ?.longitude
                        );

                    return (
                        Number.isFinite(
                            latitude
                        ) &&
                        Number.isFinite(
                            longitude
                        )
                    );
                }
            );
        }, [fieldForce]);

    /*
     * Apply selected map filter.
     */
    const filteredSupervisors =
        useMemo(() => {
            switch (activeFilter) {
                case "ONLINE":
                    return supervisorsWithLocation.filter(
                        (person) =>
                            person.trackingStatus ===
                            "ONLINE"
                    );

                case "OFFLINE":
                    return supervisorsWithLocation.filter(
                        (person) =>
                            person.trackingStatus ===
                            "OFFLINE"
                    );

                case "BATTERY_LOW":
                    return supervisorsWithLocation.filter(
                        (person) =>
                            person.batteryStatus ===
                            "BATTERY_LOW"
                    );

                case "ALL":
                default:
                    return supervisorsWithLocation;
            }
        }, [
            supervisorsWithLocation,
            activeFilter,
        ]);

    /*
     * Location button.
     *
     * Incrementing fitTrigger forces MapAutoFit
     * to fit all currently filtered locations.
     */
    const handleShowAllLocations = () => {
        if (
            filteredSupervisors.length ===
            0
        ) {
            return;
        }

        setFitTrigger(
            (current) => current + 1
        );
    };

    /*
     * Filter selection.
     */
    const handleFilterChange = (
        filter
    ) => {
        setActiveFilter(filter);

        /*
         * Close filter panel after selection.
         */
        setFilterOpen(false);

        /*
         * Refit map using the newly selected
         * filter after React updates.
         */
        setFitTrigger(
            (current) => current + 1
        );
    };

    const summaryCards = [
        {
            title: "Online",
            value: onlineCount,
            type: "online",
            icon: Smartphone,
        },

        {
            title: "Offline",
            value: offlineCount,
            type: "offline",
            icon: WifiOff,
        },

        {
            title: "Battery Low",
            value: batteryLowCount,
            type: "battery",
            icon: BatteryLow,
        },

        {
            title: "Not Checked-In",
            value: notCheckedInCount,
            type: "not-checked",
            icon: LogIn,
        },
    ];

    const defaultCenter = [
        31.634,
        74.8723,
    ];

    return (
        <div className="track-field-force-page">

            <section className="track-content-card">

                {/* =========================
                    TOP ACTION BAR
                ========================= */}

                <div className="track-toolbar">

                    <div className="track-toolbar-line" />

                    <div
                        className="track-actions"
                        style={{
                            position:
                                "relative",
                        }}
                    >

                        {/* LOCATION BUTTON */}
                        <button
                            type="button"
                            className="track-action-button"
                            title="Show all Supervisor locations"
                            onClick={
                                handleShowAllLocations
                            }
                            disabled={
                                filteredSupervisors.length ===
                                0
                            }
                            style={{
                                opacity:
                                    filteredSupervisors.length ===
                                        0
                                        ? 0.5
                                        : 1,
                                cursor:
                                    filteredSupervisors.length ===
                                        0
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            <MapPin size={20} />
                        </button>

                        {/* FILTER BUTTON */}
                        <button
                            type="button"
                            className="track-action-button"
                            title="Field force filters"
                            onClick={() =>
                                setFilterOpen(
                                    (current) =>
                                        !current
                                )
                            }
                        >
                            {filterOpen ? (
                                <X size={20} />
                            ) : (
                                <Filter size={20} />
                            )}
                        </button>

                        {/* FILTER PANEL */}
                        {filterOpen && (
                            <div
                                style={{
                                    position:
                                        "absolute",

                                    top: "48px",

                                    right: "0",

                                    zIndex: 2000,

                                    minWidth:
                                        "190px",

                                    padding:
                                        "10px",

                                    background:
                                        "#ffffff",

                                    border:
                                        "1px solid #e5e7eb",

                                    borderRadius:
                                        "10px",

                                    boxShadow:
                                        "0 8px 24px rgba(0,0,0,0.12)",
                                }}
                            >

                                <div
                                    style={{
                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            700,

                                        color:
                                            "#6b7280",

                                        marginBottom:
                                            "8px",

                                        textTransform:
                                            "uppercase",
                                    }}
                                >
                                    Filter
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFilterChange(
                                            "ALL"
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        border:
                                            "none",

                                        background:
                                            activeFilter ===
                                                "ALL"
                                                ? "#f3f4f6"
                                                : "transparent",

                                        padding:
                                            "9px 10px",

                                        textAlign:
                                            "left",

                                        borderRadius:
                                            "6px",

                                        cursor:
                                            "pointer",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            activeFilter ===
                                                "ALL"
                                                ? 700
                                                : 500,
                                    }}
                                >
                                    All
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFilterChange(
                                            "ONLINE"
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        border:
                                            "none",

                                        background:
                                            activeFilter ===
                                                "ONLINE"
                                                ? "#f3f4f6"
                                                : "transparent",

                                        padding:
                                            "9px 10px",

                                        textAlign:
                                            "left",

                                        borderRadius:
                                            "6px",

                                        cursor:
                                            "pointer",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            activeFilter ===
                                                "ONLINE"
                                                ? 700
                                                : 500,
                                    }}
                                >
                                    Online
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFilterChange(
                                            "OFFLINE"
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        border:
                                            "none",

                                        background:
                                            activeFilter ===
                                                "OFFLINE"
                                                ? "#f3f4f6"
                                                : "transparent",

                                        padding:
                                            "9px 10px",

                                        textAlign:
                                            "left",

                                        borderRadius:
                                            "6px",

                                        cursor:
                                            "pointer",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            activeFilter ===
                                                "OFFLINE"
                                                ? 700
                                                : 500,
                                    }}
                                >
                                    Offline
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFilterChange(
                                            "BATTERY_LOW"
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        border:
                                            "none",

                                        background:
                                            activeFilter ===
                                                "BATTERY_LOW"
                                                ? "#f3f4f6"
                                                : "transparent",

                                        padding:
                                            "9px 10px",

                                        textAlign:
                                            "left",

                                        borderRadius:
                                            "6px",

                                        cursor:
                                            "pointer",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            activeFilter ===
                                                "BATTERY_LOW"
                                                ? 700
                                                : 500,
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
                            padding:
                                "8px 20px 0",

                            fontSize:
                                "13px",

                            color:
                                "#6b7280",
                        }}
                    >
                        Showing:{" "}
                        <strong>
                            {activeFilter ===
                                "BATTERY_LOW"
                                ? "Battery Low"
                                : activeFilter}
                        </strong>{" "}
                        ({filteredSupervisors.length})
                    </div>
                )}

                {/* =========================
                    SUMMARY CARDS
                ========================= */}

                <div className="track-summary">

                    {summaryCards.map(
                        (card) => {
                            const Icon =
                                card.icon;

                            return (
                                <div
                                    key={
                                        card.title
                                    }
                                    className={`track-summary-card track-summary-${card.type}`}
                                >
                                    <div className="track-summary-content">

                                        <span className="track-summary-title">
                                            {
                                                card.title
                                            }
                                        </span>

                                        <span className="track-summary-value">
                                            {
                                                card.value
                                            }
                                        </span>

                                    </div>

                                    <div className="track-summary-icon">

                                        <Icon
                                            size={
                                                22
                                            }
                                        />

                                    </div>
                                </div>
                            );
                        }
                    )}

                </div>

                {/* =========================
                    ERROR
                ========================= */}

                {error && (
                    <div
                        style={{
                            padding:
                                "15px 20px",

                            color:
                                "#dc2626",

                            fontSize:
                                "14px",
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
                        center={
                            defaultCenter
                        }
                        zoom={11}
                        scrollWheelZoom={
                            true
                        }
                        zoomControl={
                            false
                        }
                        className="leaflet-map"
                    >

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <ZoomControl
                            position="topleft"
                        />

                        <MapAutoFit
                            supervisors={
                                filteredSupervisors
                            }
                            fitTrigger={
                                fitTrigger
                            }
                        />

                        {filteredSupervisors.map(
                            (person) => (
                                <Marker
                                    key={
                                        person
                                            .user
                                            .id
                                    }
                                    position={[
                                        Number(
                                            person
                                                .location
                                                .latitude
                                        ),

                                        Number(
                                            person
                                                .location
                                                .longitude
                                        ),
                                    ]}
                                    icon={
                                        markerIcon
                                    }
                                >

                                    <Popup>

                                        <div className="field-force-popup">

                                            <strong>
                                                {
                                                    person
                                                        .user
                                                        .name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    person
                                                        .user
                                                        ?.role ||
                                                    "SUPERVISOR"
                                                }
                                            </span>

                                            {person.site && (
                                                <span>
                                                    Site:{" "}
                                                    {
                                                        person
                                                            .site
                                                            .name
                                                    }
                                                </span>
                                            )}

                                            <span>
                                                Battery:{" "}
                                                {person
                                                    .location
                                                    .batteryLevel !==
                                                    null &&
                                                    person
                                                        .location
                                                        .batteryLevel !==
                                                    undefined
                                                    ? `${person.location.batteryLevel}%`
                                                    : "N/A"}
                                            </span>

                                            <span>
                                                Status:{" "}
                                                {
                                                    person.trackingStatus
                                                }
                                            </span>

                                            <span>
                                                Latitude:{" "}
                                                {
                                                    person
                                                        .location
                                                        .latitude
                                                }
                                            </span>

                                            <span>
                                                Longitude:{" "}
                                                {
                                                    person
                                                        .location
                                                        .longitude
                                                }
                                            </span>

                                        </div>

                                    </Popup>

                                </Marker>
                            )
                        )}

                    </MapContainer>

                    {loading &&
                        fieldForce.length ===
                        0 && (
                            <div
                                style={{
                                    position:
                                        "absolute",

                                    top: "15px",

                                    right: "15px",

                                    zIndex: 1000,

                                    padding:
                                        "10px 14px",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "rgba(17, 24, 39, 0.9)",

                                    color:
                                        "#ffffff",

                                    fontSize:
                                        "13px",
                                }}
                            >
                                Loading supervisors...
                            </div>
                        )}

                    {!loading &&
                        filteredSupervisors.length ===
                        0 && (
                            <div
                                style={{
                                    position:
                                        "absolute",

                                    top: "15px",

                                    right: "15px",

                                    zIndex: 1000,

                                    padding:
                                        "10px 14px",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "rgba(17, 24, 39, 0.9)",

                                    color:
                                        "#ffffff",

                                    fontSize:
                                        "13px",
                                }}
                            >
                                {activeFilter ===
                                    "ALL"
                                    ? "No Supervisor GPS location available."
                                    : `No ${activeFilter === "BATTERY_LOW"
                                        ? "Battery Low"
                                        : activeFilter.toLowerCase()
                                    } Supervisor location available.`}
                            </div>
                        )}

                </div>

            </section>

        </div>
    );
};

export default TrackFieldForce;
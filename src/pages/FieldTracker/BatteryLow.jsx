import { useEffect, useMemo, useState } from "react";

import {
    Smartphone,
    WifiOff,
    BatteryLow,
    LogIn,
    Map,
    User,
    Users,
    Phone,
    Battery,
    Clock,
    FileSpreadsheet,
    FileText,
    Printer,
} from "lucide-react";

import { Link } from "react-router-dom";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./BatteryLow.css";

const BATTERY_LOW_THRESHOLD = 20;

const BatteryLowPage = () => {
    const [fieldForce, setFieldForce] = useState([]);
    const [notCheckedInCount, setNotCheckedInCount] =
        useState(0);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // TRACKING STATUS
    // =========================================================

    const calculateTrackingStatus = (
        recordedAt
    ) => {
        if (!recordedAt) {
            return "NO_GPS";
        }

        const age =
            Date.now() -
            new Date(recordedAt).getTime();

        return age <=
            5 * 60 * 1000
            ? "ONLINE"
            : "OFFLINE";
    };

    // =========================================================
    // BATTERY STATUS
    // =========================================================

    const calculateBatteryStatus = (
        batteryLevel
    ) => {
        if (
            batteryLevel === null ||
            batteryLevel === undefined
        ) {
            return "UNKNOWN";
        }

        return batteryLevel <=
            BATTERY_LOW_THRESHOLD
            ? "BATTERY_LOW"
            : "NORMAL";
    };

    // =========================================================
    // FETCH DATA
    // =========================================================

    const fetchData = async () => {
        try {
            setError("");

            const [
                locationResponse,
                notCheckedInResponse,
            ] = await Promise.all([
                apiFetch(
                    "/api/location/latest",
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

            const locationData =
                await locationResponse.json();

            const notCheckedInData =
                await notCheckedInResponse.json();

            if (!locationResponse.ok) {
                throw new Error(
                    locationData?.message ||
                    "Failed to fetch supervisor locations"
                );
            }

            if (!notCheckedInResponse.ok) {
                throw new Error(
                    notCheckedInData?.message ||
                    "Failed to fetch not checked-in supervisors"
                );
            }

            const locations =
                locationData?.data?.locations ||
                [];

            const notCheckedIn =
                notCheckedInData?.data
                    ?.notCheckedIn || [];

            setFieldForce(
                locations
            );

            setNotCheckedInCount(
                notCheckedIn.length
            );
        } catch (error) {
            console.error(
                "Failed to fetch Battery Low data:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch Battery Low data"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD + REFRESH + LIVE LOCATION
    // =========================================================

    useEffect(() => {
        fetchData();

        const refreshInterval =
            setInterval(() => {
                fetchData();
            }, 60000);

        const handleLiveLocation = (
            event
        ) => {
            const data =
                event.detail;

            if (
                !data?.user?.id ||
                !data?.location
            ) {
                return;
            }

            const location =
                data.location;

            const updatedSupervisor = {
                user: {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    siteId: data.user.siteId,
                },

                location,

                trackingStatus:
                    calculateTrackingStatus(
                        location.recordedAt
                    ),

                batteryStatus:
                    calculateBatteryStatus(
                        location.batteryLevel
                    ),
            };

            setFieldForce(
                (current) => {
                    const existingIndex =
                        current.findIndex(
                            (item) =>
                                item?.user?.id ===
                                data.user.id
                        );

                    if (
                        existingIndex === -1
                    ) {
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
                    ] =
                        updatedSupervisor;

                    return updated;
                }
            );
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

    // =========================================================
    // BATTERY LOW DATA
    // =========================================================

    const batteryLowData =
        useMemo(() => {
            return fieldForce.filter(
                (person) =>
                    person.batteryStatus ===
                    "BATTERY_LOW"
            );
        }, [fieldForce]);

    // =========================================================
    // FILTER / SEARCH
    // =========================================================

    const filteredBatteryLowData =
        useMemo(() => {
            const searchText =
                search
                    .trim()
                    .toLowerCase();

            if (!searchText) {
                return batteryLowData;
            }

            return batteryLowData.filter(
                (person) => {
                    const name =
                        person.user?.name?.toLowerCase() ||
                        "";

                    const email =
                        person.user?.email?.toLowerCase() ||
                        "";

                    const role =
                        person.user?.role?.toLowerCase() ||
                        "";

                    return (
                        name.includes(
                            searchText
                        ) ||
                        email.includes(
                            searchText
                        ) ||
                        role.includes(
                            searchText
                        )
                    );
                }
            );
        }, [
            batteryLowData,
            search,
        ]);

    // =========================================================
    // SUMMARY COUNTS
    // =========================================================

    const onlineCount =
        fieldForce.filter(
            (person) =>
                person.trackingStatus ===
                "ONLINE"
        ).length;

    const offlineCount =
        fieldForce.filter(
            (person) =>
                person.trackingStatus ===
                "OFFLINE"
        ).length;

    const batteryLowCount =
        batteryLowData.length;

    // =========================================================
    // FORMAT LAST SEEN
    // =========================================================

    const formatLastSeen = (
        recordedAt
    ) => {
        if (!recordedAt) {
            return "No location";
        }

        return new Date(
            recordedAt
        ).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // =========================================================
    // OPEN GOOGLE MAP
    // =========================================================

    const openMap = (
        person
    ) => {
        const latitude =
            person.location?.latitude;

        const longitude =
            person.location?.longitude;

        if (
            latitude === undefined ||
            longitude === undefined
        ) {
            return;
        }

        window.open(
            `https://www.google.com/maps?q=${latitude},${longitude}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    // =========================================================
    // EXPORT DATA
    // =========================================================

    const getExportRows = () => {
        return filteredBatteryLowData.map(
            (person) => ({
                Name:
                    person.user?.name ||
                    "—",

                Role:
                    "SUPERVISOR",

                Contact:
                    person.user?.email ||
                    "—",

                Battery:
                    person.location
                        ?.batteryLevel !==
                        null &&
                        person.location
                            ?.batteryLevel !==
                        undefined
                        ? `${person.location.batteryLevel}%`
                        : "N/A",

                "Last Seen":
                    formatLastSeen(
                        person.location
                            ?.recordedAt
                    ),
            })
        );
    };

    // =========================================================
    // EXCEL
    // =========================================================

    const exportExcel = () => {
        try {
            const rows =
                getExportRows();

            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Battery Low"
            );

            XLSX.writeFile(
                workbook,
                "battery-low-field-force.xlsx"
            );
        } catch (error) {
            console.error(
                "Excel export failed:",
                error
            );

            setError(
                "Failed to export Excel file."
            );
        }
    };

    // =========================================================
    // ESCAPE HTML
    // =========================================================

    const escapeHtml = (
        value
    ) => {
        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    };

    // =========================================================
    // PRINT / PDF
    // =========================================================

    const openPrintWindow =
        () => {
            const rows =
                getExportRows();

            const tableRows =
                rows.length > 0
                    ? rows
                        .map(
                            (row) => `
                                <tr>
                                    <td>${escapeHtml(
                                row.Name
                            )}</td>
                                    <td>${escapeHtml(
                                row.Role
                            )}</td>
                                    <td>${escapeHtml(
                                row.Contact
                            )}</td>
                                    <td>${escapeHtml(
                                row.Battery
                            )}</td>
                                    <td>${escapeHtml(
                                row["Last Seen"]
                            )}</td>
                                </tr>
                            `
                        )
                        .join("")
                    : `
                        <tr>
                            <td colspan="5">
                                No battery low supervisors found.
                            </td>
                        </tr>
                    `;

            const printWindow =
                window.open(
                    "",
                    "_blank",
                    "width=1100,height=800"
                );

            if (!printWindow) {
                setError(
                    "Please allow pop-ups to print or save as PDF."
                );

                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>
                            Battery Low Field Force
                        </title>

                        <style>
                            * {
                                box-sizing: border-box;
                            }

                            body {
                                font-family:
                                    Arial,
                                    sans-serif;
                                padding: 30px;
                                color: #111827;
                            }

                            h1 {
                                margin: 0 0 8px;
                                font-size: 24px;
                            }

                            p {
                                margin: 0 0 20px;
                                color: #6b7280;
                                font-size: 14px;
                            }

                            table {
                                width: 100%;
                                border-collapse:
                                    collapse;
                            }

                            th,
                            td {
                                border: 1px solid
                                    #d1d5db;
                                padding: 10px;
                                text-align:
                                    left;
                                font-size: 13px;
                            }

                            th {
                                background:
                                    #f3f4f6;
                                font-weight: 600;
                            }

                            @media print {
                                body {
                                    padding: 10px;
                                }

                                @page {
                                    margin: 15mm;
                                }
                            }
                        </style>
                    </head>

                    <body>
                        <h1>
                            Battery Low Field Force
                        </h1>

                        <p>
                            Generated:
                            ${escapeHtml(
                new Date()
                    .toLocaleString(
                        "en-IN"
                    )
            )}
                        </p>

                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Contact</th>
                                    <th>Battery</th>
                                    <th>Last Seen</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
            }, 300);
        };

    const handlePdf = () => {
        openPrintWindow();
    };

    const handlePrint = () => {
        openPrintWindow();
    };

    // =========================================================
    // SUMMARY CARDS
    // =========================================================

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

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="battery-low-page">

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="battery-low-summary">

                {summaryCards.map(
                    (card) => {
                        const Icon =
                            card.icon;

                        return (
                            <Link
                                key={
                                    card.title
                                }
                                to={
                                    card.path
                                }
                                className={`battery-low-card-link ${card.type ===
                                        "battery"
                                        ? "card-current"
                                        : ""
                                    }`}
                            >
                                <div
                                    className={`battery-low-summary-card battery-low-summary-${card.type}`}
                                >
                                    <div className="battery-low-card-content">

                                        <span className="battery-low-card-title">
                                            {
                                                card.title
                                            }
                                        </span>

                                        <span className="battery-low-card-value">
                                            {
                                                card.value
                                            }
                                        </span>

                                    </div>

                                    <div className="battery-low-card-icon">
                                        <Icon
                                            size={
                                                22
                                            }
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    }
                )}

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <section className="battery-low-table-card">

                <div className="battery-low-toolbar">

                    <div className="battery-low-search">

                        <label htmlFor="battery-low-search">
                            Search:
                        </label>

                        <input
                            id="battery-low-search"
                            type="text"
                            value={
                                search
                            }
                            onChange={(
                                e
                            ) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search supervisors..."
                        />

                    </div>

                    <div className="battery-low-export-actions">

                        <button
                            type="button"
                            onClick={
                                exportExcel
                            }
                            disabled={
                                loading
                            }
                            title="Export to Excel"
                        >
                            <FileSpreadsheet
                                size={
                                    16
                                }
                            />

                            EXCEL
                        </button>

                        <button
                            type="button"
                            onClick={
                                handlePdf
                            }
                            disabled={
                                loading
                            }
                            title="Save as PDF"
                        >
                            <FileText
                                size={
                                    16
                                }
                            />

                            PDF
                        </button>

                        <button
                            type="button"
                            onClick={
                                handlePrint
                            }
                            disabled={
                                loading
                            }
                            title="Print"
                        >
                            <Printer
                                size={
                                    16
                                }
                            />

                            PRINT
                        </button>

                    </div>

                </div>

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
                        {
                            error
                        }
                    </div>
                )}

                <div className="battery-low-table-wrapper">

                    <table className="battery-low-table">

                        <thead>

                            <tr>

                                <th>
                                    <span>
                                        <Map
                                            size={
                                                17
                                            }
                                        />
                                        Map
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <User
                                            size={
                                                16
                                            }
                                        />
                                        Name
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Users
                                            size={
                                                17
                                            }
                                        />
                                        Role
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Phone
                                            size={
                                                16
                                            }
                                        />
                                        Contact
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Battery
                                            size={
                                                17
                                            }
                                        />
                                        Battery
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Clock
                                            size={
                                                16
                                            }
                                        />
                                        Last Seen
                                    </span>
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="battery-low-empty"
                                    >
                                        Loading
                                        supervisors...
                                    </td>

                                </tr>

                            ) : filteredBatteryLowData.length > 0 ? (

                                filteredBatteryLowData.map(
                                    (
                                        person
                                    ) => (

                                        <tr
                                            key={
                                                person
                                                    .user
                                                    .id
                                            }
                                        >

                                            <td>

                                                <button
                                                    type="button"
                                                    className="battery-low-map-button"
                                                    title={
                                                        person
                                                            .location
                                                            ?.latitude !==
                                                            undefined &&
                                                            person
                                                                .location
                                                                ?.longitude !==
                                                            undefined
                                                            ? "View supervisor on map"
                                                            : "No location available"
                                                    }
                                                    onClick={() =>
                                                        openMap(
                                                            person
                                                        )
                                                    }
                                                    disabled={
                                                        person
                                                            .location
                                                            ?.latitude ===
                                                        undefined ||
                                                        person
                                                            .location
                                                            ?.longitude ===
                                                        undefined
                                                    }
                                                >

                                                    <Map
                                                        size={
                                                            18
                                                        }
                                                    />

                                                </button>

                                            </td>

                                            <td>
                                                {
                                                    person
                                                        .user
                                                        .name
                                                }
                                            </td>

                                            <td>
                                                SUPERVISOR
                                            </td>

                                            <td>
                                                {
                                                    person
                                                        .user
                                                        .email
                                                }
                                            </td>

                                            <td>

                                                {person
                                                    .location
                                                    ?.batteryLevel !==
                                                    null &&
                                                    person
                                                        .location
                                                        ?.batteryLevel !==
                                                    undefined
                                                    ? `${person.location.batteryLevel}%`
                                                    : "N/A"}

                                            </td>

                                            <td>
                                                {formatLastSeen(
                                                    person
                                                        .location
                                                        ?.recordedAt
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="battery-low-empty"
                                    >
                                        No battery low
                                        supervisors found.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                <div className="battery-low-table-footer">

                    <span>
                        Showing{" "}
                        {filteredBatteryLowData.length >
                            0
                            ? 1
                            : 0}{" "}
                        to{" "}
                        {
                            filteredBatteryLowData.length
                        }{" "}
                        of{" "}
                        {
                            filteredBatteryLowData.length
                        }{" "}
                        entries
                    </span>

                    <div className="battery-low-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="battery-low-pagination-active"
                        >
                            1
                        </button>

                        <button
                            type="button"
                            disabled
                        >
                            Next
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default BatteryLowPage;
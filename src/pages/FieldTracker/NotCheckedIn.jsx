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

import { Link, useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./NotCheckedIn.css";

const NotCheckedIn = () => {
    const navigate = useNavigate();
    const [notCheckedInData, setNotCheckedInData] = useState([]);
    const [latestLocations, setLatestLocations] = useState([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                notCheckedInResponse,
                latestLocationsResponse,
            ] = await Promise.all([
                apiFetch("/api/location/not-checked-in", {
                    method: "GET",
                }),

                apiFetch("/api/location/latest", {
                    method: "GET",
                }),
            ]);

            const notCheckedInResult =
                await notCheckedInResponse.json();

            const latestLocationsResult =
                await latestLocationsResponse.json();

            if (!notCheckedInResponse.ok) {
                throw new Error(
                    notCheckedInResult?.message ||
                    "Failed to fetch not checked-in supervisors"
                );
            }

            if (!latestLocationsResponse.ok) {
                throw new Error(
                    latestLocationsResult?.message ||
                    "Failed to fetch supervisor locations"
                );
            }

            setNotCheckedInData(
                notCheckedInResult?.data?.notCheckedIn || []
            );

            setLatestLocations(
                latestLocationsResult?.data?.locations || []
            );
        } catch (error) {
            console.error(
                "Failed to fetch not checked-in data:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch not checked-in data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const refreshInterval = setInterval(() => {
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

            const updatedLocation = {
                user: {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    siteId: data.user.siteId,
                },

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

            setLatestLocations((current) => {
                const existingIndex = current.findIndex(
                    (item) =>
                        item?.user?.id === data.user.id
                );

                if (existingIndex === -1) {
                    return [...current, updatedLocation];
                }

                const updated = [...current];

                updated[existingIndex] = updatedLocation;

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

    /*
     * Merge latest location information
     * with not checked-in supervisors.
     */
    const enrichedData = useMemo(() => {
        return notCheckedInData.map((item) => {
            const locationData = latestLocations.find(
                (locationItem) =>
                    locationItem?.user?.id ===
                    item?.user?.id
            );

            return {
                ...item,

                location:
                    locationData?.location || null,

                batteryLevel:
                    locationData?.location
                        ?.batteryLevel ?? null,

                lastSeen:
                    locationData?.location
                        ?.recordedAt || null,
            };
        });
    }, [notCheckedInData, latestLocations]);

    const filteredData = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        if (!searchText) {
            return enrichedData;
        }

        return enrichedData.filter((person) => {
            const name =
                person.user?.name?.toLowerCase() || "";

            const email =
                person.user?.email?.toLowerCase() || "";

            const role =
                person.user?.role?.toLowerCase() || "";

            return (
                name.includes(searchText) ||
                email.includes(searchText) ||
                role.includes(searchText)
            );
        });
    }, [enrichedData, search]);

    const onlineCount = latestLocations.filter(
        (person) =>
            person.trackingStatus === "ONLINE"
    ).length;

    const offlineCount = latestLocations.filter(
        (person) =>
            person.trackingStatus === "OFFLINE"
    ).length;

    const batteryLowCount = latestLocations.filter(
        (person) =>
            person.batteryStatus === "BATTERY_LOW"
    ).length;

    const notCheckedInCount =
        notCheckedInData.length;

    const formatLastSeen = (recordedAt) => {
        if (!recordedAt) {
            return "No location";
        }

        return new Date(recordedAt).toLocaleString(
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

    const openMap = (person) => {
        const userId = person?.user?.id || person?.user?.userId || person?.id;
        if (!userId) {
            return;
        }
        const today = new Date().toISOString().split("T")[0];
        navigate(`/distance-report?userId=${userId}&date=${today}`);
    };

    /*
     * EXCEL EXPORT
     */
    const exportExcel = () => {
        try {
            const headers = [
                "Name",
                "Role",
                "Contact",
                "Battery",
                "Last Seen",
                "Latitude",
                "Longitude",
            ];

            const rows = filteredData.map((person) => [
                person.user?.name || "N/A",

                person.user?.role || "SUPERVISOR",

                person.user?.email || "N/A",

                person.batteryLevel !== null &&
                    person.batteryLevel !== undefined
                    ? `${person.batteryLevel}%`
                    : "N/A",

                formatLastSeen(person.lastSeen),

                person.location?.latitude ?? "N/A",

                person.location?.longitude ?? "N/A",
            ]);

            /*
             * Export even when there is no data.
             * The Excel file will contain the headers.
             */
            const worksheet = XLSX.utils.aoa_to_sheet([
                headers,
                ...rows,
            ]);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Not Checked-In"
            );

            XLSX.writeFile(
                workbook,
                "not-checked-in-field-force.xlsx"
            );
        } catch (error) {
            console.error(
                "Excel export failed:",
                error
            );

            alert(
                "Failed to export Excel file."
            );
        }
    };

    /*
     * HTML ESCAPE HELPER
     * Used to safely generate the print/PDF page.
     */
    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /*
     * PRINT / PDF
     *
     * PDF uses browser print dialog.
     * Choose "Save as PDF".
     */
    const printData = () => {
        try {
            const printWindow = window.open(
                "",
                "_blank",
                "width=1200,height=800"
            );

            if (!printWindow) {
                alert(
                    "Please allow pop-ups for this website."
                );
                return;
            }

            const tableRows =
                filteredData.length > 0
                    ? filteredData
                        .map((person) => {
                            const name =
                                person.user?.name ||
                                "N/A";

                            const role =
                                person.user?.role ||
                                "SUPERVISOR";

                            const contact =
                                person.user?.email ||
                                "N/A";

                            const battery =
                                person.batteryLevel !==
                                    null &&
                                    person.batteryLevel !==
                                    undefined
                                    ? `${person.batteryLevel}%`
                                    : "N/A";

                            const lastSeen =
                                formatLastSeen(
                                    person.lastSeen
                                );

                            const latitude =
                                person.location
                                    ?.latitude;

                            const longitude =
                                person.location
                                    ?.longitude;

                            const mapLink =
                                latitude !==
                                    undefined &&
                                    latitude !== null &&
                                    longitude !==
                                    undefined &&
                                    longitude !== null
                                    ? `https://www.google.com/maps?q=${latitude},${longitude}`
                                    : null;

                            return `
                            <tr>
                                <td>
                                    ${mapLink
                                    ? `<a href="${escapeHtml(
                                        mapLink
                                    )}" target="_blank">
                                                View Map
                                               </a>`
                                    : "No location"
                                }
                                </td>

                                <td>
                                    ${escapeHtml(name)}
                                </td>

                                <td>
                                    ${escapeHtml(role)}
                                </td>

                                <td>
                                    ${escapeHtml(contact)}
                                </td>

                                <td>
                                    ${escapeHtml(battery)}
                                </td>

                                <td>
                                    ${escapeHtml(lastSeen)}
                                </td>
                            </tr>
                        `;
                        })
                        .join("")
                    : `
                    <tr>
                        <td
                            colspan="6"
                            style="
                                text-align:center;
                                padding:30px;
                                color:#6b7280;
                            "
                        >
                            No supervisors found
                            who have not checked in today.
                        </td>
                    </tr>
                `;

            printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>
                        Not Checked-In Field Force
                    </title>

                    <meta charset="UTF-8" />

                    <style>
                        * {
                            box-sizing: border-box;
                        }

                        body {
                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;

                            margin: 30px;
                            color: #111827;
                            background: #ffffff;
                        }

                        h1 {
                            margin: 0 0 8px;
                            font-size: 24px;
                        }

                        .subtitle {
                            margin-bottom: 22px;
                            font-size: 14px;
                            color: #6b7280;
                        }

                        .summary {
                            display: grid;
                            grid-template-columns:
                                repeat(4, 1fr);

                            gap: 12px;
                            margin-bottom: 24px;
                        }

                        .summary-box {
                            border: 1px solid #d1d5db;
                            padding: 14px;
                            border-radius: 8px;
                        }

                        .summary-title {
                            font-size: 12px;
                            color: #6b7280;
                            margin-bottom: 6px;
                        }

                        .summary-value {
                            font-size: 22px;
                            font-weight: 700;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }

                        th,
                        td {
                            border: 1px solid #d1d5db;
                            padding: 10px;
                            font-size: 13px;
                            text-align: left;
                        }

                        th {
                            background: #f3f4f6;
                            font-weight: 700;
                        }

                        a {
                            color: #2563eb;
                            text-decoration: none;
                        }

                        .footer {
                            margin-top: 20px;
                            font-size: 12px;
                            color: #6b7280;
                        }

                        @media print {
                            body {
                                margin: 15px;
                            }
                        }
                    </style>
                </head>

                <body>
                    <h1>
                        Not Checked-In Field Force
                    </h1>

                    <div class="subtitle">
                        Generated on
                        ${escapeHtml(
                new Date().toLocaleString(
                    "en-IN"
                )
            )}
                    </div>

                    <div class="summary">
                        <div class="summary-box">
                            <div class="summary-title">
                                Online
                            </div>

                            <div class="summary-value">
                                ${onlineCount}
                            </div>
                        </div>

                        <div class="summary-box">
                            <div class="summary-title">
                                Offline
                            </div>

                            <div class="summary-value">
                                ${offlineCount}
                            </div>
                        </div>

                        <div class="summary-box">
                            <div class="summary-title">
                                Battery Low
                            </div>

                            <div class="summary-value">
                                ${batteryLowCount}
                            </div>
                        </div>

                        <div class="summary-box">
                            <div class="summary-title">
                                Not Checked-In
                            </div>

                            <div class="summary-value">
                                ${notCheckedInCount}
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Map</th>
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

                    <div class="footer">
                        Total entries:
                        ${filteredData.length}
                    </div>
                </body>
            </html>
        `);

            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error(
                "Print/PDF export failed:",
                error
            );

            alert(
                "Failed to generate print/PDF view."
            );
        }
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

    return (
        <div className="not-checked-in-page">

            {/* =========================
                SUMMARY CARDS
            ========================= */}

            <div className="not-checked-in-summary">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.title}
                            to={card.path}
                            className={`not-checked-in-card-link ${card.type ===
                                    "not-checked"
                                    ? "card-current"
                                    : ""
                                }`}
                        >
                            <div
                                className={`not-checked-in-summary-card not-checked-in-summary-${card.type}`}
                            >
                                <div className="not-checked-in-card-content">
                                    <span className="not-checked-in-card-title">
                                        {card.title}
                                    </span>

                                    <span className="not-checked-in-card-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="not-checked-in-card-icon">
                                    <Icon size={22} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* =========================
                TABLE
            ========================= */}

            <section className="not-checked-in-table-card">

                <div className="not-checked-in-toolbar">

                    <div className="not-checked-in-search">
                        <label htmlFor="not-checked-in-search">
                            Search:
                        </label>

                        <input
                            id="not-checked-in-search"
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search supervisors..."
                        />
                    </div>

                    <div className="not-checked-in-export-actions">

                        <button
                            type="button"
                            onClick={exportExcel}
                            title="Export to Excel"
                        >
                            <FileSpreadsheet size={16} />
                            EXCEL
                        </button>

                        <button
                            type="button"
                            onClick={printData}
                            title="Save as PDF"
                        >
                            <FileText size={16} />
                            PDF
                        </button>

                        <button
                            type="button"
                            onClick={printData}
                            title="Print"
                        >
                            <Printer size={16} />
                            PRINT
                        </button>

                    </div>

                </div>

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

                <div className="not-checked-in-table-wrapper">

                    <table className="not-checked-in-table">

                        <thead>
                            <tr>

                                <th>
                                    <span>
                                        <Map size={17} />
                                        Map
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <User size={16} />
                                        Name
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Users size={17} />
                                        Role
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Phone size={16} />
                                        Contact
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Battery size={17} />
                                        Battery
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Clock size={16} />
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
                                        className="not-checked-in-empty"
                                    >
                                        Loading supervisors...
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map(
                                    (person) => (
                                        <tr
                                            key={
                                                person.user.id
                                            }
                                        >

                                            <td>
                                                <button
                                                    type="button"
                                                    className="not-checked-in-map-button"
                                                    title={person.user?.id ? "View supervisor daily route & map" : "No supervisor available"}
                                                    onClick={() => openMap(person)}
                                                    disabled={!person.user?.id}
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
                                                {
                                                    person
                                                        .user
                                                        ?.role ||
                                                    "SUPERVISOR"
                                                }
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
                                                    .batteryLevel !==
                                                    null &&
                                                    person
                                                        .batteryLevel !==
                                                    undefined
                                                    ? `${person.batteryLevel}%`
                                                    : "N/A"}
                                            </td>

                                            <td>
                                                {formatLastSeen(
                                                    person.lastSeen
                                                )}
                                            </td>

                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="not-checked-in-empty"
                                    >
                                        No supervisors found
                                        who have not checked
                                        in today.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                <div className="not-checked-in-table-footer">

                    <span>
                        Showing{" "}
                        {filteredData.length > 0
                            ? 1
                            : 0}{" "}
                        to{" "}
                        {filteredData.length}{" "}
                        of{" "}
                        {filteredData.length}{" "}
                        entries
                    </span>

                    <div className="not-checked-in-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="not-checked-in-pagination-active"
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

export default NotCheckedIn;
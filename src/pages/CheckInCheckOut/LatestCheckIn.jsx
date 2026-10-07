import { useEffect, useMemo, useState } from "react";

import {
    CalendarDays,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    File,
    Filter,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./LatestCheckIn.css";

const LatestCheckIn = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [selectedRole, setSelectedRole] =
        useState("SUPERVISOR");

    const [searchText, setSearchText] =
        useState("");

    /*
     * Filter section starts hidden.
     * Click the Filter button to show it.
     */
    const [showFilters, setShowFilters] =
        useState(false);

    const [checkIns, setCheckIns] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
        });

    /*
     * =========================
     * FETCH CHECK-INS
     * =========================
     */
    const fetchCheckIns = async (
        requestedPage = 1,
        overrides = {}
    ) => {
        try {
            setLoading(true);
            setError("");

            const params =
                new URLSearchParams();

            const role =
                overrides.role !== undefined
                    ? overrides.role
                    : selectedRole;

            const from =
                overrides.from !== undefined
                    ? overrides.from
                    : fromDate;

            const to =
                overrides.to !== undefined
                    ? overrides.to
                    : toDate;

            const search =
                overrides.search !== undefined
                    ? overrides.search
                    : searchText;

            /*
             * Do not send ALL as a role value.
             */
            if (
                role &&
                role !== "ALL"
            ) {
                params.set(
                    "role",
                    role
                );
            }

            if (from) {
                params.set(
                    "from",
                    from
                );
            }

            if (to) {
                params.set(
                    "to",
                    to
                );
            }

            if (search.trim()) {
                params.set(
                    "search",
                    search.trim()
                );
            }

            params.set(
                "page",
                String(requestedPage)
            );

            params.set(
                "limit",
                "10"
            );

            const response =
                await apiFetch(
                    `/api/check-ins?${params.toString()}`,
                    {
                        method: "GET",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to fetch check-in records"
                );
            }

            const apiCheckIns =
                data?.data?.checkIns ||
                data?.checkIns ||
                [];

            const apiPagination =
                data?.pagination ||
                data?.data?.pagination ||
                {
                    page: requestedPage,
                    limit: 10,
                    total: apiCheckIns.length,
                    totalPages: 1,
                };

            /*
             * This screen is the Supervisor "Latest Supervisor Check-In" view.
             * Keep the frontend defensive even if the backend ever
             * returns mixed roles.
             */
            const supervisorCheckIns =
                Array.isArray(apiCheckIns)
                    ? apiCheckIns.filter(
                        (item) =>
                            String(
                                item?.user?.role || ""
                            ).toUpperCase() ===
                            "SUPERVISOR"
                    )
                    : [];

            setCheckIns(
                supervisorCheckIns
            );

            setPagination(
                {
                    ...apiPagination,
                    total:
                        Number(
                            apiPagination?.total
                        ) >= 0
                            ? Number(
                                apiPagination.total
                            )
                            : supervisorCheckIns.length,
                }
            );
        } catch (error) {
            console.error(
                "Failed to fetch check-ins:",
                error
            );

            setError(
                error?.message ||
                "Failed to fetch check-in records"
            );

            setCheckIns([]);

            setPagination({
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 1,
            });
        } finally {
            setLoading(false);
        }
    };

    /*
     * =========================
     * INITIAL LOAD
     * =========================
     */
    useEffect(() => {
        fetchCheckIns(1);

        // Refresh Latest Supervisor Check-In every 30 seconds so a
        // Supervisor check-in from the mobile app appears
        // automatically on the admin portal.
        const refreshTimer = setInterval(() => {
            fetchCheckIns(1);
        }, 30000);

        return () => {
            clearInterval(refreshTimer);
        };

        // The initial request and timer intentionally use
        // the current default Supervisor filter.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * =========================
     * FORMAT DATE
     * =========================
     */
    const formatDate = (value) => {
        if (!value) {
            return "NA";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "NA";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    /*
     * =========================
     * FORMAT TIME
     * =========================
     */
    const formatTime = (value) => {
        if (!value) {
            return "NA";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "NA";
        }

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }
        );
    };

    /*
     * =========================
     * WORKING HOURS
     * =========================
     */
    const calculateWorkingHours = (
        checkInAt,
        checkOutAt
    ) => {
        if (!checkInAt) {
            return "NA";
        }

        if (!checkOutAt) {
            return "In Progress";
        }

        const start =
            new Date(
                checkInAt
            ).getTime();

        const end =
            new Date(
                checkOutAt
            ).getTime();

        if (
            Number.isNaN(start) ||
            Number.isNaN(end)
        ) {
            return "NA";
        }

        const difference =
            Math.max(
                end - start,
                0
            );

        const totalMinutes =
            Math.floor(
                difference /
                (1000 * 60)
            );

        const hours =
            Math.floor(
                totalMinutes / 60
            );

        const minutes =
            totalMinutes % 60;

        return `${hours}H : ${minutes}M`;
    };

    /*
     * =========================
     * DISTANCE
     * =========================
     */
    const formatDistance = (
        distance
    ) => {
        if (
            distance === null ||
            distance === undefined
        ) {
            return "0 KM";
        }

        const number =
            Number(distance);

        if (
            Number.isNaN(number)
        ) {
            return "0 KM";
        }

        return `${number.toFixed(
            2
        )} KM`;
    };

    /*
     * =========================
     * TABLE DATA
     * =========================
     */
    const tableData = useMemo(() => {
        return checkIns.map(
            (item) => ({
                id: item.id,

                name:
                    item.user?.name ||
                    "Unknown",

                workingHours:
                    calculateWorkingHours(
                        item.checkInAt,
                        item.checkOutAt
                    ),

                checkInDate:
                    formatDate(
                        item.checkInAt
                    ),

                checkInTime:
                    formatTime(
                        item.checkInAt
                    ),

                checkOutDate:
                    item.checkOutAt
                        ? formatDate(
                            item.checkOutAt
                        )
                        : "NA",

                checkOutTime:
                    item.checkOutAt
                        ? formatTime(
                            item.checkOutAt
                        )
                        : "NA",

                distance:
                    formatDistance(
                        item.distanceTravelled
                    ),

                role:
                    item.user?.role ||
                    "SUPERVISOR",

                site:
                    item.site?.name ||
                    "NA",

                email:
                    item.user?.email ||
                    "NA",
            })
        );
    }, [checkIns]);

    /*
     * =========================
     * SEARCH
     * =========================
     */
    const handleSearch = () => {
        setPage(1);

        fetchCheckIns(1, {
            role: selectedRole,
            from: fromDate,
            to: toDate,
            search: searchText,
        });
    };

    /*
     * =========================
     * ROLE CHANGE
     * =========================
     */
    const handleRoleChange = (
        event
    ) => {
        const role =
            event.target.value;

        setSelectedRole(role);
        setPage(1);

        fetchCheckIns(1, {
            role,
            from: fromDate,
            to: toDate,
            search: searchText,
        });
    };

    /*
     * =========================
     * APPLY DATE FILTER
     * =========================
     */
    const handleApplyFilter = () => {
        setPage(1);

        fetchCheckIns(1, {
            role: selectedRole,
            from: fromDate,
            to: toDate,
            search: searchText,
        });
    };

    /*
     * =========================
     * NEXT PAGE
     * =========================
     */
    const handleNextPage = () => {
        if (
            pagination.page <
            pagination.totalPages
        ) {
            const nextPage =
                pagination.page + 1;

            setPage(nextPage);

            fetchCheckIns(
                nextPage,
                {
                    role: selectedRole,
                    from: fromDate,
                    to: toDate,
                    search: searchText,
                }
            );
        }
    };

    /*
     * =========================
     * PREVIOUS PAGE
     * =========================
     */
    const handlePreviousPage = () => {
        if (
            pagination.page >
            1
        ) {
            const previousPage =
                pagination.page - 1;

            setPage(
                previousPage
            );

            fetchCheckIns(
                previousPage,
                {
                    role: selectedRole,
                    from: fromDate,
                    to: toDate,
                    search: searchText,
                }
            );
        }
    };

    /*
     * =========================
     * HTML ESCAPE
     * =========================
     */
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

    /*
     * =========================
     * EXCEL EXPORT
     * =========================
     */
    const handleExportExcel = () => {
        try {
            const headers = [
                "Name",
                "Role",
                "Site",
                "Email",
                "Working Hours",
                "Check-In Date",
                "Check-In Time",
                "Check-Out Date",
                "Check-Out Time",
                "Distance Travelled",
            ];

            const rows =
                tableData.map(
                    (item) => [
                        item.name,
                        item.role,
                        item.site,
                        item.email,
                        item.workingHours,
                        item.checkInDate,
                        item.checkInTime,
                        item.checkOutDate,
                        item.checkOutTime,
                        item.distance,
                    ]
                );

            /*
             * Even if rows = 0,
             * Excel will still be created
             * with the headers.
             */
            const worksheet =
                XLSX.utils.aoa_to_sheet([
                    headers,
                    ...rows,
                ]);

            worksheet["!cols"] = [
                { wch: 22 },
                { wch: 16 },
                { wch: 22 },
                { wch: 30 },
                { wch: 20 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 20 },
            ];

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Latest Supervisor Check-In"
            );

            XLSX.writeFile(
                workbook,
                "latest-supervisor-check-in.xlsx"
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
     * =========================
     * PRINT / PDF
     * =========================
     */
    const handlePrint = () => {
        try {
            const printWindow =
                window.open(
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

            const roleText =
                selectedRole ===
                    "ALL"
                    ? "ALL"
                    : selectedRole ||
                    "SUPERVISOR";

            const tableRows =
                tableData.length > 0
                    ? tableData
                        .map(
                            (item) => `
                                <tr>
                                    <td>
                                        ${escapeHtml(
                                item.name
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.role
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.site
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.email
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.workingHours
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.checkInDate
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.checkInTime
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.checkOutDate
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.checkOutTime
                            )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                item.distance
                            )}
                                    </td>
                                </tr>
                            `
                        )
                        .join("")
                    : `
                        <tr>
                            <td
                                colspan="10"
                                style="
                                    text-align:center;
                                    padding:30px;
                                    color:#6b7280;
                                "
                            >
                                No records found
                            </td>
                        </tr>
                    `;

            printWindow.document.write(`
                <!DOCTYPE html>

                <html>

                    <head>

                        <title>
                            Latest Supervisor Check-In
                        </title>

                        <meta
                            charset="UTF-8"
                        />

                        <style>

                            * {
                                box-sizing:
                                    border-box;
                            }

                            body {
                                font-family:
                                    Arial,
                                    Helvetica,
                                    sans-serif;

                                margin: 25px;

                                color:
                                    #111827;

                                background:
                                    #ffffff;
                            }

                            h1 {
                                margin:
                                    0 0 8px;

                                font-size:
                                    24px;
                            }

                            .generated {
                                margin-bottom:
                                    14px;

                                color:
                                    #6b7280;

                                font-size:
                                    13px;
                            }

                            .filters {
                                display:
                                    flex;

                                flex-wrap:
                                    wrap;

                                gap: 20px;

                                margin-bottom:
                                    20px;

                                padding:
                                    12px 15px;

                                border:
                                    1px solid
                                    #d1d5db;

                                border-radius:
                                    8px;

                                background:
                                    #f9fafb;

                                font-size:
                                    13px;
                            }

                            .filters strong {
                                color:
                                    #111827;
                            }

                            table {
                                width: 100%;

                                border-collapse:
                                    collapse;
                            }

                            th,
                            td {
                                border:
                                    1px solid
                                    #d1d5db;

                                padding:
                                    9px;

                                font-size:
                                    12px;

                                text-align:
                                    left;
                            }

                            th {
                                background:
                                    #f3f4f6;

                                font-weight:
                                    700;
                            }

                            .footer {
                                margin-top:
                                    18px;

                                color:
                                    #6b7280;

                                font-size:
                                    12px;
                            }

                            @media print {

                                body {
                                    margin:
                                        12px;
                                }

                            }

                        </style>

                    </head>

                    <body>

                        <h1>
                            Latest Supervisor Check-In
                        </h1>

                        <div class="generated">
                            Generated on:
                            ${escapeHtml(
                new Date().toLocaleString(
                    "en-IN"
                )
            )}
                        </div>

                        <div class="filters">

                            <div>
                                <strong>
                                    From:
                                </strong>

                                ${escapeHtml(
                fromDate ||
                "All"
            )}
                            </div>

                            <div>
                                <strong>
                                    To:
                                </strong>

                                ${escapeHtml(
                toDate ||
                "All"
            )}
                            </div>

                            <div>
                                <strong>
                                    Role:
                                </strong>

                                ${escapeHtml(
                roleText
            )}
                            </div>

                            <div>
                                <strong>
                                    Search:
                                </strong>

                                ${escapeHtml(
                searchText ||
                "None"
            )}
                            </div>

                        </div>

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Site
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Working Hours
                                    </th>

                                    <th>
                                        Check-In Date
                                    </th>

                                    <th>
                                        Check-In Time
                                    </th>

                                    <th>
                                        Check-Out Date
                                    </th>

                                    <th>
                                        Check-Out Time
                                    </th>

                                    <th>
                                        Distance
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                ${tableRows}

                            </tbody>

                        </table>

                        <div class="footer">
                            Showing
                            ${tableData.length}
                            records on this page.

                            Total matching records:
                            ${pagination.total}
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
                "Print/PDF failed:",
                error
            );

            alert(
                "Failed to generate PDF/Print view."
            );
        }
    };

    /*
     * =========================
     * VIEW RECORD
     * =========================
     */
    const handleView = (
        item
    ) => {
        window.alert(
            `Supervisor: ${item.name}\n` +
            `Site: ${item.site}\n` +
            `Check-In: ${item.checkInDate} ${item.checkInTime}\n` +
            `Check-Out: ${item.checkOutDate} ${item.checkOutTime}\n` +
            `Working Hours: ${item.workingHours}\n` +
            `Distance: ${item.distance}`
        );
    };

    return (
        <div className="latest-checkin-page">

            <div className="latest-checkin-card">

                {/* =========================
                    FILTER HEADER
                ========================= */}

                <div className="checkin-filter-row-top">

                    <button
                        type="button"
                        className={`checkin-filter-button ${showFilters ? "active" : ""
                            }`}
                        onClick={() =>
                            setShowFilters(
                                (current) => !current
                            )
                        }
                        title={
                            showFilters
                                ? "Hide Filters"
                                : "Show Filters"
                        }
                        aria-label="Toggle filters"
                    >
                        <Filter size={18} />
                    </button>

                </div>

                {/* =========================
                    FILTER SECTION
                ========================= */}

                {showFilters && (
                    <div className="checkin-filter-panel">

                        <div className="checkin-filter-field">

                            <label>
                                From Date
                            </label>

                            <div className="date-input-wrapper">

                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) =>
                                        setFromDate(
                                            event.target.value
                                        )
                                    }
                                />

                                <span className="date-icon">
                                    <CalendarDays size={18} />
                                </span>

                            </div>

                        </div>

                        <div className="checkin-filter-field">

                            <label>
                                To Date
                            </label>

                            <div className="date-input-wrapper">

                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) =>
                                        setToDate(
                                            event.target.value
                                        )
                                    }
                                />

                                <span className="date-icon">
                                    <CalendarDays size={18} />
                                </span>

                            </div>

                        </div>

                        <div className="checkin-filter-field">

                            <label>
                                Role
                            </label>

                            <select
                                value={selectedRole}
                                onChange={handleRoleChange}
                            >
                                <option value="SUPERVISOR">
                                    SUPERVISOR
                                </option>

                                <option value="ALL">
                                    ALL
                                </option>
                            </select>

                        </div>

                        <button
                            type="button"
                            className="checkin-apply-button"
                            onClick={
                                handleApplyFilter
                            }
                        >
                            SEARCH
                        </button>

                        <button
                            type="button"
                            className="checkin-reset-button"
                            onClick={() => {

                                setFromDate("");
                                setToDate("");
                                setSelectedRole("SUPERVISOR");
                                setSearchText("");
                                setPage(1);

                                fetchCheckIns(1, {
                                    role: "SUPERVISOR",
                                    from: "",
                                    to: "",
                                    search: "",
                                });

                            }}
                        >
                            RESET
                        </button>

                    </div>
                )}

                {/* =========================
                    TABLE CONTROLS
                ========================= */}

                <div className="table-controls">

                    {/* SEARCH */}

                    <div className="table-search">

                        <input
                            type="text"
                            placeholder="Search..."
                            value={
                                searchText
                            }
                            onChange={(
                                event
                            ) =>
                                setSearchText(
                                    event
                                        .target
                                        .value
                                )
                            }
                            onKeyDown={(
                                event
                            ) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    handleSearch();
                                }
                            }}
                        />

                        <Search
                            size={20}
                        />

                    </div>

                    {/* EXPORT BUTTONS */}

                    <div className="export-buttons">

                        {/* EXCEL */}

                        <button
                            type="button"
                            title="Export Excel"
                            aria-label="Export Excel"
                            className="export-button"
                            onClick={
                                handleExportExcel
                            }
                        >
                            <FileSpreadsheet
                                size={18}
                            />
                        </button>

                        {/* PDF */}

                        <button
                            type="button"
                            title="Export PDF"
                            aria-label="Export PDF"
                            className="export-button"
                            onClick={
                                handlePrint
                            }
                        >
                            <FileText
                                size={18}
                            />
                        </button>

                        {/* PRINT */}

                        <button
                            type="button"
                            title="Print"
                            aria-label="Print"
                            className="export-button"
                            onClick={
                                handlePrint
                            }
                        >
                            <Printer
                                size={18}
                            />
                        </button>

                    </div>

                </div>

                {/* =========================
                    ERROR
                ========================= */}

                {error && (
                    <div
                        style={{
                            padding:
                                "12px 20px",

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
                    TABLE
                ========================= */}

                <div className="checkin-table-wrapper">

                    <table className="checkin-table">

                        <thead>

                            <tr>

                                <th className="view-column">

                                    <span>

                                        <File
                                            size={
                                                16
                                            }
                                        />

                                        View

                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Name
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Working Hours
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Check-In Date
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Check-In Time
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Check-Out Date
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Check-Out Time
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                                <th>

                                    <span>
                                        Distance Travelled
                                    </span>

                                    <small>
                                        ↕
                                    </small>

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>

                                    <td
                                        colSpan="8"
                                        className="empty-state"
                                    >
                                        Loading check-in records...
                                    </td>

                                </tr>
                            ) : tableData.length >
                                0 ? (
                                tableData.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                        >

                                            <td className="view-column">

                                                <button
                                                    type="button"
                                                    className="view-button"
                                                    title={`View ${item.name}`}
                                                    onClick={() =>
                                                        handleView(
                                                            item
                                                        )
                                                    }
                                                >

                                                    <File
                                                        size={
                                                            16
                                                        }
                                                    />

                                                </button>

                                            </td>

                                            <td className="name-cell">
                                                {
                                                    item.name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.workingHours
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.checkInDate
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.checkInTime
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.checkOutDate
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.checkOutTime
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.distance
                                                }
                                            </td>

                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>

                                    <td
                                        colSpan="8"
                                        className="empty-state"
                                    >
                                        No Supervisor check-in records found
                                    </td>

                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* =========================
                    PAGINATION
                ========================= */}

                <div className="checkin-pagination">

                    <button
                        type="button"
                        disabled={
                            pagination.page <= 1
                        }
                        onClick={
                            handlePreviousPage
                        }
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        className={
                            pagination.page === 1
                                ? "active"
                                : ""
                        }
                    >
                        {pagination.page}
                    </button>

                    <button
                        type="button"
                        disabled={
                            pagination.page >=
                            pagination.totalPages
                        }
                        onClick={
                            handleNextPage
                        }
                    >
                        Next
                    </button>

                </div>

            </div>

        </div>
    );
};

export default LatestCheckIn;
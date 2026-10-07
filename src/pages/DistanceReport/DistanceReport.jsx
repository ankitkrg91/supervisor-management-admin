import { useEffect, useMemo, useState } from "react";

import {
    Filter,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    UserRound,
    Phone,
    Map,
    Loader2,
    X,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./DistanceReport.css";

const formatDateTime = (value) => {
    if (!value) {
        return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDistance = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return "0.00";
    }

    return number.toFixed(2);
};

const DistanceReport = () => {
    const [reports, setReports] = useState([]);

    const [search, setSearch] = useState("");

    const [showFilters, setShowFilters] = useState(false);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [region, setRegion] = useState("");

    const [appliedFromDate, setAppliedFromDate] = useState("");
    const [appliedToDate, setAppliedToDate] = useState("");
    const [appliedRegion, setAppliedRegion] = useState("");

    const [pageSize, setPageSize] = useState("10");
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [selectedReport, setSelectedReport] = useState(null);

    /*
     * These regions correspond to the state field
     * stored against a site.
     */
    const regions = useMemo(() => {
        const values = reports
            .map((report) => report?.site?.state)
            .filter(Boolean);

        return [...new Set(values)].sort();
    }, [reports]);

    const fetchDistanceReport = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const params = new URLSearchParams();

            params.set("page", String(page));
            params.set("limit", String(pageSize));

            if (appliedFromDate) {
                params.set(
                    "fromDate",
                    appliedFromDate
                );
            }

            if (appliedToDate) {
                params.set(
                    "toDate",
                    appliedToDate
                );
            }

            if (appliedRegion) {
                params.set(
                    "region",
                    appliedRegion
                );
            }

            if (search.trim()) {
                params.set(
                    "search",
                    search.trim()
                );
            }

            const response = await apiFetch(
                `/api/location/distance-report?${params.toString()}`
            );

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.location.href = "/login";

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to fetch distance report"
                );
            }

            const reportList =
                data?.data?.reports || [];

            setReports(reportList);

            setPagination(
                data?.data?.pagination || {
                    page,
                    limit: Number(pageSize),
                    total: reportList.length,
                    totalPages: 1,
                }
            );
        } catch (error) {
            console.error(
                "Distance report fetch error:",
                error
            );

            setReports([]);

            setPagination({
                page: 1,
                limit: Number(pageSize),
                total: 0,
                totalPages: 1,
            });

            setErrorMessage(
                error?.message ||
                "Failed to fetch distance report"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDistanceReport();
        }, 300);

        return () => clearTimeout(timer);
    }, [
        page,
        pageSize,
        appliedFromDate,
        appliedToDate,
        appliedRegion,
        search,
    ]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleApplyFilters = () => {
        if (
            fromDate &&
            toDate &&
            new Date(toDate) < new Date(fromDate)
        ) {
            setErrorMessage(
                "To date cannot be before from date."
            );

            return;
        }

        setErrorMessage("");

        setAppliedFromDate(fromDate);
        setAppliedToDate(toDate);
        setAppliedRegion(region);

        setPage(1);
    };

    const handleResetFilters = () => {
        setFromDate("");
        setToDate("");
        setRegion("");

        setAppliedFromDate("");
        setAppliedToDate("");
        setAppliedRegion("");

        setPage(1);
        setErrorMessage("");
    };

    const handleExcel = () => {
        const rows = reports.map((report) => ({
            Name:
                report?.user?.name ||
                "N/A",

            Contact:
                report?.user?.phone ||
                "N/A",

            Site:
                report?.site?.name ||
                "N/A",

            "Site Code":
                report?.site?.siteCode ||
                "N/A",

            Region:
                report?.site?.state ||
                "N/A",

            "Distance In KM":
                formatDistance(
                    report?.distanceKm
                ),

            "GPS Points":
                report?.locationPoints ??
                0,

            "First Location":
                formatDateTime(
                    report?.firstLocation
                ),

            "Last Location":
                formatDateTime(
                    report?.lastLocation
                ),

            Status:
                report?.user?.status ||
                "N/A",
        }));

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows.length > 0
                    ? rows
                    : [
                        {
                            Name: "",
                            Contact: "",
                            Site: "",
                            "Site Code": "",
                            Region: "",
                            "Distance In KM": "",
                            "GPS Points": "",
                            "First Location": "",
                            "Last Location": "",
                            Status: "",
                        },
                    ]
            );

        worksheet["!cols"] = [
            { wch: 28 },
            { wch: 18 },
            { wch: 28 },
            { wch: 16 },
            { wch: 18 },
            { wch: 18 },
            { wch: 14 },
            { wch: 24 },
            { wch: 24 },
            { wch: 14 },
        ];

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Distance Report"
        );

        XLSX.writeFile(
            workbook,
            "distance-report.xlsx"
        );
    };

    const handlePdf = () => {
        const printWindow = window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );

        if (!printWindow) {
            alert(
                "Please allow pop-ups in your browser."
            );

            return;
        }

        const rows = reports
            .map(
                (report) => `
                    <tr>
                        <td>
                            ${report?.user?.name || "N/A"}
                        </td>

                        <td>
                            ${report?.user?.phone || "N/A"}
                        </td>

                        <td>
                            ${report?.site?.name || "N/A"}
                        </td>

                        <td>
                            ${report?.site?.state || "N/A"}
                        </td>

                        <td>
                            ${formatDistance(
                    report?.distanceKm
                )}
                        </td>
                    </tr>
                `
            )
            .join("");

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>
                <head>
                    <title>Distance Report</title>

                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 24px;
                            color: #222;
                        }

                        h2 {
                            margin-bottom: 5px;
                        }

                        p {
                            margin-top: 0;
                            color: #666;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            font-size: 12px;
                        }

                        th,
                        td {
                            border: 1px solid #ccc;
                            padding: 8px;
                            text-align: left;
                        }

                        th {
                            background: #f2f2f2;
                        }
                    </style>
                </head>

                <body>
                    <h2>Distance Report</h2>

                    <p>
                        Generated on
                        ${formatDateTime(new Date())}
                    </p>

                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Site</th>
                                <th>Region</th>
                                <th>Distance In KM</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${rows ||
            `
                                    <tr>
                                        <td colspan="5">
                                            No records found
                                        </td>
                                    </tr>
                                `
            }
                        </tbody>
                    </table>
                </body>
            </html>
        `);

        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrevious = () => {
        if (
            pagination.page <= 1 ||
            loading
        ) {
            return;
        }

        setPage(
            (currentPage) =>
                currentPage - 1
        );
    };

    const handleNext = () => {
        if (
            pagination.page >=
            pagination.totalPages ||
            loading
        ) {
            return;
        }

        setPage(
            (currentPage) =>
                currentPage + 1
        );
    };

    const handlePageChange = (
        pageNumber
    ) => {
        if (
            pageNumber < 1 ||
            pageNumber >
            pagination.totalPages ||
            loading
        ) {
            return;
        }

        setPage(pageNumber);
    };

    const paginationPages = useMemo(() => {
        const totalPages =
            pagination.totalPages;

        if (totalPages <= 5) {
            return Array.from(
                {
                    length: totalPages,
                },
                (_, index) =>
                    index + 1
            );
        }

        const current =
            pagination.page;

        if (current <= 3) {
            return [
                1,
                2,
                3,
                4,
                5,
            ];
        }

        if (
            current >=
            totalPages - 2
        ) {
            return [
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        return [
            current - 2,
            current - 1,
            current,
            current + 1,
            current + 2,
        ];
    }, [
        pagination.page,
        pagination.totalPages,
    ]);

    const showingFrom =
        pagination.total === 0
            ? 0
            : (pagination.page - 1) *
            pagination.limit +
            1;

    const showingTo =
        pagination.total === 0
            ? 0
            : Math.min(
                pagination.page *
                pagination.limit,
                pagination.total
            );

    return (
        <div className="distance-report-page">
            <section className="distance-report-card">

                {/* FILTER BUTTON */}

                <div className="distance-filter-row">
                    <button
                        type="button"
                        className={`distance-filter-button ${showFilters
                                ? "active"
                                : ""
                            }`}
                        onClick={() =>
                            setShowFilters(
                                (current) =>
                                    !current
                            )
                        }
                        title="Filter"
                    >
                        <Filter size={17} />
                    </button>
                </div>

                {/* FILTER PANEL */}

                {showFilters && (
                    <div className="distance-filter-panel">

                        <div className="distance-filter-field">
                            <label>
                                From Date
                            </label>

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) =>
                                    setFromDate(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="distance-filter-field">
                            <label>
                                To Date
                            </label>

                            <input
                                type="date"
                                min={
                                    fromDate ||
                                    undefined
                                }
                                value={toDate}
                                onChange={(event) =>
                                    setToDate(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="distance-filter-field">
                            <label>
                                Region
                            </label>

                            <select
                                value={region}
                                onChange={(event) =>
                                    setRegion(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Regions
                                </option>

                                {regions.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="distance-apply-button"
                            onClick={
                                handleApplyFilters
                            }
                        >
                            APPLY
                        </button>

                        <button
                            type="button"
                            className="distance-reset-button"
                            onClick={
                                handleResetFilters
                            }
                        >
                            RESET
                        </button>
                    </div>
                )}

                {/* TOOLBAR */}

                <div className="distance-toolbar">

                    <div className="distance-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        <Search size={18} />
                    </div>

                    <div className="distance-export-buttons">

                        <button
                            type="button"
                            title="Excel"
                            onClick={
                                handleExcel
                            }
                            disabled={loading}
                        >
                            <FileSpreadsheet
                                size={17}
                            />
                        </button>

                        <button
                            type="button"
                            title="PDF"
                            onClick={
                                handlePdf
                            }
                            disabled={loading}
                        >
                            <FileText size={17} />
                        </button>

                        <button
                            type="button"
                            title="Print"
                            onClick={
                                handlePrint
                            }
                        >
                            <Printer size={17} />
                        </button>

                    </div>
                </div>

                {/* ERROR */}

                {errorMessage && (
                    <div className="distance-error">
                        {errorMessage}

                        <button
                            type="button"
                            onClick={() =>
                                setErrorMessage(
                                    ""
                                )
                            }
                            title="Close"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* TABLE */}

                <div className="distance-table-wrapper">
                    <table className="distance-table">

                        <thead>
                            <tr>

                                <th>
                                    <span>
                                        <UserRound
                                            size={14}
                                        />
                                        Name
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Phone
                                            size={14}
                                        />
                                        Contact
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Map
                                            size={14}
                                        />
                                        Distance In KM
                                    </span>
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="distance-loading"
                                    >
                                        <Loader2
                                            size={20}
                                            className="distance-spinner"
                                        />

                                        Loading distance report...
                                    </td>
                                </tr>
                            ) : reports.length > 0 ? (
                                reports.map(
                                    (report) => (
                                        <tr
                                            key={
                                                report
                                                    ?.user
                                                    ?.id
                                            }
                                        >
                                            <td
                                                className="distance-name"
                                                onClick={() =>
                                                    setSelectedReport(
                                                        report
                                                    )
                                                }
                                            >
                                                {
                                                    report
                                                        ?.user
                                                        ?.name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    report
                                                        ?.user
                                                        ?.phone
                                                }
                                            </td>

                                            <td className="distance-value">
                                                {formatDistance(
                                                    report?.distanceKm
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="distance-empty"
                                    >
                                        No matching records found
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}

                <div className="distance-footer">

                    <span>
                        Showing{" "}
                        {showingFrom} to{" "}
                        {showingTo} of{" "}
                        {pagination.total}{" "}
                        entries
                    </span>

                    <div className="distance-show">
                        <span>
                            Show
                        </span>

                        <select
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(
                                    event.target.value
                                );
                                setPage(1);
                            }}
                        >
                            <option value="10">
                                10
                            </option>

                            <option value="25">
                                25
                            </option>

                            <option value="50">
                                50
                            </option>

                            <option value="100">
                                100
                            </option>
                        </select>

                        <span>
                            entries
                        </span>
                    </div>

                    <div className="distance-pagination">

                        <button
                            onClick={
                                handlePrevious
                            }
                            disabled={
                                loading ||
                                pagination.page <=
                                1
                            }
                        >
                            Previous
                        </button>

                        {paginationPages.map(
                            (pageNumber) => (
                                <button
                                    key={
                                        pageNumber
                                    }
                                    className={
                                        pageNumber ===
                                            pagination.page
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            pageNumber
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                >
                                    {
                                        pageNumber
                                    }
                                </button>
                            )
                        )}

                        <button
                            onClick={
                                handleNext
                            }
                            disabled={
                                loading ||
                                pagination.page >=
                                pagination.totalPages
                            }
                        >
                            Next
                        </button>

                    </div>
                </div>
            </section>

            {/* DETAIL MODAL */}

            {selectedReport && (
                <div
                    className="distance-modal-overlay"
                    onClick={() =>
                        setSelectedReport(
                            null
                        )
                    }
                >
                    <div
                        className="distance-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="distance-modal-header">

                            <div>
                                <h3>
                                    Distance Details
                                </h3>

                                <span>
                                    {
                                        selectedReport
                                            ?.user
                                            ?.name
                                    }
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedReport(
                                        null
                                    )
                                }
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="distance-modal-body">

                            <div className="distance-detail">
                                <label>
                                    Contact
                                </label>

                                <p>
                                    {
                                        selectedReport
                                            ?.user
                                            ?.phone ||
                                        "N/A"
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    Site
                                </label>

                                <p>
                                    {
                                        selectedReport
                                            ?.site
                                            ?.name ||
                                        "N/A"
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    Site Code
                                </label>

                                <p>
                                    {
                                        selectedReport
                                            ?.site
                                            ?.siteCode ||
                                        "N/A"
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    Region
                                </label>

                                <p>
                                    {
                                        selectedReport
                                            ?.site
                                            ?.state ||
                                        "N/A"
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    Distance
                                </label>

                                <p>
                                    {
                                        formatDistance(
                                            selectedReport
                                                ?.distanceKm
                                        )
                                    }{" "}
                                    KM
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    GPS Points
                                </label>

                                <p>
                                    {
                                        selectedReport
                                            ?.locationPoints ??
                                        0
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    First Location
                                </label>

                                <p>
                                    {
                                        formatDateTime(
                                            selectedReport
                                                ?.firstLocation
                                        )
                                    }
                                </p>
                            </div>

                            <div className="distance-detail">
                                <label>
                                    Last Location
                                </label>

                                <p>
                                    {
                                        formatDateTime(
                                            selectedReport
                                                ?.lastLocation
                                        )
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DistanceReport;
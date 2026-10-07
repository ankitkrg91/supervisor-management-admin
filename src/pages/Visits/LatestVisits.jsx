import {
    Fragment,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CalendarDays,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    Image as ImageIcon,
    File,
    Plus,
    Minus,
    Download,
    MapPin,
    X,
    ExternalLink,
    RefreshCw,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./LatestVisits.css";


const PAGE_SIZE = 10;


const LatestVisits = () => {
    const [visits, setVisits] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [searchText, setSearchText] = useState("");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [region, setRegion] = useState("ALL");

    const [branch, setBranch] = useState("ALL");

    const [client, setClient] = useState("ALL");

    const [showFilters, setShowFilters] = useState(false);

    const [expandedRows, setExpandedRows] = useState([]);

    const [photoModal, setPhotoModal] = useState(null);

    const [page, setPage] = useState(1);


    /* =========================================================
       FETCH VISITS
       ========================================================= */

    const fetchVisits = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            params.set("role", "SUPERVISOR");
            params.set("page", "1");
            params.set("limit", "100");

            const response = await apiFetch(
                `/api/visits?${params.toString()}`,
                {
                    method: "GET",
                }
            );

            const body = await response.json();

            if (!response.ok) {
                throw new Error(
                    body?.message ||
                    "Failed to load visits"
                );
            }

            const rows =
                body?.data?.visits ||
                body?.visits ||
                [];

            setVisits(
                Array.isArray(rows)
                    ? rows
                    : []
            );

            setExpandedRows([]);
            setPage(1);
        } catch (fetchError) {
            console.error(
                "Latest visits error:",
                fetchError
            );

            setError(
                fetchError?.message ||
                "Failed to load visits"
            );

            setVisits([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchVisits();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /* =========================================================
       FILTER OPTIONS
       ========================================================= */

    const regions = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                visits
                    .map(
                        (item) =>
                            item.region
                    )
                    .filter(Boolean)
            ),
        ];
    }, [visits]);


    const branches = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                visits
                    .map(
                        (item) =>
                            item.branch ||
                            item.site?.city
                    )
                    .filter(Boolean)
            ),
        ];
    }, [visits]);


    const clients = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                visits
                    .map(
                        (item) =>
                            item.clientName
                    )
                    .filter(Boolean)
            ),
        ];
    }, [visits]);


    /* =========================================================
       FILTER DATA
       ========================================================= */

    const filteredData = useMemo(() => {
        const query =
            searchText
                .trim()
                .toLowerCase();

        return visits.filter((item) => {
            const searchable = [
                item.user?.name,
                item.user?.email,
                item.site?.name,
                item.site?.siteCode,
                item.site?.state,
                item.clientName,
                item.branch,
                item.region,
                item.reportType,
                item.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchSearch =
                !query ||
                searchable.includes(
                    query
                );

            const itemRegion =
                item.region || "";

            const itemBranch =
                item.branch ||
                item.site?.city ||
                "";

            const itemClient =
                item.clientName ||
                "";

            const matchRegion =
                region === "ALL" ||
                itemRegion === region;

            const matchBranch =
                branch === "ALL" ||
                itemBranch === branch;

            const matchClient =
                client === "ALL" ||
                itemClient === client;

            let matchFrom = true;
            let matchTo = true;

            if (fromDate) {
                const from =
                    new Date(
                        `${fromDate}T00:00:00`
                    );

                const visitDate =
                    new Date(
                        item.visitAt
                    );

                matchFrom =
                    visitDate >= from;
            }

            if (toDate) {
                const to =
                    new Date(
                        `${toDate}T23:59:59`
                    );

                const visitDate =
                    new Date(
                        item.visitAt
                    );

                matchTo =
                    visitDate <= to;
            }

            return (
                matchSearch &&
                matchRegion &&
                matchBranch &&
                matchClient &&
                matchFrom &&
                matchTo
            );
        });
    }, [
        visits,
        searchText,
        region,
        branch,
        client,
        fromDate,
        toDate,
    ]);


    /* =========================================================
       PAGINATION
       ========================================================= */

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredData.length /
            PAGE_SIZE
        )
    );


    const paginatedData = useMemo(() => {
        const start =
            (page - 1) *
            PAGE_SIZE;

        return filteredData.slice(
            start,
            start + PAGE_SIZE
        );
    }, [
        filteredData,
        page,
    ]);


    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [
        page,
        totalPages,
    ]);


    /* =========================================================
       HELPERS
       ========================================================= */

    const formatDate = (value) => {
        if (!value) {
            return "NA";
        }

        const d = new Date(value);

        if (
            Number.isNaN(
                d.getTime()
            )
        ) {
            return "NA";
        }

        return d.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    const formatTime = (value) => {
        if (!value) {
            return "NA";
        }

        const d = new Date(value);

        if (
            Number.isNaN(
                d.getTime()
            )
        ) {
            return "NA";
        }

        return d.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }
        );
    };


    /* =========================================================
       PHOTO ID
       ========================================================= */

    const getPhotoId = (visit) => {
        const storedId =
            String(
                visit?.photoFileId ||
                ""
            ).trim();

        if (storedId) {
            return storedId;
        }

        const photoUrl =
            String(
                visit?.photoUrl ||
                ""
            ).trim();

        if (!photoUrl) {
            return "";
        }

        const queryMatch =
            photoUrl.match(
                /[?&]id=([^&]+)/i
            );

        if (queryMatch) {
            return queryMatch[1];
        }

        const pathMatch =
            photoUrl.match(
                /\/d\/([^/]+)/i
            );

        return pathMatch
            ? pathMatch[1]
            : "";
    };


    /* =========================================================
       PHOTO PREVIEW
       ========================================================= */

    const getPhotoPreviewUrl = (
        visit
    ) => {
        const id =
            getPhotoId(visit);

        if (!id) {
            return "";
        }

        return (
            `https://drive.google.com/file/d/${encodeURIComponent(
                id
            )}/preview`
        );
    };


    const getDownloadUrl = (
        visit
    ) => {
        const id =
            getPhotoId(visit);

        if (id) {
            return (
                `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
                    id
                )}`
            );
        }

        return String(
            visit?.photoUrl ||
            ""
        ).trim();
    };


    const hasPhoto = (visit) => {
        return Boolean(
            getPhotoId(visit)
        );
    };


    /* =========================================================
       OPEN PHOTO
       ========================================================= */

    const openPhoto = async (
        visit
    ) => {
        try {
            let target = visit;

            if (!hasPhoto(target)) {
                const response =
                    await apiFetch(
                        `/api/visits/${visit.id}`,
                        {
                            method: "GET",
                        }
                    );

                const body =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        body?.message ||
                        "Unable to load photo"
                    );
                }

                target =
                    body?.data?.visit ||
                    body?.visit ||
                    visit;
            }

            if (!hasPhoto(target)) {
                alert(
                    "No photo uploaded for this visit."
                );

                return;
            }

            setPhotoModal(target);
        } catch (photoError) {
            console.error(
                "Photo preview error:",
                photoError
            );

            setError(
                photoError?.message ||
                "Unable to load photo"
            );
        }
    };


    /* =========================================================
       DOWNLOAD
       ========================================================= */

    const downloadPhoto = async (
        visit
    ) => {
        try {
            let target = visit;

            if (!hasPhoto(target)) {
                const response =
                    await apiFetch(
                        `/api/visits/${visit.id}`,
                        {
                            method: "GET",
                        }
                    );

                const body =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        body?.message ||
                        "Unable to load photo"
                    );
                }

                target =
                    body?.data?.visit ||
                    body?.visit ||
                    visit;
            }

            const url =
                getDownloadUrl(target);

            if (!url) {
                alert(
                    "No photo available."
                );

                return;
            }

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        } catch (downloadError) {
            setError(
                downloadError?.message ||
                "Unable to download photo"
            );
        }
    };


    /* =========================================================
       MAP
       ========================================================= */

    const openMap = (visit) => {
        const latitude =
            visit?.latitude;

        const longitude =
            visit?.longitude;

        if (
            latitude === null ||
            latitude === undefined ||
            longitude === null ||
            longitude === undefined
        ) {
            alert(
                "No GPS location is available."
            );

            return;
        }

        window.open(
            `https://www.google.com/maps?q=${latitude},${longitude}`,
            "_blank",
            "noopener,noreferrer"
        );
    };


    /* =========================================================
       TOGGLE ROW
       ========================================================= */

    const toggleRow = (id) => {
        setExpandedRows(
            (current) =>
                current.includes(id)
                    ? current.filter(
                        (rowId) =>
                            rowId !== id
                    )
                    : [
                        ...current,
                        id,
                    ]
        );
    };


    /* =========================================================
       RESET FILTERS
       ========================================================= */

    const resetFilters = () => {
        setFromDate("");
        setToDate("");
        setRegion("ALL");
        setBranch("ALL");
        setClient("ALL");
        setSearchText("");
        setPage(1);
    };


    /* =========================================================
       EXCEL
       ========================================================= */

    const exportExcel = () => {
        const rows =
            filteredData.map(
                (item) => ({
                    Supervisor:
                        item.user?.name ||
                        "NA",

                    VisitDate:
                        formatDate(
                            item.visitAt
                        ),

                    VisitTime:
                        formatTime(
                            item.visitAt
                        ),

                    ReportType:
                        item.reportType ||
                        "NA",

                    SiteID:
                        item.site
                            ?.siteCode ||
                        "NA",

                    SiteName:
                        item.site
                            ?.name ||
                        "NA",

                    Client:
                        item.clientName ||
                        "NA",

                    State:
                        item.site
                            ?.state ||
                        "NA",

                    Branch:
                        item.branch ||
                        item.site
                            ?.city ||
                        "NA",

                    Region:
                        item.region ||
                        "NA",

                    Latitude:
                        item.latitude ??
                        "NA",

                    Longitude:
                        item.longitude ??
                        "NA",

                    Photo:
                        hasPhoto(item)
                            ? "Available"
                            : "Not Available",

                    PhotoFileID:
                        item.photoFileId ||
                        "NA",

                    Status:
                        item.status ||
                        "PENDING",
                })
            );

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Latest Visits"
        );

        XLSX.writeFile(
            workbook,
            "latest-visits.xlsx"
        );
    };


    /* =========================================================
       PRINT
       ========================================================= */

    const printVisits = () => {
        const popup =
            window.open(
                "",
                "_blank",
                "width=1500,height=900"
            );

        if (!popup) {
            alert(
                "Please allow popups."
            );

            return;
        }

        const rows =
            filteredData
                .map(
                    (item) => `
                        <tr>
                            <td>${item.user?.name || "NA"}</td>
                            <td>${formatDate(item.visitAt)}</td>
                            <td>${formatTime(item.visitAt)}</td>
                            <td>${item.reportType || "NA"}</td>
                            <td>${item.site?.siteCode || "NA"}</td>
                            <td>${item.site?.name || "NA"}</td>
                            <td>${item.clientName || "NA"}</td>
                            <td>${item.site?.state || "NA"}</td>
                            <td>${item.latitude ?? "NA"}</td>
                            <td>${item.longitude ?? "NA"}</td>
                            <td>${hasPhoto(item) ? "Available" : "Not Available"}</td>
                            <td>${item.status || "PENDING"}</td>
                        </tr>
                    `
                )
                .join("");

        popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Latest Supervisor Visits</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        color: #111827;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th,
                    td {
                        border: 1px solid #d1d5db;
                        padding: 7px;
                        font-size: 10px;
                        text-align: left;
                    }

                    th {
                        background: #f3f4f6;
                    }

                    @page {
                        size: landscape;
                        margin: 8mm;
                    }
                </style>
            </head>

            <body>

                <h2>
                    Latest Supervisor Visits
                </h2>

                <p>
                    Generated:
                    ${new Date().toLocaleString("en-IN")}
                </p>

                <table>

                    <thead>
                        <tr>
                            <th>Supervisor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Site ID</th>
                            <th>Site</th>
                            <th>Client</th>
                            <th>State</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                            <th>Photo</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </body>
            </html>
        `);

        popup.document.close();

        setTimeout(() => {
            popup.focus();
            popup.print();
        }, 400);
    };


    return (
        <div className="latest-visits-page">

            <div className="latest-visits-card">

                {/* HEADER */}

                <div className="latest-filter-header">

                    <div>
                        <h2>
                            Latest Visits
                        </h2>

                        <p>
                            Supervisor site visit history
                        </p>
                    </div>

                    <button
                        type="button"
                        className="latest-filter-toggle"
                        onClick={() =>
                            setShowFilters(
                                (current) =>
                                    !current
                            )
                        }
                    >
                        <CalendarDays
                            size={15}
                        />

                        {showFilters
                            ? "Hide Filters"
                            : "Filters"}
                    </button>

                </div>


                {/* FILTER PANEL */}

                {showFilters && (
                    <div className="latest-filter-panel">

                        <div>
                            <label>
                                From Date
                            </label>

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>


                        <div>
                            <label>
                                To Date
                            </label>

                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            />
                        </div>


                        <div>
                            <label>
                                Region
                            </label>

                            <select
                                value={region}
                                onChange={(e) => {
                                    setRegion(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                {regions.map(
                                    (value) => (
                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>


                        <div>
                            <label>
                                Branch
                            </label>

                            <select
                                value={branch}
                                onChange={(e) => {
                                    setBranch(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                {branches.map(
                                    (value) => (
                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>


                        <div>
                            <label>
                                Client
                            </label>

                            <select
                                value={client}
                                onChange={(e) => {
                                    setClient(
                                        e.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                {clients.map(
                                    (value) => (
                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {value}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>


                        <div className="latest-filter-buttons">

                            <button
                                type="button"
                                onClick={() =>
                                    setPage(1)
                                }
                            >
                                Apply
                            </button>

                            <button
                                type="button"
                                onClick={
                                    resetFilters
                                }
                            >
                                Reset
                            </button>

                        </div>

                    </div>
                )}


                {/* TOOLBAR */}

                <div className="latest-toolbar">

                    <div className="latest-search">

                        <Search
                            size={17}
                        />

                        <input
                            type="text"
                            placeholder="Search supervisor, site, client..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(
                                    e.target.value
                                );
                                setPage(1);
                            }}
                        />

                    </div>


                    <div className="latest-toolbar-actions">

                        <button
                            type="button"
                            title="Refresh"
                            onClick={
                                fetchVisits
                            }
                        >
                            <RefreshCw
                                size={17}
                            />
                        </button>


                        <button
                            type="button"
                            title="Export Excel"
                            onClick={
                                exportExcel
                            }
                        >
                            <FileSpreadsheet
                                size={17}
                            />
                        </button>


                        <button
                            type="button"
                            title="Print / PDF"
                            onClick={
                                printVisits
                            }
                        >
                            <Printer
                                size={17}
                            />
                        </button>

                    </div>

                </div>


                {error && (
                    <div className="latest-error">
                        {error}
                    </div>
                )}


                {/* TABLE */}

                <div className="latest-table-wrap">

                    <table className="latest-table">

                        <thead>

                            <tr>
                                <th>
                                    Evidence
                                </th>

                                <th>
                                    Report
                                </th>

                                <th>
                                    Supervisor
                                </th>

                                <th>
                                    Visit Date
                                </th>

                                <th>
                                    Visit Time
                                </th>

                                <th>
                                    Report Type
                                </th>

                                <th>
                                    Site ID
                                </th>

                                <th>
                                    Site Name
                                </th>

                                <th>
                                    Client
                                </th>

                                <th>
                                    State
                                </th>

                                <th>
                                    Status
                                </th>
                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="latest-empty"
                                    >
                                        Loading visits...
                                    </td>
                                </tr>
                            ) : paginatedData.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="latest-empty"
                                    >
                                        No Supervisor visits found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map(
                                    (item) => {
                                        const expanded =
                                            expandedRows.includes(
                                                item.id
                                            );

                                        const photo =
                                            hasPhoto(
                                                item
                                            );

                                        return (
                                            <Fragment
                                                key={
                                                    item.id
                                                }
                                            >

                                                <tr
                                                    className={
                                                        expanded
                                                            ? "latest-row expanded"
                                                            : "latest-row"
                                                    }
                                                >

                                                    <td>

                                                        <div className="latest-evidence">

                                                            <button
                                                                type="button"
                                                                className="latest-expand"
                                                                onClick={() =>
                                                                    toggleRow(
                                                                        item.id
                                                                    )
                                                                }
                                                            >
                                                                {expanded ? (
                                                                    <Minus
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <Plus
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                )}
                                                            </button>


                                                            {photo ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="latest-photo-btn"
                                                                        title="View Photo"
                                                                        onClick={() =>
                                                                            openPhoto(
                                                                                item
                                                                            )
                                                                        }
                                                                    >
                                                                        <ImageIcon
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="latest-download-btn"
                                                                        title="Download Photo"
                                                                        onClick={() =>
                                                                            downloadPhoto(
                                                                                item
                                                                            )
                                                                        }
                                                                    >
                                                                        <Download
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="latest-no-photo">
                                                                    No Photo
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>


                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="latest-report-btn"
                                                            title="View Report"
                                                            onClick={() =>
                                                                alert(
                                                                    [
                                                                        `Supervisor: ${item.user?.name || "NA"}`,
                                                                        `Site: ${item.site?.name || "NA"}`,
                                                                        `Client: ${item.clientName || "NA"}`,
                                                                        `Report Type: ${item.reportType || "NA"}`,
                                                                        `Status: ${item.status || "PENDING"}`,
                                                                        `Notes: ${item.notes || "NA"}`,
                                                                    ].join(
                                                                        "\n"
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <File
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </button>

                                                    </td>


                                                    <td>
                                                        <strong>
                                                            {
                                                                item
                                                                    .user
                                                                    ?.name ||
                                                                "NA"
                                                            }
                                                        </strong>
                                                    </td>


                                                    <td>
                                                        {
                                                            formatDate(
                                                                item.visitAt
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            formatTime(
                                                                item.visitAt
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.reportType ||
                                                            "NA"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.site
                                                                ?.siteCode ||
                                                            "NA"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.site
                                                                ?.name ||
                                                            "NA"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.clientName ||
                                                            "NA"
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.site
                                                                ?.state ||
                                                            "NA"
                                                        }
                                                    </td>


                                                    <td>
                                                        <span
                                                            className={`latest-status latest-status-${String(
                                                                item.status ||
                                                                "PENDING"
                                                            ).toLowerCase()}`}
                                                        >
                                                            {
                                                                item.status ||
                                                                "PENDING"
                                                            }
                                                        </span>
                                                    </td>

                                                </tr>


                                                {expanded && (
                                                    <tr className="latest-expanded-row">

                                                        <td
                                                            colSpan="11"
                                                        >

                                                            <div className="latest-expanded-content">

                                                                <div className="latest-detail-block">

                                                                    <span>
                                                                        GPS
                                                                    </span>

                                                                    <strong>
                                                                        {item.latitude !==
                                                                            null &&
                                                                            item.latitude !==
                                                                            undefined &&
                                                                            item.longitude !==
                                                                            null &&
                                                                            item.longitude !==
                                                                            undefined
                                                                            ? `${Number(
                                                                                item.latitude
                                                                            ).toFixed(
                                                                                6
                                                                            )}, ${Number(
                                                                                item.longitude
                                                                            ).toFixed(
                                                                                6
                                                                            )}`
                                                                            : "No GPS"}
                                                                    </strong>

                                                                    {item.latitude !==
                                                                        null &&
                                                                        item.longitude !==
                                                                        null && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openMap(
                                                                                        item
                                                                                    )
                                                                                }
                                                                            >
                                                                                <MapPin
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                View Map
                                                                            </button>
                                                                        )}

                                                                </div>


                                                                <div className="latest-detail-block">

                                                                    <span>
                                                                        Photo
                                                                    </span>

                                                                    {photo ? (
                                                                        <div className="latest-photo-actions">

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openPhoto(
                                                                                        item
                                                                                    )
                                                                                }
                                                                            >
                                                                                <ImageIcon
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                View Photo
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    downloadPhoto(
                                                                                        item
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Download
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                Download
                                                                            </button>

                                                                        </div>
                                                                    ) : (
                                                                        <strong>
                                                                            No Photo
                                                                        </strong>
                                                                    )}

                                                                </div>


                                                                <div className="latest-detail-block">

                                                                    <span>
                                                                        Photo File ID
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            item.photoFileId ||
                                                                            "NA"
                                                                        }
                                                                    </strong>

                                                                </div>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                )}

                                            </Fragment>
                                        );
                                    }
                                )
                            )}

                        </tbody>

                    </table>

                </div>


                {/* PAGINATION */}

                <div className="latest-pagination-footer">

                    <span>
                        Showing{" "}
                        {filteredData.length ===
                            0
                            ? 0
                            : (page - 1) *
                            PAGE_SIZE +
                            1}
                        {" "}to{" "}
                        {Math.min(
                            page *
                            PAGE_SIZE,
                            filteredData.length
                        )}
                        {" "}of{" "}
                        {
                            filteredData.length
                        }
                        {" "}entries
                    </span>


                    <div className="latest-pagination">

                        <button
                            type="button"
                            disabled={
                                page <= 1
                            }
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        current - 1
                                )
                            }
                        >
                            Previous
                        </button>


                        <button
                            type="button"
                            className="active"
                        >
                            {page}
                        </button>


                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages
                            }
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        current + 1
                                )
                            }
                        >
                            Next
                        </button>

                    </div>

                </div>

            </div>


            {/* PHOTO MODAL */}

            {photoModal && (
                <div
                    className="latest-photo-modal-backdrop"
                    onClick={() =>
                        setPhotoModal(null)
                    }
                >

                    <div
                        className="latest-photo-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="latest-photo-modal-header">

                            <div>
                                <strong>
                                    Site Visit Photo
                                </strong>

                                <span>
                                    {
                                        photoModal
                                            .site
                                            ?.name ||
                                        "Site"
                                    }
                                </span>
                            </div>


                            <div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        downloadPhoto(
                                            photoModal
                                        )
                                    }
                                    title="Download"
                                >
                                    <Download
                                        size={16}
                                    />
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        window.open(
                                            getPhotoPreviewUrl(
                                                photoModal
                                            ),
                                            "_blank",
                                            "noopener,noreferrer"
                                        )
                                    }
                                    title="Open"
                                >
                                    <ExternalLink
                                        size={16}
                                    />
                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setPhotoModal(
                                            null
                                        )
                                    }
                                    title="Close"
                                >
                                    <X
                                        size={17}
                                    />
                                </button>

                            </div>

                        </div>


                        <div className="latest-photo-modal-body">

                            <iframe
                                src={getPhotoPreviewUrl(
                                    photoModal
                                )}
                                title="Site Visit Photo Preview"
                                className="latest-photo-iframe"
                                allow="autoplay"
                            />

                        </div>


                        <div className="latest-photo-modal-footer">

                            <span>
                                GPS:{" "}
                                {
                                    photoModal
                                        .latitude ??
                                    "NA"
                                }
                                {" , "}
                                {
                                    photoModal
                                        .longitude ??
                                    "NA"
                                }
                            </span>

                            <span>
                                {
                                    photoModal
                                        .status ||
                                    "PENDING"
                                }
                            </span>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};


export default LatestVisits;
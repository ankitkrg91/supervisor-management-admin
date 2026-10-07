import {
    Fragment,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    Image as ImageIcon,
    Plus,
    Minus,
    Download,
    MapPin,
    X,
    ExternalLink,
    CheckCircle2,
    RotateCcw,
    XCircle,
    RefreshCw,
    CalendarDays,
} from "lucide-react";

import * as XLSX from "xlsx";

import { apiFetch } from "../../utils/api";

import "./VerifiedUnverifiedVisit.css";


const PAGE_SIZE = 10;


const VerifiedUnverifiedVisit = () => {
    const [visits, setVisits] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [searchText, setSearchText] = useState("");

    const [status, setStatus] = useState("ALL");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [region, setRegion] = useState("ALL");

    const [branch, setBranch] = useState("ALL");

    const [client, setClient] = useState("ALL");

    const [showFilters, setShowFilters] = useState(false);

    const [expandedRows, setExpandedRows] = useState([]);

    const [photoModal, setPhotoModal] = useState(null);

    const [updatingId, setUpdatingId] = useState(null);

    const [page, setPage] = useState(1);


    /* =========================================================
       FETCH
       ========================================================= */

    const fetchVisits = async (
        selectedStatus = status
    ) => {
        try {
            setLoading(true);
            setError("");

            const params =
                new URLSearchParams();

            params.set(
                "role",
                "SUPERVISOR"
            );

            params.set(
                "page",
                "1"
            );

            params.set(
                "limit",
                "100"
            );

            if (
                selectedStatus !==
                "ALL"
            ) {
                params.set(
                    "status",
                    selectedStatus
                );
            }

            const response =
                await apiFetch(
                    `/api/visits?${params.toString()}`,
                    {
                        method: "GET",
                    }
                );

            const body =
                await response.json();

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
                "Verification visits error:",
                fetchError
            );

            setError(
                fetchError?.message ||
                "Failed to load visits"
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchVisits("ALL");

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
       FILTERED DATA
       ========================================================= */

    const filteredData = useMemo(() => {
        const query =
            searchText
                .trim()
                .toLowerCase();

        return visits.filter(
            (item) => {
                const searchable = [
                    item.user?.name,
                    item.user?.email,
                    item.site?.name,
                    item.site?.siteCode,
                    item.site?.state,
                    item.clientName,
                    item.branch,
                    item.region,
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
            }
        );
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

        const d =
            new Date(value);

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

        const d =
            new Date(value);

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
        const stored =
            String(
                visit?.photoFileId ||
                ""
            ).trim();

        if (stored) {
            return stored;
        }

        const url =
            String(
                visit?.photoUrl ||
                ""
            ).trim();

        if (!url) {
            return "";
        }

        const queryMatch =
            url.match(
                /[?&]id=([^&]+)/i
            );

        if (queryMatch) {
            return queryMatch[1];
        }

        const pathMatch =
            url.match(
                /\/d\/([^/]+)/i
            );

        return pathMatch
            ? pathMatch[1]
            : "";
    };


    /* =========================================================
       DRIVE PREVIEW
       ========================================================= */

    const getPhotoPreviewUrl =
        (visit) => {
            const id =
                getPhotoId(
                    visit
                );

            if (!id) {
                return "";
            }

            return (
                `https://drive.google.com/file/d/${encodeURIComponent(
                    id
                )}/preview`
            );
        };


    const getDownloadUrl =
        (visit) => {
            const id =
                getPhotoId(
                    visit
                );

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
            getPhotoId(
                visit
            )
        );
    };


    /* =========================================================
       PHOTO
       ========================================================= */

    const openPhoto = async (
        visit
    ) => {
        try {
            let target =
                visit;

            if (!hasPhoto(target)) {
                const response =
                    await apiFetch(
                        `/api/visits/${visit.id}`,
                        {
                            method:
                                "GET",
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

            setPhotoModal(
                target
            );
        } catch (photoError) {
            setError(
                photoError?.message ||
                "Unable to load photo"
            );
        }
    };


    const downloadPhoto = (
        visit
    ) => {
        const url =
            getDownloadUrl(
                visit
            );

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
    };


    /* =========================================================
       MAP
       ========================================================= */

    const openMap = (
        visit
    ) => {
        if (
            visit.latitude ===
            null ||
            visit.latitude ===
            undefined ||
            visit.longitude ===
            null ||
            visit.longitude ===
            undefined
        ) {
            alert(
                "No GPS location is available."
            );

            return;
        }

        window.open(
            `https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`,
            "_blank",
            "noopener,noreferrer"
        );
    };


    /* =========================================================
       TOGGLE
       ========================================================= */

    const toggleRow = (id) => {
        setExpandedRows(
            (current) =>
                current.includes(
                    id
                )
                    ? current.filter(
                        (
                            rowId
                        ) =>
                            rowId !==
                            id
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
       STATUS UPDATE
       ========================================================= */

    const updateStatus = async (
        visit,
        nextStatus
    ) => {
        const confirmed =
            window.confirm(
                `Set this visit to ${nextStatus}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingId(
                visit.id
            );

            setError("");

            const response =
                await apiFetch(
                    `/api/visits/${visit.id}/status`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                status:
                                    nextStatus,
                            }),
                    }
                );

            const body =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    body?.message ||
                    "Failed to update status"
                );
            }

            const updated =
                body?.data?.visit ||
                body?.visit ||
                {};

            setVisits(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                                visit.id
                                ? {
                                    ...item,
                                    ...updated,
                                    status:
                                        nextStatus,
                                }
                                : item
                    )
            );
        } catch (updateError) {
            setError(
                updateError?.message ||
                "Failed to update status"
            );
        } finally {
            setUpdatingId(
                null
            );
        }
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

                    Status:
                        item.status ||
                        "PENDING",

                    VisitDate:
                        formatDate(
                            item.visitAt
                        ),

                    VisitTime:
                        formatTime(
                            item.visitAt
                        ),

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
            "Verification"
        );

        XLSX.writeFile(
            workbook,
            "visit-verification.xlsx"
        );
    };


    /* =========================================================
       PRINT
       ========================================================= */

    const printVerification =
        () => {
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
                                <td>${item.site?.name || "NA"}</td>
                                <td>${item.site?.siteCode || "NA"}</td>
                                <td>${formatDate(item.visitAt)}</td>
                                <td>${formatTime(item.visitAt)}</td>
                                <td>${item.status || "PENDING"}</td>
                                <td>${item.latitude ?? "NA"}</td>
                                <td>${item.longitude ?? "NA"}</td>
                                <td>${hasPhoto(item) ? "Available" : "Not Available"}</td>
                            </tr>
                        `
                    )
                    .join("");

            popup.document.write(`
                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        Visit Verification
                    </title>

                    <style>

                        body {
                            font-family:
                                Arial,
                                sans-serif;

                            padding: 20px;

                            color:
                                #111827;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }

                        th,
                        td {
                            border:
                                1px solid #d1d5db;

                            padding:
                                7px;

                            font-size:
                                10px;

                            text-align:
                                left;
                        }

                        th {
                            background:
                                #f3f4f6;
                        }

                        @page {
                            size:
                                landscape;

                            margin:
                                8mm;
                        }

                    </style>

                </head>

                <body>

                    <h2>
                        Visit Verification
                    </h2>

                    <p>
                        Generated:
                        ${new Date().toLocaleString(
                "en-IN"
            )}
                    </p>

                    <table>

                        <thead>

                            <tr>
                                <th>Supervisor</th>
                                <th>Site</th>
                                <th>Site ID</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Latitude</th>
                                <th>Longitude</th>
                                <th>Photo</th>
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
        <div className="verification-page">

            <div className="verification-card">

                {/* HEADER */}

                <div className="verification-header">

                    <div>
                        <h2>
                            Visit Verification
                        </h2>

                        <p>
                            Review Supervisor photos,
                            GPS and verification status.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="verification-refresh"
                        onClick={() =>
                            fetchVisits(
                                status
                            )
                        }
                    >
                        <RefreshCw
                            size={15}
                        />
                        Refresh
                    </button>

                </div>


                {/* STATUS TABS */}

                <div className="verification-tabs">

                    {[
                        "ALL",
                        "PENDING",
                        "VERIFIED",
                        "UNVERIFIED",
                        "REJECTED",
                    ].map(
                        (value) => (
                            <button
                                key={
                                    value
                                }
                                type="button"
                                className={
                                    status ===
                                        value
                                        ? "active"
                                        : ""
                                }
                                onClick={() => {
                                    setStatus(
                                        value
                                    );

                                    fetchVisits(
                                        value
                                    );

                                    setPage(1);
                                }}
                            >
                                {
                                    value
                                }
                            </button>
                        )
                    )}

                </div>


                {/* FILTER TOGGLE */}

                <div className="verification-filter-row">

                    <button
                        type="button"
                        className="verification-filter-toggle"
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
                    <div className="verification-filter-panel">

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


                        <div className="verification-filter-actions">

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


                {/* SEARCH / EXPORT */}

                <div className="verification-toolbar">

                    <div className="verification-search">

                        <Search
                            size={16}
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


                    <span className="verification-record-count">
                        {filteredData.length}
                        {" "}Records
                    </span>


                    <div className="verification-export-group">

                        <button
                            type="button"
                            title="Excel"
                            onClick={
                                exportExcel
                            }
                        >
                            <FileSpreadsheet
                                size={16}
                            />
                        </button>


                        <button
                            type="button"
                            title="PDF"
                            onClick={
                                printVerification
                            }
                        >
                            <FileText
                                size={16}
                            />
                        </button>


                        <button
                            type="button"
                            title="Print"
                            onClick={
                                printVerification
                            }
                        >
                            <Printer
                                size={16}
                            />
                        </button>

                    </div>

                </div>


                {error && (
                    <div className="verification-error">
                        {error}
                    </div>
                )}


                {/* TABLE */}

                <div className="verification-table-wrap">

                    <table className="verification-table">

                        <thead>

                            <tr>

                                <th>
                                    Evidence
                                </th>

                                <th>
                                    Supervisor
                                </th>

                                <th>
                                    Site
                                </th>

                                <th>
                                    Visit
                                </th>

                                <th>
                                    Verification
                                </th>

                                <th>
                                    GPS
                                </th>

                                <th>
                                    Review
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="verification-empty"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedData.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="verification-empty"
                                    >
                                        No visit records found.
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
                                                            ? "verification-main-row expanded"
                                                            : "verification-main-row"
                                                    }
                                                >

                                                    {/* EVIDENCE */}

                                                    <td>

                                                        <div className="verification-evidence">

                                                            <button
                                                                type="button"
                                                                className="verification-expand"
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
                                                                        className="verification-photo-button"
                                                                        onClick={() =>
                                                                            openPhoto(
                                                                                item
                                                                            )
                                                                        }
                                                                        title="View Photo"
                                                                    >
                                                                        <ImageIcon
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="verification-download-button"
                                                                        onClick={() =>
                                                                            downloadPhoto(
                                                                                item
                                                                            )
                                                                        }
                                                                        title="Download Photo"
                                                                    >
                                                                        <Download
                                                                            size={
                                                                                15
                                                                            }
                                                                        />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="verification-no-photo">
                                                                    No Photo
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>


                                                    {/* SUPERVISOR */}

                                                    <td>

                                                        <div className="verification-person">

                                                            <strong>
                                                                {
                                                                    item.user
                                                                        ?.name ||
                                                                    "NA"
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    item.user
                                                                        ?.email ||
                                                                    "NA"
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* SITE */}

                                                    <td>

                                                        <div className="verification-site">

                                                            <strong>
                                                                {
                                                                    item.site
                                                                        ?.name ||
                                                                    "NA"
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    item.site
                                                                        ?.siteCode ||
                                                                    "NA"
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* VISIT */}

                                                    <td>

                                                        <div className="verification-visit">

                                                            <strong>
                                                                {
                                                                    formatDate(
                                                                        item.visitAt
                                                                    )
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    formatTime(
                                                                        item.visitAt
                                                                    )
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            className={`verification-status-badge verification-${String(
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


                                                    {/* GPS */}

                                                    <td>

                                                        {item.latitude !==
                                                            null &&
                                                            item.latitude !==
                                                            undefined &&
                                                            item.longitude !==
                                                            null &&
                                                            item.longitude !==
                                                            undefined ? (
                                                            <button
                                                                type="button"
                                                                className="verification-map-btn"
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
                                                                Map
                                                            </button>
                                                        ) : (
                                                            <span className="verification-no-gps">
                                                                No GPS
                                                            </span>
                                                        )}

                                                    </td>


                                                    {/* REVIEW */}

                                                    <td>

                                                        <div className="verification-actions">

                                                            <button
                                                                type="button"
                                                                className="verify"
                                                                title="Verify"
                                                                disabled={
                                                                    updatingId ===
                                                                    item.id
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        item,
                                                                        "VERIFIED"
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="unverify"
                                                                title="Unverify"
                                                                disabled={
                                                                    updatingId ===
                                                                    item.id
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        item,
                                                                        "UNVERIFIED"
                                                                    )
                                                                }
                                                            >
                                                                <RotateCcw
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="reject"
                                                                title="Reject"
                                                                disabled={
                                                                    updatingId ===
                                                                    item.id
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        item,
                                                                        "REJECTED"
                                                                    )
                                                                }
                                                            >
                                                                <XCircle
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>


                                                {/* EXPANDED */}

                                                {expanded && (
                                                    <tr className="verification-expanded-row">

                                                        <td
                                                            colSpan="7"
                                                        >

                                                            <div className="verification-expanded-content">

                                                                <div className="verification-info-grid">

                                                                    <div>
                                                                        <span>
                                                                            Client
                                                                        </span>

                                                                        <strong>
                                                                            {
                                                                                item.clientName ||
                                                                                "NA"
                                                                            }
                                                                        </strong>
                                                                    </div>


                                                                    <div>
                                                                        <span>
                                                                            Branch
                                                                        </span>

                                                                        <strong>
                                                                            {
                                                                                item.branch ||
                                                                                item.site
                                                                                    ?.city ||
                                                                                "NA"
                                                                            }
                                                                        </strong>
                                                                    </div>


                                                                    <div>
                                                                        <span>
                                                                            Region
                                                                        </span>

                                                                        <strong>
                                                                            {
                                                                                item.region ||
                                                                                "NA"
                                                                            }
                                                                        </strong>
                                                                    </div>


                                                                    <div>
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
                                                                                : "NA"}
                                                                        </strong>
                                                                    </div>

                                                                </div>


                                                                <div className="verification-photo-section">

                                                                    <div className="verification-photo-section-header">

                                                                        <strong>
                                                                            Site Photo
                                                                        </strong>

                                                                        {photo && (
                                                                            <div>

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
                                                                                    View
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
                                                                        )}

                                                                    </div>


                                                                    {photo ? (
                                                                        <div className="verification-photo-ready">

                                                                            <ImageIcon
                                                                                size={
                                                                                    30
                                                                                }
                                                                            />

                                                                            <strong>
                                                                                Photo available
                                                                            </strong>

                                                                            <span>
                                                                                Click View to open the full Google Drive preview.
                                                                            </span>

                                                                        </div>
                                                                    ) : (
                                                                        <div className="verification-photo-empty">
                                                                            No photo uploaded for this visit.
                                                                        </div>
                                                                    )}

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

                <div className="verification-pagination-footer">

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


                    <div className="verification-pagination">

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
                    className="verification-modal-backdrop"
                    onClick={() =>
                        setPhotoModal(null)
                    }
                >

                    <div
                        className="verification-photo-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="verification-modal-header">

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


                        <div className="verification-modal-body">

                            <iframe
                                src={getPhotoPreviewUrl(
                                    photoModal
                                )}
                                title="Site Visit Photo Preview"
                                className="verification-photo-iframe"
                                allow="autoplay"
                            />

                        </div>


                        <div className="verification-modal-footer">

                            <span>
                                GPS:
                                {" "}
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


export default VerifiedUnverifiedVisit;
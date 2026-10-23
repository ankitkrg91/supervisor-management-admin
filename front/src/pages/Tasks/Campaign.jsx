import { useEffect, useMemo, useState } from "react";
import {
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Loader2,
    Printer,
    Search,
    X,
} from "lucide-react";
import * as XLSX from "xlsx";

import "./Campaign.css";

const getCampaignNumber = (campaign) => {
    if (campaign?.campaignNumber) {
        return campaign.campaignNumber;
    }

    if (campaign?.id) {
        return `CMP-${campaign.id.slice(0, 8).toUpperCase()}`;
    }

    return "N/A";
};

const formatDate = (value) => {
    if (!value) {
        return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

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

const getStatusLabel = (status) => {
    if (!status) {
        return "N/A";
    }

    return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const escapeHtml = (value) => {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const Campaign = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [search, setSearch] = useState("");

    const [showFilters, setShowFilters] = useState(false);

    const [draftStatus, setDraftStatus] = useState("");
    const [appliedStatus, setAppliedStatus] = useState("");

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

    const [selectedCampaign, setSelectedCampaign] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || "";

    const fetchCampaigns = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            const params = new URLSearchParams();

            params.set("page", String(page));
            params.set("limit", String(pageSize));

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (appliedStatus) {
                params.set("status", appliedStatus);
            }

            const response = await fetch(
                `${API_BASE_URL}/api/campaigns?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok || result?.success === false) {
                throw new Error(
                    result?.message || "Failed to load campaigns"
                );
            }

            const responseData = result?.data;

            const campaignList = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.campaigns)
                    ? responseData.campaigns
                    : [];

            setCampaigns(campaignList);

            setPagination({
                page:
                    result?.pagination?.page ??
                    responseData?.pagination?.page ??
                    page,
                limit:
                    result?.pagination?.limit ??
                    responseData?.pagination?.limit ??
                    Number(pageSize),
                total:
                    result?.pagination?.total ??
                    responseData?.pagination?.total ??
                    campaignList.length,
                totalPages:
                    result?.pagination?.totalPages ??
                    responseData?.pagination?.totalPages ??
                    Math.max(
                        1,
                        Math.ceil(
                            (
                                result?.pagination?.total ??
                                responseData?.pagination?.total ??
                                campaignList.length
                            ) / Number(pageSize)
                        )
                    ),
            });
        } catch (error) {
            console.error("Campaign fetch error:", error);

            setCampaigns([]);
            setPagination({
                page: 1,
                limit: Number(pageSize),
                total: 0,
                totalPages: 1,
            });

            setErrorMessage(
                error?.message || "Unable to load campaigns"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCampaigns();
        }, 350);

        return () => clearTimeout(timer);
    }, [page, pageSize, appliedStatus, search]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleApplyFilters = () => {
        setAppliedStatus(draftStatus);
        setPage(1);
    };

    const handleResetFilters = () => {
        setDraftStatus("");
        setAppliedStatus("");
        setPage(1);
    };

    const visibleCampaigns = useMemo(() => {
        return campaigns;
    }, [campaigns]);

    const handleExcel = () => {
        const rows = visibleCampaigns.map((campaign) => ({
            "Campaign Number": getCampaignNumber(campaign),
            "Campaign Name": campaign?.name || "",
            Remark: campaign?.description || "",
            "Scheduled By": "Super Admin",
            "Scheduled On": formatDateTime(campaign?.createdAt),
            "Start Date": formatDate(campaign?.startDate),
            "End Date": formatDate(campaign?.endDate),
            Status: getStatusLabel(campaign?.status),
            "Total Tasks": campaign?._count?.tasks ?? 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(
            rows.length > 0
                ? rows
                : [
                    {
                        "Campaign Number": "",
                        "Campaign Name": "",
                        Remark: "",
                        "Scheduled By": "",
                        "Scheduled On": "",
                        "Start Date": "",
                        "End Date": "",
                        Status: "",
                        "Total Tasks": "",
                    },
                ]
        );

        worksheet["!cols"] = [
            { wch: 20 },
            { wch: 30 },
            { wch: 40 },
            { wch: 18 },
            { wch: 24 },
            { wch: 18 },
            { wch: 18 },
            { wch: 16 },
            { wch: 14 },
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Campaigns"
        );

        XLSX.writeFile(
            workbook,
            `campaigns-page-${page}.xlsx`
        );
    };

    const handlePdf = () => {
        const rows = visibleCampaigns
            .map(
                (campaign) => `
                    <tr>
                        <td>${escapeHtml(
                    getCampaignNumber(campaign)
                )}</td>
                        <td>${escapeHtml(
                    campaign?.name || "N/A"
                )}</td>
                        <td>${escapeHtml(
                    campaign?.description || "N/A"
                )}</td>
                        <td>Super Admin</td>
                        <td>${escapeHtml(
                    formatDateTime(campaign?.createdAt)
                )}</td>
                        <td>${escapeHtml(
                    getStatusLabel(campaign?.status)
                )}</td>
                    </tr>
                `
            )
            .join("");

        const printWindow = window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );

        if (!printWindow) {
            alert(
                "Please allow pop-ups in your browser to export PDF."
            );
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Campaigns</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 24px;
                            color: #222;
                        }

                        h2 {
                            margin-bottom: 6px;
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
                            vertical-align: top;
                        }

                        th {
                            background: #f3f3f3;
                        }
                    </style>
                </head>

                <body>
                    <h2>Campaign Report</h2>
                    <p>
                        Generated on ${escapeHtml(
            formatDateTime(new Date())
        )}
                    </p>

                    <table>
                        <thead>
                            <tr>
                                <th>Campaign Number</th>
                                <th>Campaign Name</th>
                                <th>Remark</th>
                                <th>Scheduled By</th>
                                <th>Scheduled On</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${rows ||
            `
                                <tr>
                                    <td colspan="6">
                                        No campaigns found
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

    const handleViewCampaign = (campaign) => {
        setSelectedCampaign(campaign);
    };

    const closeModal = () => {
        setSelectedCampaign(null);
    };

    const handlePrevious = () => {
        if (pagination.page <= 1 || loading) {
            return;
        }

        setPage((currentPage) => currentPage - 1);
    };

    const handleNext = () => {
        if (
            pagination.page >= pagination.totalPages ||
            loading
        ) {
            return;
        }

        setPage((currentPage) => currentPage + 1);
    };

    const handlePageChange = (nextPage) => {
        if (
            nextPage < 1 ||
            nextPage > pagination.totalPages ||
            loading
        ) {
            return;
        }

        setPage(nextPage);
    };

    const paginationPages = useMemo(() => {
        const totalPages = pagination.totalPages;

        if (totalPages <= 5) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        const currentPage = pagination.page;

        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5];
        }

        if (currentPage >= totalPages - 2) {
            return [
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        return [
            currentPage - 2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            currentPage + 2,
        ];
    }, [pagination.page, pagination.totalPages]);

    const showingFrom =
        pagination.total === 0
            ? 0
            : (pagination.page - 1) * pagination.limit + 1;

    const showingTo =
        pagination.total === 0
            ? 0
            : Math.min(
                pagination.page * pagination.limit,
                pagination.total
            );

    return (
        <div className="campaign-page">
            <section className="campaign-card">

                {/* TOP FILTER */}

                <div className="campaign-filter-row">
                    <button
                        type="button"
                        className={`campaign-filter-button ${showFilters ? "active" : ""
                            }`}
                        onClick={() =>
                            setShowFilters((current) => !current)
                        }
                        title="Filter"
                    >
                        <Filter size={17} />
                    </button>
                </div>

                {showFilters && (
                    <div className="campaign-filter-panel">
                        <div className="campaign-filter-field">
                            <label>Campaign Status</label>

                            <select
                                value={draftStatus}
                                onChange={(event) =>
                                    setDraftStatus(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Campaigns
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>

                                <option value="COMPLETED">
                                    Completed
                                </option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="campaign-filter-apply"
                            onClick={handleApplyFilters}
                        >
                            APPLY
                        </button>

                        <button
                            type="button"
                            className="campaign-filter-reset"
                            onClick={handleResetFilters}
                        >
                            RESET
                        </button>
                    </div>
                )}

                {/* TOOLBAR */}

                <div className="campaign-toolbar">
                    <div className="campaign-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                        <Search size={18} />
                    </div>

                    <div className="campaign-export-buttons">
                        <button
                            type="button"
                            title="Excel"
                            onClick={handleExcel}
                            disabled={loading}
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            title="PDF"
                            onClick={handlePdf}
                            disabled={loading}
                        >
                            <FileText size={17} />
                        </button>

                        <button
                            type="button"
                            title="Print"
                            onClick={handlePrint}
                        >
                            <Printer size={17} />
                        </button>
                    </div>
                </div>

                {/* ERROR */}

                {errorMessage && (
                    <div className="campaign-error">
                        {errorMessage}
                    </div>
                )}

                {/* TABLE */}

                <div className="campaign-table-wrapper">
                    <table className="campaign-table">
                        <thead>
                            <tr>
                                <th>
                                    <span>
                                        <Eye size={14} />
                                        View Campaign
                                    </span>
                                </th>

                                <th>Campaign Number</th>

                                <th>Campaign name</th>

                                <th>Remark</th>

                                <th>Scheduled By</th>

                                <th>Scheduled On</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="campaign-loading"
                                    >
                                        <Loader2
                                            size={20}
                                            className="campaign-spinner"
                                        />
                                        Loading campaigns...
                                    </td>
                                </tr>
                            ) : visibleCampaigns.length > 0 ? (
                                visibleCampaigns.map(
                                    (campaign) => (
                                        <tr key={campaign.id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="campaign-view-button"
                                                    onClick={() =>
                                                        handleViewCampaign(
                                                            campaign
                                                        )
                                                    }
                                                    title="View Campaign"
                                                >
                                                    <Eye
                                                        size={16}
                                                    />
                                                </button>
                                            </td>

                                            <td>
                                                {getCampaignNumber(
                                                    campaign
                                                )}
                                            </td>

                                            <td>
                                                {campaign?.name ||
                                                    "N/A"}
                                            </td>

                                            <td>
                                                {campaign
                                                    ?.description ||
                                                    "N/A"}
                                            </td>

                                            <td>
                                                Super Admin
                                            </td>

                                            <td>
                                                {formatDateTime(
                                                    campaign?.createdAt
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="campaign-empty"
                                    >
                                        No matching records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER */}

                <div className="campaign-footer">
                    <span>
                        Showing {showingFrom} to {showingTo} of{" "}
                        {pagination.total} entries
                    </span>

                    <div className="campaign-show">
                        <span>Show</span>

                        <select
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(event.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>

                        <span>entries</span>
                    </div>

                    <div className="campaign-pagination">
                        <button
                            onClick={handlePrevious}
                            disabled={
                                loading ||
                                pagination.page <= 1
                            }
                        >
                            Previous
                        </button>

                        {paginationPages.map(
                            (pageNumber) => (
                                <button
                                    key={pageNumber}
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
                                    disabled={loading}
                                >
                                    {pageNumber}
                                </button>
                            )
                        )}

                        <button
                            onClick={handleNext}
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

            {/* VIEW CAMPAIGN MODAL */}

            {selectedCampaign && (
                <div
                    className="campaign-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="campaign-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="campaign-modal-header">
                            <div>
                                <h3>Campaign Details</h3>

                                <span>
                                    {getCampaignNumber(
                                        selectedCampaign
                                    )}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="campaign-modal-close"
                                onClick={closeModal}
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="campaign-modal-body">
                            <div className="campaign-detail-item">
                                <label>Campaign Name</label>
                                <p>
                                    {selectedCampaign.name ||
                                        "N/A"}
                                </p>
                            </div>

                            <div className="campaign-detail-item">
                                <label>Description / Remark</label>
                                <p>
                                    {selectedCampaign
                                        .description || "N/A"}
                                </p>
                            </div>

                            <div className="campaign-detail-grid">
                                <div className="campaign-detail-item">
                                    <label>Scheduled By</label>
                                    <p>Super Admin</p>
                                </div>

                                <div className="campaign-detail-item">
                                    <label>Status</label>
                                    <p>
                                        {getStatusLabel(
                                            selectedCampaign.status
                                        )}
                                    </p>
                                </div>

                                <div className="campaign-detail-item">
                                    <label>Start Date</label>
                                    <p>
                                        {formatDate(
                                            selectedCampaign.startDate
                                        )}
                                    </p>
                                </div>

                                <div className="campaign-detail-item">
                                    <label>End Date</label>
                                    <p>
                                        {formatDate(
                                            selectedCampaign.endDate
                                        )}
                                    </p>
                                </div>

                                <div className="campaign-detail-item">
                                    <label>Created On</label>
                                    <p>
                                        {formatDateTime(
                                            selectedCampaign.createdAt
                                        )}
                                    </p>
                                </div>

                                <div className="campaign-detail-item">
                                    <label>Total Tasks</label>
                                    <p>
                                        {selectedCampaign
                                            ?._count?.tasks ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="campaign-modal-footer">
                            <button
                                type="button"
                                onClick={closeModal}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaign;
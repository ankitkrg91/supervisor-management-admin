import { useMemo, useState } from "react";
import {
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Printer,
    Search,
} from "lucide-react";
import "./Campaign.css";

const campaignData = [
    {
        id: 1,
        campaignNumber: "CMP-2026-001",
        campaignName: "August MSF Inspection",
        remark: "Monthly MSF inspection campaign",
        scheduledBy: "Admin",
        scheduledOn: "24 Aug 2026",
    },
    {
        id: 2,
        campaignNumber: "CMP-2026-002",
        campaignName: "Night Visit Campaign",
        remark: "Night security verification",
        scheduledBy: "Admin",
        scheduledOn: "25 Aug 2026",
    },
    {
        id: 3,
        campaignNumber: "CMP-2026-003",
        campaignName: "Site Audit Campaign",
        remark: "Branch-wise site audit",
        scheduledBy: "Admin",
        scheduledOn: "26 Aug 2026",
    },
];

const Campaign = () => {
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [pageSize, setPageSize] = useState("10");

    const filteredCampaigns = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) {
            return campaignData;
        }

        return campaignData.filter((campaign) =>
            [
                campaign.campaignNumber,
                campaign.campaignName,
                campaign.remark,
                campaign.scheduledBy,
                campaign.scheduledOn,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [search]);

    const handleExcel = () => {
        console.log("Export Campaigns to Excel");
    };

    const handlePdf = () => {
        console.log("Export Campaigns to PDF");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleViewCampaign = (campaign) => {
        console.log("View campaign:", campaign);
    };

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
                            setShowFilters(!showFilters)
                        }
                        title="Filter"
                    >
                        <Filter size={17} />
                    </button>
                </div>

                {showFilters && (
                    <div className="campaign-filter-panel">
                        <div className="campaign-filter-field">
                            <label>Scheduled By</label>

                            <select defaultValue="">
                                <option value="">All Users</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div className="campaign-filter-field">
                            <label>Campaign Status</label>

                            <select defaultValue="">
                                <option value="">All Campaigns</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="campaign-filter-apply"
                        >
                            APPLY
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
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            title="PDF"
                            onClick={handlePdf}
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
                            {filteredCampaigns.map((campaign) => (
                                <tr key={campaign.id}>

                                    <td>
                                        <button
                                            type="button"
                                            className="campaign-view-button"
                                            onClick={() =>
                                                handleViewCampaign(campaign)
                                            }
                                            title="View Campaign"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>

                                    <td>
                                        {campaign.campaignNumber}
                                    </td>

                                    <td>
                                        {campaign.campaignName}
                                    </td>

                                    <td>
                                        {campaign.remark}
                                    </td>

                                    <td>
                                        {campaign.scheduledBy}
                                    </td>

                                    <td>
                                        {campaign.scheduledOn}
                                    </td>

                                </tr>
                            ))}

                            {filteredCampaigns.length === 0 && (
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
                        Showing{" "}
                        {filteredCampaigns.length === 0
                            ? 0
                            : 1}{" "}
                        to {filteredCampaigns.length} of{" "}
                        {filteredCampaigns.length} entries
                    </span>

                    <div className="campaign-show">
                        <span>Show</span>

                        <select
                            value={pageSize}
                            onChange={(event) =>
                                setPageSize(event.target.value)
                            }
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>

                        <span>entries</span>
                    </div>

                    <div className="campaign-pagination">
                        <button disabled>
                            Previous
                        </button>

                        <button className="active">
                            1
                        </button>

                        <button disabled>
                            Next
                        </button>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Campaign;
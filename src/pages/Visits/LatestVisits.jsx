import { Fragment, useMemo, useState } from "react";
import {
    CalendarDays,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    Image,
    File,
    Plus,
    Minus,
    Download,
    Building2,
    MapPin,
    Phone,
} from "lucide-react";

import "./LatestVisits.css";

const visitData = [
    {
        id: 1,
        name: "SANJIV KUMAR-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "16:12:03",
        reportType: "Feedback",
        siteId: "MFM5613",
        siteName: "GHAGGA",
        client: "HDFC BANK LTD.",
        state: "Punjab",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        contact: "9888096804",
    },
    {
        id: 2,
        name: "VIKRAM NISCHAL-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "16:05:59",
        reportType: "Feedback",
        siteId: "MFM5630",
        siteName: "FOCAL POINT",
        client: "HDFC BANK LTD.",
        state: "Punjab",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        contact: "9876543210",
    },
    {
        id: 3,
        name: "VIKRAM NISCHAL-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "15:54:14",
        reportType: "Feedback",
        siteId: "29828",
        siteName: "SODAL ROAD BRANCH",
        client: "IDFC FIRST BANK LIMITED",
        state: "Punjab",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        contact: "9876543210",
    },
    {
        id: 4,
        name: "GURMEET SINGH-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "15:42:18",
        reportType: "Inspection",
        siteId: "MFM5642",
        siteName: "MODEL TOWN",
        client: "HDFC BANK LTD.",
        state: "Punjab",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        contact: "9915358659",
    },
    {
        id: 5,
        name: "SANJIV KUMAR-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "14:38:45",
        reportType: "Feedback",
        siteId: "MFM5651",
        siteName: "CIVIL LINES",
        client: "HDFC BANK LTD.",
        state: "Punjab",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        contact: "9888096804",
    },
];

const roleOptions = [
    "ALL",
    "AO-EXECUTIVE-MSF",
    "AO-ASSIGNMENT OFFICER",
    "AO-ASST. MANAGER",
    "AO-EXECUTIVE-ATM",
    "AO-EXECUTIVE-MFM",
    "AO-OPERATION MANAGER",
    "AO-OPERATION MANAGER-TRG",
    "AO-TRAINING OFFICER",
    "AO-OPERATION MANAGER-MFM",
    "AO-ELECTRICIAN-MST",
    "AO-SR. EXECUTIVE-MFM",
    "AO-AREA OFFICER",
    "MFM",
    "HR-EXECUTIVE",
];

const LatestVisits = () => {
    const [fromDate, setFromDate] = useState("2026-08-24");
    const [toDate, setToDate] = useState("2026-08-24");

    const [region, setRegion] = useState("ALL SELECTED (12)");
    const [branch, setBranch] = useState("ALL SELECTED (82)");
    const [role, setRole] = useState("ALL");
    const [client, setClient] = useState("ALL SELECTED (1153)");

    const [reportsBetween, setReportsBetween] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (id) => {
        setExpandedRows((current) =>
            current.includes(id)
                ? current.filter((rowId) => rowId !== id)
                : [...current, id]
        );
    };

    const filteredData = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        if (!search) {
            return visitData;
        }

        return visitData.filter(
            (item) =>
                item.name.toLowerCase().includes(search) ||
                item.siteId.toLowerCase().includes(search) ||
                item.siteName.toLowerCase().includes(search) ||
                item.client.toLowerCase().includes(search) ||
                item.reportType.toLowerCase().includes(search) ||
                item.branch.toLowerCase().includes(search) ||
                item.region.toLowerCase().includes(search)
        );
    }, [searchText]);

    const handleSearch = () => {
        console.log({
            fromDate,
            toDate,
            region,
            branch,
            role,
            client,
            reportsBetween,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="latest-visits-page">
            <div className="latest-visits-card">

                {/* ================= FILTERS ================= */}

                <div className="visits-filter-section">

                    <div className="visits-filter-row">

                        <div className="visit-date-group">
                            <label>From Date:</label>

                            <div className="visit-date-input">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                        setFromDate(e.target.value)
                                    }
                                />

                                <span>
                                    <CalendarDays size={18} />
                                </span>
                            </div>
                        </div>

                        <div className="visit-date-group">
                            <label>To Date:</label>

                            <div className="visit-date-input">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) =>
                                        setToDate(e.target.value)
                                    }
                                />

                                <span>
                                    <CalendarDays size={18} />
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="visits-filter-button"
                            aria-label="Filter"
                        >
                            ▼
                        </button>

                    </div>

                    <div className="visits-filter-grid">

                        <div className="visit-field">
                            <label>Region</label>

                            <select
                                value={region}
                                onChange={(e) =>
                                    setRegion(e.target.value)
                                }
                            >
                                <option>ALL SELECTED (12)</option>
                                <option>CHANDIGARH</option>
                                <option>PUNJAB</option>
                                <option>HARYANA</option>
                            </select>
                        </div>

                        <div className="visit-field">
                            <label>Branch</label>

                            <select
                                value={branch}
                                onChange={(e) =>
                                    setBranch(e.target.value)
                                }
                            >
                                <option>ALL SELECTED (82)</option>
                                <option>LUDHIANA</option>
                                <option>CHANDIGARH</option>
                                <option>AMRITSAR</option>
                            </select>
                        </div>

                        <div className="visit-field">
                            <label>Role:</label>

                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(e.target.value)
                                }
                            >
                                {roleOptions.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="visit-field">
                            <label>Client</label>

                            <select
                                value={client}
                                onChange={(e) =>
                                    setClient(e.target.value)
                                }
                            >
                                <option>ALL SELECTED (1153)</option>
                                <option>HDFC BANK LTD.</option>
                                <option>IDFC FIRST BANK LIMITED</option>
                                <option>ICICI BANK</option>
                                <option>AXIS BANK</option>
                            </select>
                        </div>

                        <div className="reports-between-field">
                            <label>Only Reports Between:</label>

                            <input
                                type="checkbox"
                                checked={reportsBetween}
                                onChange={(e) =>
                                    setReportsBetween(e.target.checked)
                                }
                            />
                        </div>

                        <button
                            type="button"
                            className="visits-search-button"
                            onClick={handleSearch}
                        >
                            SEARCH
                        </button>

                    </div>

                </div>

                {/* ================= TABLE CONTROLS ================= */}

                <div className="visits-table-controls">

                    <div className="visits-table-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) =>
                                setSearchText(e.target.value)
                            }
                        />

                        <Search size={19} />
                    </div>

                    <div className="visits-export-buttons">

                        <button
                            type="button"
                            className="visits-export-button"
                            title="Export Excel"
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            className="visits-export-button"
                            title="Export PDF"
                        >
                            <FileText size={17} />
                        </button>

                        <button
                            type="button"
                            className="visits-export-button"
                            title="Print"
                            onClick={handlePrint}
                        >
                            <Printer size={17} />
                        </button>

                    </div>

                </div>

                {/* ================= TABLE ================= */}

                <div className="visits-table-wrapper">

                    <table className="visits-table">

                        <thead>
                            <tr>

                                <th>
                                    <span>
                                        <Image size={15} />
                                        Photos
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        <File size={15} />
                                        View Report
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>Name</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        <CalendarDays size={15} />
                                        Visit Date
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>◷ Visit Time</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>▼ Report Type</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>▣ Site ID</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>▣ Site Name</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>♟ Client</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>☷ State</span>
                                    <small>↕</small>
                                </th>

                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.map((item) => {
                                const isExpanded = expandedRows.includes(item.id);

                                return (
                                    <Fragment key={item.id}>
                                        <tr
                                            className={
                                                isExpanded
                                                    ? "visit-main-row expanded"
                                                    : "visit-main-row"
                                            }
                                        >
                                            <td className="photos-cell">
                                                <button
                                                    type="button"
                                                    className={
                                                        isExpanded
                                                            ? "photo-toggle-button expanded"
                                                            : "photo-toggle-button"
                                                    }
                                                    onClick={() => toggleRow(item.id)}
                                                    title={
                                                        isExpanded
                                                            ? "Hide details"
                                                            : "Show details"
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <Minus size={15} />
                                                    ) : (
                                                        <Plus size={15} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="photo-download-button"
                                                    title="Download Photos"
                                                >
                                                    <Download size={15} />
                                                </button>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="view-report-button"
                                                    title="View Report"
                                                >
                                                    <File size={17} />
                                                </button>
                                            </td>

                                            <td className="visit-name-cell">
                                                {item.name}
                                            </td>

                                            <td>{item.visitDate}</td>

                                            <td>{item.visitTime}</td>

                                            <td>{item.reportType}</td>

                                            <td>{item.siteId}</td>

                                            <td className="site-name-cell">
                                                {item.siteName}
                                            </td>

                                            <td className="client-cell">
                                                {item.client}
                                            </td>

                                            <td>{item.state}</td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="visit-details-row">
                                                <td colSpan="10">
                                                    <div className="visit-details">

                                                        <div className="visit-detail-item">
                                                            <Building2 size={17} />
                                                            <strong>Branch</strong>
                                                            <span>{item.branch}</span>
                                                        </div>

                                                        <div className="visit-detail-item">
                                                            <MapPin size={17} />
                                                            <strong>Region</strong>
                                                            <span>{item.region}</span>
                                                        </div>

                                                        <div className="visit-detail-item">
                                                            <Phone size={17} />
                                                            <strong>Contact</strong>
                                                            <span>{item.contact}</span>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}

                            {filteredData.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="visits-empty-state"
                                    >
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>

            </div>
        </div>
    );
};

export default LatestVisits;
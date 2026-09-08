import { Fragment, useMemo, useState } from "react";
import {
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

import "./VerifiedUnverifiedVisit.css";

const visitData = [
    {
        id: 1,
        name: "SANJIV KUMAR-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "17:24:22",
        version: "MSF-8",
        siteId: "32140",
        siteName: "SAMANA - NEAR OLD BUS STAND GL - BM 6952",
        client: "IIFL FINANCE LIMITED",
        state: "NA",
        contact: "9888096804",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
    },
    {
        id: 2,
        name: "VIKRAM NISCHAL-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "17:23:24",
        version: "MSF-8",
        siteId: "18623",
        siteName: "UCHA2251",
        client: "AXIS BANK LIMITED",
        state: "Punjab",
        contact: "9876007347",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
    },
    {
        id: 3,
        name: "VIKRAM NISCHAL-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "17:03:59",
        version: "MSF-8",
        siteId: "18600",
        siteName: "NURPUR JANUHAN2402",
        client: "AXIS BANK LIMITED",
        state: "Punjab",
        contact: "9876007347",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
    },
    {
        id: 4,
        name: "SANJIV KUMAR-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "16:55:16",
        version: "MSF-8",
        siteId: "32136",
        siteName: "SAMANA-SAMANA 2 GL-BM 8988",
        client: "IIFL FINANCE LIMITED",
        state: "Punjab",
        contact: "9888096804",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
    },
    {
        id: 5,
        name: "VIKRAM NISCHAL-LUDHIANA",
        visitDate: "24 Aug 2026",
        visitTime: "16:42:59",
        version: "MSF-8",
        siteId: "18561",
        siteName: "DHILWAN1478",
        client: "AXIS BANK LIMITED",
        state: "Punjab",
        contact: "9876007347",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
    },
];

const VerifiedUnverifiedVisit = () => {
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
                item.contact.includes(search) ||
                item.state.toLowerCase().includes(search)
        );
    }, [searchText]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="verified-visit-page">
            <div className="verified-visit-card">

                {/* =========================
            TABLE CONTROLS
        ========================= */}

                <div className="verified-table-controls">

                    <div className="verified-table-search">
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

                    <div className="verified-export-buttons">

                        <button
                            type="button"
                            className="verified-export-button"
                            title="Export Excel"
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            className="verified-export-button"
                            title="Export PDF"
                        >
                            <FileText size={17} />
                        </button>

                        <button
                            type="button"
                            className="verified-export-button"
                            title="Print"
                            onClick={handlePrint}
                        >
                            <Printer size={17} />
                        </button>

                    </div>

                </div>

                {/* =========================
            TABLE
        ========================= */}

                <div className="verified-table-wrapper">

                    <table className="verified-visit-table">

                        <thead>
                            <tr>

                                <th className="photos-column">
                                    <span>
                                        <Image size={15} />
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th className="view-column">
                                    <span>
                                        <File size={15} />
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>Name</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Visit Date
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Visit Time
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Version
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Site ID
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Site Name
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Client
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        State
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>
                                        Contact
                                    </span>
                                    <small>↕</small>
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {filteredData.map((item) => {
                                const isExpanded =
                                    expandedRows.includes(item.id);

                                return (
                                    <Fragment key={item.id}>

                                        {/* Main Row */}
                                        <tr
                                            className={
                                                isExpanded
                                                    ? "verified-main-row expanded"
                                                    : "verified-main-row"
                                            }
                                        >

                                            {/* Photos */}
                                            <td className="photos-column">

                                                <button
                                                    type="button"
                                                    className={
                                                        isExpanded
                                                            ? "verified-toggle expanded"
                                                            : "verified-toggle"
                                                    }
                                                    onClick={() =>
                                                        toggleRow(item.id)
                                                    }
                                                    title={
                                                        isExpanded
                                                            ? "Hide details"
                                                            : "Show details"
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <Minus size={14} />
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="verified-download"
                                                    title="Download Photos"
                                                >
                                                    <Download size={15} />
                                                </button>

                                            </td>

                                            {/* View */}
                                            <td className="view-column">

                                                <button
                                                    type="button"
                                                    className="verified-view-button"
                                                    title="View Visit"
                                                >
                                                    <File size={17} />
                                                </button>

                                            </td>

                                            {/* Name */}
                                            <td className="verified-name">
                                                {item.name}
                                            </td>

                                            {/* Visit Date */}
                                            <td>
                                                {item.visitDate}
                                            </td>

                                            {/* Visit Time */}
                                            <td>
                                                {item.visitTime}
                                            </td>

                                            {/* Version */}
                                            <td>
                                                {item.version}
                                            </td>

                                            {/* Site ID */}
                                            <td>
                                                {item.siteId}
                                            </td>

                                            {/* Site Name */}
                                            <td className="verified-site-name">
                                                {item.siteName}
                                            </td>

                                            {/* Client */}
                                            <td className="verified-client">
                                                {item.client}
                                            </td>

                                            {/* State */}
                                            <td>
                                                {item.state}
                                            </td>

                                            {/* Contact */}
                                            <td>
                                                {item.contact}
                                            </td>

                                        </tr>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <tr className="verified-details-row">
                                                <td colSpan="11">

                                                    <div className="verified-details">

                                                        <div className="verified-detail-item">
                                                            <Building2 size={16} />

                                                            <strong>
                                                                Branch
                                                            </strong>

                                                            <span>
                                                                {item.branch}
                                                            </span>
                                                        </div>

                                                        <div className="verified-detail-item">
                                                            <MapPin size={16} />

                                                            <strong>
                                                                Region
                                                            </strong>

                                                            <span>
                                                                {item.region}
                                                            </span>
                                                        </div>

                                                        <div className="verified-detail-item">
                                                            <Phone size={16} />

                                                            <strong>
                                                                Contact
                                                            </strong>

                                                            <span>
                                                                {item.contact}
                                                            </span>
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
                                        colSpan="11"
                                        className="verified-empty"
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

export default VerifiedUnverifiedVisit;
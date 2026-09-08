import { useMemo, useState } from "react";
import {
    Building2,
    CalendarDays,
    CheckCircle2,
    Edit,
    FileSpreadsheet,
    FileText,
    MapPin,
    Phone,
    Printer,
    RefreshCw,
    Search,
    UserRound,
    Users,
} from "lucide-react";

import "./Settings.css";

const usersData = [
    {
        id: 1,
        name: "AMIT SAINI",
        email: "NA",
        contact: "9988096904",
        role: "AO-OPERATION MANAGER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "23 Feb 2026 14:43",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "AMITSA2068",
    },
    {
        id: 2,
        name: "GURMEET SINGH",
        email: "NA",
        contact: "9915358659",
        role: "AO-AREA OFFICER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "23 Feb 2026 14:43",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "GURMEE1234",
    },
    {
        id: 3,
        name: "GURVINDER SINGH",
        email: "NA",
        contact: "8307744608",
        role: "AO-AREA OFFICER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "23 Feb 2026 14:43",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "GURVIN2153",
    },
    {
        id: 4,
        name: "SANJIV KUMAR",
        email: "NA",
        contact: "9888096804",
        role: "AO-AREA OFFICER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "23 Feb 2026 14:43",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "SANJIV1047",
    },
    {
        id: 5,
        name: "VIKRAM NISCHAL",
        email: "NA",
        contact: "9876007347",
        role: "AO-AREA OFFICER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "24 Feb 2026 10:15",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "VIKRAM7821",
    },
    {
        id: 6,
        name: "SUKHCHAIN SINGH",
        email: "NA",
        contact: "9914371469",
        role: "AO-AREA OFFICER",
        reportingPerson: "SANTOSH KUMAR SHARMA",
        addedOn: "24 Feb 2026 11:20",
        status: "INACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "SUKHCH4521",
    },
    {
        id: 7,
        name: "SANTOSH KUMAR SHARMA",
        email: "NA",
        contact: "7738117942",
        role: "SUPERVISOR",
        reportingPerson: "ADMIN",
        addedOn: "25 Feb 2026 09:30",
        status: "ACTIVE",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        empCode: "SANTOSH8891",
    },
];

const sitesData = [
    {
        id: 1,
        siteId: "18666",
        siteName: "TALWANDI BHAI 2832",
        client: "ICICI BANK LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        address: "TALWANDI BHAI, DIST FEROZPUR, PUNJAB",
        status: "ACTIVE",
    },
    {
        id: 2,
        siteId: "18585",
        siteName: "LOHGARH",
        client: "ICICI BANK LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        address: "LOHGARH, PUNJAB",
        status: "ACTIVE",
    },
    {
        id: 3,
        siteId: "18609",
        siteName: "RANIAN",
        client: "AXIS BANK LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        address: "RANIAN, PUNJAB",
        status: "ACTIVE",
    },
    {
        id: 4,
        siteId: "18662",
        siteName: "RAYYA",
        client: "AXIS BANK LIMITED",
        branch: "AMRITSAR",
        region: "CHANDIGARH",
        address: "RAYYA, PUNJAB",
        status: "ACTIVE",
    },
    {
        id: 5,
        siteId: "32140",
        siteName: "LUDHIANA MAIN",
        client: "IIFL FINANCE LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        address: "LUDHIANA, PUNJAB",
        status: "INACTIVE",
    },
];

const Settings = () => {
    const [activeTab, setActiveTab] = useState("users");
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState("10");

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return usersData;
        }

        return usersData.filter((user) =>
            [
                user.name,
                user.email,
                user.contact,
                user.role,
                user.reportingPerson,
                user.addedOn,
                user.status,
                user.branch,
                user.region,
                user.empCode,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [search]);

    const filteredSites = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return sitesData;
        }

        return sitesData.filter((site) =>
            [
                site.siteId,
                site.siteName,
                site.client,
                site.branch,
                site.region,
                site.address,
                site.status,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [search]);

    const currentData =
        activeTab === "users"
            ? filteredUsers
            : filteredSites;

    const handleSearch = () => {
        console.log("Searching:", search);
    };

    const handleClear = () => {
        setSearch("");
    };

    const handleAddUser = () => {
        console.log("ADD USER clicked");
    };

    const handleAddSite = () => {
        console.log("ADD SITE clicked");
    };

    const handleResetUser = (user) => {
        console.log("Reset user:", user);
    };

    const handleEditUser = (user) => {
        console.log("Edit user:", user);
    };

    const handleEditSite = (site) => {
        console.log("Edit site:", site);
    };

    const handleExcel = () => {
        console.log(`Export ${activeTab} as Excel`);
    };

    const handlePdf = () => {
        console.log(`Export ${activeTab} as PDF`);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearch("");
    };

    return (
        <div className="settings-page">

            <section className="settings-card">

                {/* =========================
            TABS
        ========================= */}

                <div className="settings-tabs">

                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "users" ? "active" : ""
                            }`}
                        onClick={() => handleTabChange("users")}
                    >
                        <Users size={17} />
                        <span>Users</span>
                    </button>

                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "sites" ? "active" : ""
                            }`}
                        onClick={() => handleTabChange("sites")}
                    >
                        <Building2 size={17} />
                        <span>Sites</span>
                    </button>

                </div>

                {/* =========================
            ADD BUTTON
        ========================= */}

                <div className="settings-add-row">

                    {activeTab === "users" ? (
                        <button
                            type="button"
                            className="settings-add-button"
                            onClick={handleAddUser}
                        >
                            <Users size={16} />
                            ADD USER
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="settings-add-button"
                            onClick={handleAddSite}
                        >
                            <Building2 size={16} />
                            ADD SITE
                        </button>
                    )}

                </div>

                {/* =========================
            SEARCH
        ========================= */}

                <div className="settings-search-area">

                    <div className="settings-search-group">

                        <div className="settings-search-input">

                            <input
                                type="text"
                                value={search}
                                placeholder={
                                    activeTab === "users"
                                        ? "Search by Emp ID / Phone"
                                        : "Search by Site ID / Site Name"
                                }
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                            />

                        </div>

                        <button
                            type="button"
                            className="settings-search-button"
                            onClick={handleSearch}
                        >
                            <Search size={15} />
                            SEARCH
                        </button>

                        <button
                            type="button"
                            className="settings-clear-button"
                            onClick={handleClear}
                        >
                            CLEAR
                        </button>

                    </div>

                </div>

                {/* =========================
            EXPORT BAR
        ========================= */}

                <div className="settings-toolbar">

                    <div className="settings-result-count">
                        {currentData.length} entries
                    </div>

                    <div className="settings-export-buttons">

                        <button
                            type="button"
                            title="Export Excel"
                            onClick={handleExcel}
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            title="Export PDF"
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

                {/* =========================
            USERS TABLE
        ========================= */}

                {activeTab === "users" && (
                    <div className="settings-table-wrapper">

                        <table className="settings-table users-table">

                            <thead>
                                <tr>

                                    <th>
                                        <UserRound size={14} />
                                        Name
                                    </th>

                                    <th>
                                        <FileText size={14} />
                                        Email
                                    </th>

                                    <th>
                                        <Phone size={14} />
                                        Contact
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        <UserRound size={14} />
                                        Reporting Person
                                    </th>

                                    <th>
                                        <CalendarDays size={14} />
                                        Added On
                                    </th>

                                    <th>
                                        <CheckCircle2 size={14} />
                                        Status
                                    </th>

                                    <th>
                                        <Building2 size={14} />
                                        Branch
                                    </th>

                                    <th>
                                        <MapPin size={14} />
                                        Region
                                    </th>

                                    <th>
                                        Emp Code
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>

                                        <td className="settings-name">
                                            {user.name}
                                        </td>

                                        <td>
                                            {user.email}
                                        </td>

                                        <td>
                                            {user.contact}
                                        </td>

                                        <td>
                                            {user.role}
                                        </td>

                                        <td>
                                            {user.reportingPerson}
                                        </td>

                                        <td>
                                            {user.addedOn}
                                        </td>

                                        <td>
                                            <span
                                                className={`settings-status ${user.status === "ACTIVE"
                                                        ? "active"
                                                        : "inactive"
                                                    }`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>

                                        <td>
                                            {user.branch}
                                        </td>

                                        <td>
                                            {user.region}
                                        </td>

                                        <td>
                                            {user.empCode}
                                        </td>

                                        <td>

                                            <div className="settings-row-actions">

                                                <button
                                                    type="button"
                                                    className="settings-action-button"
                                                    title="Reset User"
                                                    onClick={() =>
                                                        handleResetUser(user)
                                                    }
                                                >
                                                    <RefreshCw size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="settings-action-button"
                                                    title="Edit User"
                                                    onClick={() =>
                                                        handleEditUser(user)
                                                    }
                                                >
                                                    <Edit size={15} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="11"
                                            className="settings-empty"
                                        >
                                            No matching records found
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

                {/* =========================
            SITES TABLE
        ========================= */}

                {activeTab === "sites" && (
                    <div className="settings-table-wrapper">

                        <table className="settings-table sites-table">

                            <thead>
                                <tr>

                                    <th>
                                        Site ID
                                    </th>

                                    <th>
                                        <Building2 size={14} />
                                        Site Name
                                    </th>

                                    <th>
                                        Client
                                    </th>

                                    <th>
                                        Branch
                                    </th>

                                    <th>
                                        <MapPin size={14} />
                                        Region
                                    </th>

                                    <th>
                                        Address
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredSites.map((site) => (
                                    <tr key={site.id}>

                                        <td>
                                            {site.siteId}
                                        </td>

                                        <td className="settings-name">
                                            {site.siteName}
                                        </td>

                                        <td>
                                            {site.client}
                                        </td>

                                        <td>
                                            {site.branch}
                                        </td>

                                        <td>
                                            {site.region}
                                        </td>

                                        <td className="site-address">
                                            {site.address}
                                        </td>

                                        <td>
                                            <span
                                                className={`settings-status ${site.status === "ACTIVE"
                                                        ? "active"
                                                        : "inactive"
                                                    }`}
                                            >
                                                {site.status}
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="settings-action-button"
                                                title="Edit Site"
                                                onClick={() =>
                                                    handleEditSite(site)
                                                }
                                            >
                                                <Edit size={15} />
                                            </button>

                                        </td>

                                    </tr>
                                ))}

                                {filteredSites.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="settings-empty"
                                        >
                                            No matching records found
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

                {/* =========================
            FOOTER
        ========================= */}

                <div className="settings-footer">

                    <div className="settings-footer-left">
                        Showing{" "}
                        <strong>
                            {currentData.length === 0 ? 0 : 1}
                        </strong>{" "}
                        to{" "}
                        <strong>
                            {currentData.length}
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {currentData.length}
                        </strong>{" "}
                        entries
                    </div>

                    <div className="settings-show-entries">

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

                    <div className="settings-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            className="active"
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

export default Settings;
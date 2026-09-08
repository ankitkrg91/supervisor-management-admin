import { useMemo, useState } from "react";
import {
    CalendarDays,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    File,
} from "lucide-react";

import "./LatestCheckIn.css";

const checkInData = [
    {
        id: 1,
        name: "SANTOSH KUMAR SHARMA-LUDHIANA",
        workingHours: "NA",
        checkInDate: "24 Aug 2026",
        checkInTime: "11:39",
        checkOutDate: "NA",
        checkOutTime: "NA",
        distance: "0 KM",
        role: "AO-AREA OFFICER",
    },
    {
        id: 2,
        name: "GURVINDER SINGH-LUDHIANA",
        workingHours: "NA",
        checkInDate: "24 Aug 2026",
        checkInTime: "10:43",
        checkOutDate: "NA",
        checkOutTime: "NA",
        distance: "45.32 KM",
        role: "AO-AREA OFFICER",
    },
    {
        id: 3,
        name: "VIKRAM NISCHAL-LUDHIANA",
        workingHours: "NA",
        checkInDate: "24 Aug 2026",
        checkInTime: "09:54",
        checkOutDate: "NA",
        checkOutTime: "NA",
        distance: "82.58 KM",
        role: "AO-OPERATION MANAGER",
    },
    {
        id: 4,
        name: "GURMEET SINGH-LUDHIANA",
        workingHours: "NA",
        checkInDate: "24 Aug 2026",
        checkInTime: "09:36",
        checkOutDate: "NA",
        checkOutTime: "NA",
        distance: "1.55 KM",
        role: "AO-AREA OFFICER",
    },
    {
        id: 5,
        name: "SANTOSH KUMAR SHARMA-LUDHIANA",
        workingHours: "2H : 25M",
        checkInDate: "24 Aug 2026",
        checkInTime: "09:13",
        checkOutDate: "24 Aug 2026",
        checkOutTime: "11:38",
        distance: "8.46 KM",
        role: "AO-AREA OFFICER",
    },
    {
        id: 6,
        name: "AMIT SAINI-LUDHIANA",
        workingHours: "3H : 10M",
        checkInDate: "24 Aug 2026",
        checkInTime: "08:45",
        checkOutDate: "24 Aug 2026",
        checkOutTime: "11:55",
        distance: "12.20 KM",
        role: "AO-OPERATION MANAGER",
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

const LatestCheckIn = () => {
    const [fromDate, setFromDate] = useState("2026-08-24");
    const [toDate, setToDate] = useState("2026-08-24");
    const [selectedRole, setSelectedRole] = useState("ALL");
    const [searchText, setSearchText] = useState("");

    const filteredData = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        return checkInData.filter((item) => {
            const matchesRole =
                selectedRole === "ALL" ||
                item.role === selectedRole;

            const matchesSearch =
                !search ||
                item.name.toLowerCase().includes(search) ||
                item.role.toLowerCase().includes(search);

            return matchesRole && matchesSearch;
        });
    }, [selectedRole, searchText]);

    const handleSearch = () => {
        // Filtering is already handled automatically.
        // This button is kept to match the original interface.
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="latest-checkin-page">
            <div className="latest-checkin-card">

                {/* Filter Section */}
                <div className="checkin-filter-section">

                    <div className="checkin-filter-row">

                        <div className="date-filter-group">
                            <label>From Date :</label>

                            <div className="date-input-wrapper">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) =>
                                        setFromDate(event.target.value)
                                    }
                                />

                                <span className="date-icon">
                                    <CalendarDays size={18} />
                                </span>
                            </div>
                        </div>

                        <div className="date-filter-group">
                            <label>To Date :</label>

                            <div className="date-input-wrapper">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) =>
                                        setToDate(event.target.value)
                                    }
                                />

                                <span className="date-icon">
                                    <CalendarDays size={18} />
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="filter-button"
                            aria-label="Filter"
                        >
                            <span>▼</span>
                        </button>

                    </div>

                    <div className="role-filter-row">

                        <div className="role-filter-group">
                            <label>Select Role:</label>

                            <select
                                value={selectedRole}
                                onChange={(event) =>
                                    setSelectedRole(event.target.value)
                                }
                            >
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="search-button"
                            onClick={handleSearch}
                        >
                            SEARCH
                        </button>

                    </div>

                </div>

                {/* Table Controls */}
                <div className="table-controls">

                    <div className="table-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(event.target.value)
                            }
                        />

                        <Search size={20} />
                    </div>

                    <div className="export-buttons">

                        <button
                            type="button"
                            title="Export Excel"
                            className="export-button"
                        >
                            <FileSpreadsheet size={18} />
                        </button>

                        <button
                            type="button"
                            title="Export PDF"
                            className="export-button"
                        >
                            <FileText size={18} />
                        </button>

                        <button
                            type="button"
                            title="Print"
                            className="export-button"
                            onClick={handlePrint}
                        >
                            <Printer size={18} />
                        </button>

                    </div>

                </div>

                {/* Table */}
                <div className="checkin-table-wrapper">
                    <table className="checkin-table">

                        <thead>
                            <tr>
                                <th className="view-column">
                                    <span>
                                        <File size={16} />
                                        View
                                    </span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>♟ Name</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>◷ Working Hours</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>▣ Check-In Date</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>◷ Check-In Time</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>▣ Check-Out Date</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>◷ Check-Out Time</span>
                                    <small>↕</small>
                                </th>

                                <th>
                                    <span>⚑ Distance Travelled</span>
                                    <small>↕</small>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id}>

                                        <td className="view-column">
                                            <button
                                                type="button"
                                                className="view-button"
                                                title={`View ${item.name}`}
                                            >
                                                <File size={16} />
                                            </button>
                                        </td>

                                        <td className="name-cell">
                                            {item.name}
                                        </td>

                                        <td>
                                            {item.workingHours}
                                        </td>

                                        <td>
                                            {item.checkInDate}
                                        </td>

                                        <td>
                                            {item.checkInTime}
                                        </td>

                                        <td>
                                            {item.checkOutDate}
                                        </td>

                                        <td>
                                            {item.checkOutTime}
                                        </td>

                                        <td>
                                            {item.distance}
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="empty-state"
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

export default LatestCheckIn;
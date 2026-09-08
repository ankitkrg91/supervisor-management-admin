import {
    Smartphone,
    WifiOff,
    BatteryLow,
    LogIn,
    Map,
    User,
    Users,
    Phone,
    Battery,
    Clock,
    FileSpreadsheet,
    FileText,
    Printer,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./Offline.css";

const summaryCards = [
    {
        title: "Online",
        value: 6,
        type: "online",
        icon: Smartphone,
        path: "/field-tracker/online",
    },
    {
        title: "Offline",
        value: 3,
        type: "offline",
        icon: WifiOff,
        path: "/field-tracker/offline",
    },
    {
        title: "Battery Low",
        value: 1,
        type: "battery",
        icon: BatteryLow,
        path: "/field-tracker/battery-low",
    },
    {
        title: "Not Checked-In",
        value: 1,
        type: "not-checked",
        icon: LogIn,
        path: "/field-tracker/not-checked-in",
    },
];

/*
  Offline field-force data.

  Currently the screenshot shows Offline = 0,
  so the list is intentionally empty.

  Backend data will be connected later.
*/

const fieldForceData = [
    {
        id: 1,
        name: "RAJESH KUMAR-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9876543210",
        battery: 65,
        online: false,
        checkedIn: true,
        lastSeen: "24 Aug 2026 17:25",
    },
    {
        id: 2,
        name: "MANDEEP SINGH-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9812345678",
        battery: 15,
        online: false,
        checkedIn: true,
        lastSeen: "24 Aug 2026 17:18",
    },
    {
        id: 3,
        name: "ROHIT SHARMA-LUDHIANA",
        role: "SUPERVISOR",
        contact: "9898765432",
        battery: 42,
        online: false,
        checkedIn: true,
        lastSeen: "24 Aug 2026 16:55",
    },
];

const offlineData = fieldForceData.filter(
    (person) => person.online === false
);

const Offline = () => {
    return (
        <div className="offline-page">
            {/* =========================
          SUMMARY CARDS
      ========================= */}

            <div className="offline-summary">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.title}
                            to={card.path}
                            className={`offline-card-link ${card.type === "offline"
                                ? "card-current"
                                : ""
                                }`}
                        >
                            <div
                                className={`offline-summary-card offline-summary-${card.type}`}
                            >
                                <div className="offline-card-content">
                                    <span className="offline-card-title">
                                        {card.title}
                                    </span>

                                    <span className="offline-card-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="offline-card-icon">
                                    <Icon size={22} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* =========================
          TABLE
      ========================= */}

            <section className="offline-table-card">
                <div className="offline-toolbar">
                    <div className="offline-search">
                        <label htmlFor="offline-search">
                            Search:
                        </label>

                        <input
                            id="offline-search"
                            type="text"
                        />
                    </div>

                    <div className="offline-export-actions">
                        <button type="button">
                            <FileSpreadsheet size={16} />
                            EXCEL
                        </button>

                        <button type="button">
                            <FileText size={16} />
                            PDF
                        </button>

                        <button type="button">
                            <Printer size={16} />
                            PRINT
                        </button>
                    </div>
                </div>

                <div className="offline-table-wrapper">
                    <table className="offline-table">
                        <thead>
                            <tr>
                                <th>
                                    <span>
                                        <Map size={17} />
                                        Map
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <User size={16} />
                                        Name
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Users size={17} />
                                        Role
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Phone size={16} />
                                        Contact
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Battery size={17} />
                                        Battery
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Clock size={16} />
                                        Last Seen
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {offlineData.length > 0 ? (
                                offlineData.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <button
                                                type="button"
                                                className="offline-map-button"
                                            >
                                                <Map size={18} />
                                            </button>
                                        </td>

                                        <td>{person.name}</td>
                                        <td>{person.role}</td>
                                        <td>{person.contact}</td>
                                        <td>{person.battery}%</td>
                                        <td>{person.lastSeen}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="offline-empty"
                                    >
                                        No offline field force found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="offline-table-footer">
                    <span>
                        Showing 0 to 0 of 0 entries
                    </span>

                    <div className="offline-pagination">
                        <button type="button" disabled>
                            Previous
                        </button>

                        <button
                            type="button"
                            className="offline-pagination-active"
                        >
                            1
                        </button>

                        <button type="button" disabled>
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Offline;
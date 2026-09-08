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

import "./NotCheckedIn.css";

const fieldForceData = [
    {
        id: 1,
        name: "SUNIL KUMAR-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9876501234",
        battery: 72,
        online: true,
        checkedIn: false,
        lastSeen: "24 Aug 2026 17:40",
    },
];

const notCheckedInData = fieldForceData.filter(
    (person) => person.checkedIn === false
);

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
        value: notCheckedInData.length,
        type: "not-checked",
        icon: LogIn,
        path: "/field-tracker/not-checked-in",
    },
];

const NotCheckedIn = () => {
    return (
        <div className="not-checked-in-page">
            {/* =========================
          SUMMARY CARDS
      ========================= */}

            <div className="not-checked-in-summary">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.title}
                            to={card.path}
                            className={`not-checked-in-card-link ${card.type === "not-checked"
                                    ? "card-current"
                                    : ""
                                }`}
                        >
                            <div
                                className={`not-checked-in-summary-card not-checked-in-summary-${card.type}`}
                            >
                                <div className="not-checked-in-card-content">
                                    <span className="not-checked-in-card-title">
                                        {card.title}
                                    </span>

                                    <span className="not-checked-in-card-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="not-checked-in-card-icon">
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

            <section className="not-checked-in-table-card">
                <div className="not-checked-in-toolbar">
                    <div className="not-checked-in-search">
                        <label htmlFor="not-checked-in-search">
                            Search:
                        </label>

                        <input
                            id="not-checked-in-search"
                            type="text"
                        />
                    </div>

                    <div className="not-checked-in-export-actions">
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

                <div className="not-checked-in-table-wrapper">
                    <table className="not-checked-in-table">
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
                            {notCheckedInData.length > 0 ? (
                                notCheckedInData.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <button
                                                type="button"
                                                className="not-checked-in-map-button"
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
                                        className="not-checked-in-empty"
                                    >
                                        No field force found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="not-checked-in-table-footer">
                    <span>
                        Showing {notCheckedInData.length > 0 ? 1 : 0} to{" "}
                        {notCheckedInData.length} of{" "}
                        {notCheckedInData.length} entries
                    </span>

                    <div className="not-checked-in-pagination">
                        <button type="button" disabled>
                            Previous
                        </button>

                        <button
                            type="button"
                            className="not-checked-in-pagination-active"
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

export default NotCheckedIn;
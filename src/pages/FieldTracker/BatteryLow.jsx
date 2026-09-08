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

import "./BatteryLow.css";

/*
  Battery-low field-force data.

  Currently the dashboard shows Battery Low = 0,
  so the list is intentionally empty.

  Backend data will be connected later.
*/

const fieldForceData = [
    {
        id: 1,
        name: "AMIT SAINI-LUDHIANA",
        role: "AO-OPERATION MANAGER",
        contact: "9988096904",
        battery: 55,
        online: true,
        lastSeen: "24 Aug 2026 17:37",
    },
    {
        id: 2,
        name: "GURMEET SINGH-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9915358659",
        battery: 18,
        online: true,
        lastSeen: "24 Aug 2026 17:38",
    },
    {
        id: 3,
        name: "GURVINDER SINGH-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "8307744608",
        battery: 10,
        online: true,
        lastSeen: "24 Aug 2026 17:40",
    },
    {
        id: 4,
        name: "SANJIV KUMAR-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9888096804",
        battery: 38,
        online: true,
        lastSeen: "24 Aug 2026 17:39",
    },
];

const BATTERY_LOW_THRESHOLD = 20;

const batteryLowData = fieldForceData.filter(
    (person) => person.battery <= BATTERY_LOW_THRESHOLD
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
        value: batteryLowData.length,
        type: "offline",
        icon: WifiOff,
        path: "/field-tracker/offline",
    },
    {
        title: "Battery Low",
        value: batteryLowData.length,
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

const BatteryLowPage = () => {
    return (
        <div className="battery-low-page">
            {/* =========================
          SUMMARY CARDS
      ========================= */}

            <div className="battery-low-summary">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.title}
                            to={card.path}
                            className={`battery-low-card-link ${card.type === "battery"
                                ? "card-current"
                                : ""
                                }`}
                        >
                            <div
                                className={`battery-low-summary-card battery-low-summary-${card.type}`}
                            >
                                <div className="battery-low-card-content">
                                    <span className="battery-low-card-title">
                                        {card.title}
                                    </span>

                                    <span className="battery-low-card-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="battery-low-card-icon">
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

            <section className="battery-low-table-card">
                <div className="battery-low-toolbar">
                    <div className="battery-low-search">
                        <label htmlFor="battery-low-search">
                            Search:
                        </label>

                        <input
                            id="battery-low-search"
                            type="text"
                        />
                    </div>

                    <div className="battery-low-export-actions">
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

                <div className="battery-low-table-wrapper">
                    <table className="battery-low-table">
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
                            {batteryLowData.length > 0 ? (
                                batteryLowData.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <button
                                                type="button"
                                                className="battery-low-map-button"
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
                                        className="battery-low-empty"
                                    >
                                        No battery low field force found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="battery-low-table-footer">
                    <span>
                        Showing 0 to 0 of 0 entries
                    </span>

                    <div className="battery-low-pagination">
                        <button type="button" disabled>
                            Previous
                        </button>

                        <button
                            type="button"
                            className="battery-low-pagination-active"
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

export default BatteryLowPage;
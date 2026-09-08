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

import "./Online.css";

const fieldForceData = [
    {
        id: 1,
        name: "AMIT SAINI-LUDHIANA",
        role: "AO-OPERATION MANAGER",
        contact: "9988096904",
        battery: "55%",
        lastSeen: "24 Aug 2026 17:37",
    },
    {
        id: 2,
        name: "GURMEET SINGH-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9915358659",
        battery: "40%",
        lastSeen: "24 Aug 2026 17:38",
    },
    {
        id: 3,
        name: "GURVINDER SINGH-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "8307744608",
        battery: "38%",
        lastSeen: "24 Aug 2026 17:40",
    },
    {
        id: 4,
        name: "SANJIV KUMAR-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9888096804",
        battery: "38%",
        lastSeen: "24 Aug 2026 17:39",
    },
    {
        id: 5,
        name: "VIKRAM NISCHAL-LUDHIANA",
        role: "AO-AREA OFFICER",
        contact: "9876007347",
        battery: "64%",
        lastSeen: "24 Aug 2026 17:40",
    },
    {
        id: 6,
        name: "SANTOSH KUMAR SHARMA-LUDHIANA",
        role: "BH",
        contact: "7738117942",
        battery: "29%",
        lastSeen: "24 Aug 2026 17:35",
    },
];

const summaryCards = [
    {
        title: "Online",
        value: 6,
        icon: Smartphone,
        type: "online",
        path: "/field-tracker/online",
    },
    {
        title: "Offline",
        value: 3,
        icon: WifiOff,
        type: "offline",
        path: "/field-tracker/offline",
    },
    {
        title: "Battery Low",
        value: 1,
        icon: BatteryLow,
        type: "battery",
        path: "/field-tracker/battery-low",
    },
    {
        title: "Not Checked-In",
        value: 1,
        icon: LogIn,
        type: "not-checked",
        path: "/field-tracker/not-checked-in",
    },
];

const Online = () => {
    return (
        <div className="online-page">
            <div className="tracker-summary">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.title}
                            to={card.path}
                            className="tracker-card-link"
                        >
                            <div
                                className={`tracker-card tracker-card-${card.type}`}
                            >
                                <div className="tracker-card-content">
                                    <span className="tracker-card-title">
                                        {card.title}
                                    </span>

                                    <span className="tracker-card-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="tracker-card-icon">
                                    <Icon size={22} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <section className="online-table-card">
                <div className="table-toolbar">
                    <div className="table-search">
                        <label htmlFor="field-force-search">
                            Search:
                        </label>

                        <input
                            id="field-force-search"
                            type="text"
                            placeholder=""
                        />
                    </div>

                    <div className="export-actions">
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

                <div className="field-force-table-wrapper">
                    <table className="field-force-table">
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
                            {fieldForceData.map((person) => (
                                <tr key={person.id}>
                                    <td>
                                        <button
                                            type="button"
                                            className="map-button"
                                            title={`View ${person.name} on map`}
                                        >
                                            <Map size={18} />
                                        </button>
                                    </td>

                                    <td>{person.name}</td>

                                    <td>{person.role}</td>

                                    <td>{person.contact}</td>

                                    <td>{person.battery}</td>

                                    <td>{person.lastSeen}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>
                        Showing 1 to {fieldForceData.length} of{" "}
                        {fieldForceData.length} entries
                    </span>

                    <div className="pagination">
                        <button type="button" disabled>
                            Previous
                        </button>

                        <button
                            type="button"
                            className="pagination-active"
                        >
                            1
                        </button>

                        <button type="button">Next</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Online;
import { useMemo, useState } from "react";
import {
    Filter,
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    UserRound,
    Phone,
    Map,
} from "lucide-react";
import "./DistanceReport.css";

const distanceData = [
    {
        id: 1,
        name: "SANJIV KUMAR -LUDHIANA",
        contact: "9888096804",
        distance: 114.79,
    },
    {
        id: 2,
        name: "VIKRAM NISCHAL -LUDHIANA",
        contact: "9876007347",
        distance: 82.58,
    },
    {
        id: 3,
        name: "AMIT SAINI -LUDHIANA",
        contact: "9988096904",
        distance: 64.93,
    },
    {
        id: 4,
        name: "SUKHCHAIN SINGH -LUDHIANA",
        contact: "9914371469",
        distance: 64.03,
    },
    {
        id: 5,
        name: "GURVINDER SINGH -LUDHIANA",
        contact: "8307744608",
        distance: 45.32,
    },
    {
        id: 6,
        name: "SANTOSH KUMAR SHARMA -LUDHIANA",
        contact: "7738117942",
        distance: 8.46,
    },
    {
        id: 7,
        name: "GURMEET SINGH -LUDHIANA",
        contact: "9915358659",
        distance: 1.55,
    },
];

const DistanceReport = () => {
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [pageSize, setPageSize] = useState("10");

    const filteredData = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) {
            return distanceData;
        }

        return distanceData.filter((person) =>
            `${person.name} ${person.contact} ${person.distance}`
                .toLowerCase()
                .includes(query)
        );
    }, [search]);

    const handleExcel = () => {
        console.log("Export Distance Report to Excel");
    };

    const handlePdf = () => {
        console.log("Export Distance Report to PDF");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="distance-report-page">
            <section className="distance-report-card">

                {/* TOP FILTER */}

                <div className="distance-filter-row">
                    <button
                        type="button"
                        className={`distance-filter-button ${showFilters ? "active" : ""
                            }`}
                        onClick={() =>
                            setShowFilters(!showFilters)
                        }
                        title="Filter"
                    >
                        <Filter size={17} />
                    </button>
                </div>

                {/* FILTER PANEL */}

                {showFilters && (
                    <div className="distance-filter-panel">

                        <div className="distance-filter-field">
                            <label>From Date</label>

                            <input type="date" />
                        </div>

                        <div className="distance-filter-field">
                            <label>To Date</label>

                            <input type="date" />
                        </div>

                        <div className="distance-filter-field">
                            <label>Region</label>

                            <select defaultValue="">
                                <option value="">
                                    All Regions
                                </option>
                                <option value="Punjab">
                                    Punjab
                                </option>
                                <option value="Chandigarh">
                                    Chandigarh
                                </option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="distance-apply-button"
                        >
                            APPLY
                        </button>

                    </div>
                )}

                {/* TOOLBAR */}

                <div className="distance-toolbar">

                    <div className="distance-search">
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

                    <div className="distance-export-buttons">

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

                <div className="distance-table-wrapper">
                    <table className="distance-table">

                        <thead>
                            <tr>
                                <th>
                                    <span>
                                        <UserRound size={14} />
                                        Name
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Phone size={14} />
                                        Contact
                                    </span>
                                </th>

                                <th>
                                    <span>
                                        <Map size={14} />
                                        Distance In KM
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.map((person) => (
                                <tr key={person.id}>

                                    <td className="distance-name">
                                        {person.name}
                                    </td>

                                    <td>
                                        {person.contact}
                                    </td>

                                    <td className="distance-value">
                                        {person.distance.toFixed(2)}
                                    </td>

                                </tr>
                            ))}

                            {filteredData.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="distance-empty"
                                    >
                                        No matching records found
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>

                {/* FOOTER */}

                <div className="distance-footer">

                    <span>
                        Showing{" "}
                        {filteredData.length === 0
                            ? 0
                            : 1}{" "}
                        to {filteredData.length} of{" "}
                        {filteredData.length} entries
                    </span>

                    <div className="distance-show">

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

                    <div className="distance-pagination">

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

export default DistanceReport;
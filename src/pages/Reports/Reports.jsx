import { useMemo, useState } from "react";
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileSpreadsheet,
    FileText,
    MapPin,
    Printer,
    RotateCcw,
    Search,
    Users,
    XCircle,
} from "lucide-react";
import "./Reports.css";

const reportData = {
    "Task Report": [
        {
            id: 1,
            date: "24/08/2026",
            user: "AMIT SAINI",
            client: "ICICI BANK LIMITED",
            site: "TALWANDI BHAI 2832",
            type: "MSF",
            status: "Completed",
            checkIn: "09:12 AM",
            checkOut: "10:05 AM",
            distance: "12.46",
        },
        {
            id: 2,
            date: "24/08/2026",
            user: "GURMEET SINGH",
            client: "AXIS BANK LIMITED",
            site: "LOHGARH",
            type: "MFM",
            status: "Completed",
            checkIn: "10:30 AM",
            checkOut: "11:20 AM",
            distance: "18.32",
        },
        {
            id: 3,
            date: "24/08/2026",
            user: "SUKHCHAIN SINGH",
            client: "ICICI BANK LIMITED",
            site: "RANIAN",
            type: "Inspection",
            status: "Pending",
            checkIn: "-",
            checkOut: "-",
            distance: "0.00",
        },
        {
            id: 4,
            date: "23/08/2026",
            user: "VIKRAM NISCHAL",
            client: "HDFC BANK LIMITED",
            site: "RAYYA",
            type: "Night Visit",
            status: "Completed",
            checkIn: "07:15 PM",
            checkOut: "08:05 PM",
            distance: "22.18",
        },
        {
            id: 5,
            date: "23/08/2026",
            user: "SANJIV KUMAR",
            client: "ICICI BANK LIMITED",
            site: "LUDHIANA MAIN",
            type: "Audit",
            status: "Missed",
            checkIn: "-",
            checkOut: "-",
            distance: "0.00",
        },
        {
            id: 6,
            date: "22/08/2026",
            user: "GURVINDER SINGH",
            client: "IIFL FINANCE LIMITED",
            site: "FEROZPUR",
            type: "Other Visit",
            status: "Completed",
            checkIn: "11:10 AM",
            checkOut: "12:30 PM",
            distance: "14.76",
        },
        {
            id: 7,
            date: "22/08/2026",
            user: "SANTOSH SHARMA",
            client: "AXIS BANK LIMITED",
            site: "MOGA",
            type: "MSF",
            status: "Completed",
            checkIn: "09:05 AM",
            checkOut: "10:15 AM",
            distance: "16.24",
        },
        {
            id: 8,
            date: "21/08/2026",
            user: "AMIT SAINI",
            client: "ICICI BANK LIMITED",
            site: "JALANDHAR",
            type: "Site Visit",
            status: "Completed",
            checkIn: "10:20 AM",
            checkOut: "11:10 AM",
            distance: "26.48",
        },
        {
            id: 9,
            date: "21/08/2026",
            user: "GURMEET SINGH",
            client: "HDFC BANK LIMITED",
            site: "CHANDIGARH",
            type: "Inspection",
            status: "Pending",
            checkIn: "-",
            checkOut: "-",
            distance: "0.00",
        },
        {
            id: 10,
            date: "20/08/2026",
            user: "VIKRAM NISCHAL",
            client: "KOTAK MAHINDRA",
            site: "PATIALA",
            type: "Audit",
            status: "Completed",
            checkIn: "08:45 AM",
            checkOut: "09:50 AM",
            distance: "19.36",
        },
    ],

    "Visit Report": [
        {
            id: 11,
            date: "24/08/2026",
            user: "SANJIV KUMAR",
            client: "ICICI BANK LIMITED",
            site: "TALWANDI BHAI 2832",
            type: "MSF",
            status: "Verified",
            checkIn: "09:12 AM",
            checkOut: "10:05 AM",
            distance: "12.46",
        },
        {
            id: 12,
            date: "24/08/2026",
            user: "GURVINDER SINGH",
            client: "IIFL FINANCE LIMITED",
            site: "FEROZPUR",
            type: "Other Visit",
            status: "Verified",
            checkIn: "11:10 AM",
            checkOut: "12:30 PM",
            distance: "14.76",
        },
        {
            id: 13,
            date: "23/08/2026",
            user: "VIKRAM NISCHAL",
            client: "AXIS BANK LIMITED",
            site: "RAYYA",
            type: "Night Visit",
            status: "Unverified",
            checkIn: "07:15 PM",
            checkOut: "08:05 PM",
            distance: "22.18",
        },
    ],

    "Audit Report": [
        {
            id: 14,
            date: "24/08/2026",
            user: "SANJIV KUMAR",
            client: "ICICI BANK LIMITED",
            site: "TALWANDI BHAI 2832",
            type: "MSF Audit",
            status: "Verified",
            checkIn: "09:12 AM",
            checkOut: "10:05 AM",
            distance: "12.46",
        },
        {
            id: 15,
            date: "23/08/2026",
            user: "GURMEET SINGH",
            client: "AXIS BANK LIMITED",
            site: "LOHGARH",
            type: "MFM Audit",
            status: "Verified",
            checkIn: "10:30 AM",
            checkOut: "11:20 AM",
            distance: "18.32",
        },
        {
            id: 16,
            date: "23/08/2026",
            user: "SUKHCHAIN SINGH",
            client: "ICICI BANK LIMITED",
            site: "RANIAN",
            type: "Inspection",
            status: "Pending",
            checkIn: "-",
            checkOut: "-",
            distance: "0.00",
        },
    ],

    "Check-In / Check-Out Report": [
        {
            id: 17,
            date: "24/08/2026",
            user: "SANJIV KUMAR",
            client: "ICICI BANK LIMITED",
            site: "LUDHIANA",
            type: "Field Visit",
            status: "Present",
            checkIn: "09:12 AM",
            checkOut: "05:42 PM",
            distance: "114.79",
        },
        {
            id: 18,
            date: "24/08/2026",
            user: "VIKRAM NISCHAL",
            client: "AXIS BANK LIMITED",
            site: "LUDHIANA",
            type: "Field Visit",
            status: "Present",
            checkIn: "09:25 AM",
            checkOut: "05:15 PM",
            distance: "82.58",
        },
        {
            id: 19,
            date: "24/08/2026",
            user: "GURVINDER SINGH",
            client: "IIFL FINANCE LIMITED",
            site: "LUDHIANA",
            type: "Field Visit",
            status: "Present",
            checkIn: "09:40 AM",
            checkOut: "05:30 PM",
            distance: "45.32",
        },
    ],

    "Field Force Performance": [
        {
            id: 20,
            date: "24/08/2026",
            user: "SANJIV KUMAR",
            client: "All Clients",
            site: "LUDHIANA",
            type: "30 Tasks",
            status: "93% Complete",
            checkIn: "09:12 AM",
            checkOut: "05:42 PM",
            distance: "114.79",
        },
        {
            id: 21,
            date: "24/08/2026",
            user: "VIKRAM NISCHAL",
            client: "All Clients",
            site: "LUDHIANA",
            type: "22 Tasks",
            status: "91% Complete",
            checkIn: "09:25 AM",
            checkOut: "05:15 PM",
            distance: "82.58",
        },
        {
            id: 22,
            date: "24/08/2026",
            user: "GURVINDER SINGH",
            client: "All Clients",
            site: "LUDHIANA",
            type: "20 Tasks",
            status: "90% Complete",
            checkIn: "09:40 AM",
            checkOut: "05:30 PM",
            distance: "45.32",
        },
    ],

    "Distance Report": [
        {
            id: 23,
            date: "24/08/2026",
            user: "SANJIV KUMAR",
            client: "-",
            site: "LUDHIANA",
            type: "Travel",
            status: "Tracked",
            checkIn: "-",
            checkOut: "-",
            distance: "114.79",
        },
        {
            id: 24,
            date: "24/08/2026",
            user: "VIKRAM NISCHAL",
            client: "-",
            site: "LUDHIANA",
            type: "Travel",
            status: "Tracked",
            checkIn: "-",
            checkOut: "-",
            distance: "82.58",
        },
        {
            id: 25,
            date: "24/08/2026",
            user: "AMIT SAINI",
            client: "-",
            site: "LUDHIANA",
            type: "Travel",
            status: "Tracked",
            checkIn: "-",
            checkOut: "-",
            distance: "64.93",
        },
    ],
};

const reportTypes = Object.keys(reportData);

const Reports = () => {
    const [reportType, setReportType] =
        useState("Task Report");

    const [fromDate, setFromDate] =
        useState("2026-08-01");

    const [toDate, setToDate] =
        useState("2026-08-24");

    const [region, setRegion] =
        useState("All Regions");

    const [branch, setBranch] =
        useState("All Branches");

    const [client, setClient] =
        useState("All Clients");

    const [user, setUser] =
        useState("All Users");

    const [search, setSearch] =
        useState("");

    const [generated, setGenerated] =
        useState(true);

    const [pageSize, setPageSize] =
        useState("10");

    const [page, setPage] = useState(1);

    const currentData =
        reportData[reportType] || [];

    const filteredData = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) {
            return currentData;
        }

        return currentData.filter((item) =>
            [
                item.date,
                item.user,
                item.client,
                item.site,
                item.type,
                item.status,
                item.distance,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [currentData, search]);

    const completedCount =
        currentData.filter((item) =>
            ["Completed", "Verified", "Present", "Tracked"]
                .includes(item.status)
        ).length;

    const pendingCount =
        currentData.filter((item) =>
            ["Pending", "Unverified"]
                .includes(item.status)
        ).length;

    const missedCount =
        currentData.filter(
            (item) => item.status === "Missed"
        ).length;

    const totalDistance = currentData.reduce(
        (sum, item) =>
            sum + Number(item.distance || 0),
        0
    );

    const handleGenerate = () => {
        setGenerated(true);
        setPage(1);
    };

    const handleReset = () => {
        setReportType("Task Report");
        setFromDate("2026-08-01");
        setToDate("2026-08-24");
        setRegion("All Regions");
        setBranch("All Branches");
        setClient("All Clients");
        setUser("All Users");
        setSearch("");
        setPage(1);
    };

    const handleExcel = () => {
        console.log(
            `Export ${reportType} report to Excel`
        );
    };

    const handlePdf = () => {
        console.log(
            `Export ${reportType} report to PDF`
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusClass = (status) => {
        const value = status.toLowerCase();

        if (
            value.includes("completed") ||
            value.includes("verified") ||
            value.includes("present") ||
            value.includes("tracked")
        ) {
            return "success";
        }

        if (
            value.includes("pending") ||
            value.includes("unverified")
        ) {
            return "warning";
        }

        if (value.includes("missed")) {
            return "danger";
        }

        return "neutral";
    };

    return (
        <div className="reports-page">

            {/* =========================
          SUMMARY
      ========================= */}

            <section className="reports-summary">

                <div className="report-summary-card blue">
                    <div className="report-summary-icon">
                        <Users size={23} />
                    </div>

                    <div>
                        <span>FIELD FORCE</span>
                        <strong>10</strong>
                        <small>Active users</small>
                    </div>
                </div>

                <div className="report-summary-card green">
                    <div className="report-summary-icon">
                        <ClipboardCheck size={23} />
                    </div>

                    <div>
                        <span>TOTAL RECORDS</span>
                        <strong>{currentData.length}</strong>
                        <small>{reportType}</small>
                    </div>
                </div>

                <div className="report-summary-card orange">
                    <div className="report-summary-icon">
                        <CheckCircle2 size={23} />
                    </div>

                    <div>
                        <span>COMPLETED / VERIFIED</span>
                        <strong>{completedCount}</strong>
                        <small>Successful records</small>
                    </div>
                </div>

                <div className="report-summary-card red">
                    <div className="report-summary-icon">
                        <XCircle size={23} />
                    </div>

                    <div>
                        <span>PENDING / MISSED</span>
                        <strong>
                            {pendingCount + missedCount}
                        </strong>
                        <small>
                            {missedCount} missed
                        </small>
                    </div>
                </div>

            </section>

            {/* =========================
          FILTER CARD
      ========================= */}

            <section className="reports-filter-card">

                <div className="reports-filter-title">
                    <BarChart3 size={19} />
                    <div>
                        <h2>Generate Report</h2>
                        <p>
                            Select the report type and filters
                            for the required period.
                        </p>
                    </div>
                </div>

                <div className="reports-filter-grid">

                    <div className="report-field">
                        <label>Report Type</label>

                        <select
                            value={reportType}
                            onChange={(event) => {
                                setReportType(event.target.value);
                                setPage(1);
                            }}
                        >
                            {reportTypes.map((type) => (
                                <option
                                    value={type}
                                    key={type}
                                >
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="report-field">
                        <label>From Date</label>

                        <div className="report-date-input">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) =>
                                    setFromDate(event.target.value)
                                }
                            />
                            <CalendarDays size={16} />
                        </div>
                    </div>

                    <div className="report-field">
                        <label>To Date</label>

                        <div className="report-date-input">
                            <input
                                type="date"
                                value={toDate}
                                onChange={(event) =>
                                    setToDate(event.target.value)
                                }
                            />
                            <CalendarDays size={16} />
                        </div>
                    </div>

                    <div className="report-field">
                        <label>Region</label>

                        <select
                            value={region}
                            onChange={(event) =>
                                setRegion(event.target.value)
                            }
                        >
                            <option>All Regions</option>
                            <option>Punjab</option>
                            <option>Chandigarh</option>
                            <option>Haryana</option>
                            <option>Delhi</option>
                        </select>
                    </div>

                    <div className="report-field">
                        <label>Branch</label>

                        <select
                            value={branch}
                            onChange={(event) =>
                                setBranch(event.target.value)
                            }
                        >
                            <option>All Branches</option>
                            <option>Ludhiana</option>
                            <option>Amritsar</option>
                            <option>Jalandhar</option>
                            <option>Patiala</option>
                        </select>
                    </div>

                    <div className="report-field">
                        <label>Client</label>

                        <select
                            value={client}
                            onChange={(event) =>
                                setClient(event.target.value)
                            }
                        >
                            <option>All Clients</option>
                            <option>ICICI BANK LIMITED</option>
                            <option>AXIS BANK LIMITED</option>
                            <option>IIFL FINANCE LIMITED</option>
                            <option>HDFC BANK LIMITED</option>
                        </select>
                    </div>

                    <div className="report-field">
                        <label>Field Force</label>

                        <select
                            value={user}
                            onChange={(event) =>
                                setUser(event.target.value)
                            }
                        >
                            <option>All Users</option>
                            <option>AMIT SAINI</option>
                            <option>GURMEET SINGH</option>
                            <option>GURVINDER SINGH</option>
                            <option>SANJIV KUMAR</option>
                            <option>VIKRAM NISCHAL</option>
                        </select>
                    </div>

                </div>

                <div className="reports-filter-actions">

                    <button
                        type="button"
                        className="generate-report-button"
                        onClick={handleGenerate}
                    >
                        <Search size={17} />
                        GENERATE REPORT
                    </button>

                    <button
                        type="button"
                        className="reset-report-button"
                        onClick={handleReset}
                    >
                        <RotateCcw size={16} />
                        RESET
                    </button>

                </div>

            </section>

            {/* =========================
          RESULTS
      ========================= */}

            {generated && (
                <section className="reports-results-card">

                    <div className="reports-results-header">

                        <div className="reports-results-title">
                            <div className="reports-results-icon">
                                <FileText size={20} />
                            </div>

                            <div>
                                <h2>Report Results</h2>
                                <p>
                                    {reportType} details for the
                                    selected period
                                </p>
                            </div>
                        </div>

                        <div className="reports-export-actions">

                            <button
                                type="button"
                                className="excel-button"
                                onClick={handleExcel}
                            >
                                <FileSpreadsheet size={16} />
                                Export Excel
                            </button>

                            <button
                                type="button"
                                className="pdf-button"
                                onClick={handlePdf}
                            >
                                <FileText size={16} />
                                Export PDF
                            </button>

                            <button
                                type="button"
                                className="print-button"
                                onClick={handlePrint}
                            >
                                <Printer size={16} />
                                Print
                            </button>

                        </div>

                    </div>

                    {/* RESULT STATS */}

                    <div className="report-result-stats">

                        <div>
                            <span>Total Distance</span>
                            <strong>
                                {totalDistance.toFixed(2)} KM
                            </strong>
                        </div>

                        <div>
                            <span>Completed / Verified</span>
                            <strong className="success-text">
                                {completedCount}
                            </strong>
                        </div>

                        <div>
                            <span>Pending</span>
                            <strong className="warning-text">
                                {pendingCount}
                            </strong>
                        </div>

                        <div>
                            <span>Missed</span>
                            <strong className="danger-text">
                                {missedCount}
                            </strong>
                        </div>

                    </div>

                    {/* SEARCH */}

                    <div className="reports-table-toolbar">

                        <div className="reports-search">
                            <input
                                type="text"
                                placeholder="Search report..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />

                            <Search size={17} />
                        </div>

                        <span className="report-record-count">
                            {filteredData.length} records
                        </span>

                    </div>

                    {/* TABLE */}

                    <div className="reports-table-wrapper">

                        <table className="reports-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Field Force</th>
                                    <th>Client</th>
                                    <th>Site</th>
                                    <th>Task / Visit Type</th>
                                    <th>Status</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Distance (KM)</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredData.map(
                                    (item, index) => (
                                        <tr key={item.id}>

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>
                                                {item.date}
                                            </td>

                                            <td className="report-user">
                                                {item.user}
                                            </td>

                                            <td>
                                                {item.client}
                                            </td>

                                            <td>
                                                <span className="report-site">
                                                    <MapPin size={13} />
                                                    {item.site}
                                                </span>
                                            </td>

                                            <td>
                                                {item.type}
                                            </td>

                                            <td>
                                                <span
                                                    className={`report-status ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td>
                                                {item.checkIn}
                                            </td>

                                            <td>
                                                {item.checkOut}
                                            </td>

                                            <td>
                                                {item.distance}
                                            </td>

                                        </tr>
                                    )
                                )}

                                {filteredData.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="reports-empty"
                                        >
                                            No matching records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>

                    </div>

                    {/* FOOTER */}

                    <div className="reports-footer">

                        <span>
                            Showing{" "}
                            {filteredData.length === 0
                                ? 0
                                : 1}{" "}
                            to {filteredData.length} of{" "}
                            {filteredData.length} entries
                        </span>

                        <div className="reports-page-size">

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

                        <div className="reports-pagination">

                            <button disabled>
                                Previous
                            </button>

                            <button className="active">
                                {page}
                            </button>

                            <button disabled>
                                Next
                            </button>

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
};

export default Reports;
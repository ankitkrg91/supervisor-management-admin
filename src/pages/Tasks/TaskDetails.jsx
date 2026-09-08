import { useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    Clock3,
    Download,
    MessageCircle,
    Search,
    XCircle,
} from "lucide-react";
import "./TaskDetails.css";

const taskData = [
    {
        id: 1,
        taskNo: "TS24082026015451",
        siteId: "18666",
        siteName: "TALWANDI BHAI 2832",
        clientName: "ICICI BANK LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        siteAddress:
            "ICICI BANK LTD OLD GRAIN MARKET, TALWANDI BHAI, DIS FEROZPUR, PUNJAB",
        taskCategory: "MSF",
        taskType: "Inspection",
        status: "Completed",
        updates: 1,
    },
    {
        id: 2,
        taskNo: "TS24082026043147",
        siteId: "18666",
        siteName: "TALWANDI BHAI 2832",
        clientName: "ICICI BANK LIMITED",
        branch: "LUDHIANA",
        region: "CHANDIGARH",
        siteAddress:
            "ICICI BANK LTD OLD GRAIN MARKET, TALWANDI BHAI, DIS FEROZPUR, PUNJAB",
        taskCategory: "MSF",
        taskType: "Inspection",
        status: "Pending",
        updates: 0,
    },
    {
        id: 3,
        taskNo: "TS24082026051231",
        siteId: "18585",
        siteName: "LOHGARH",
        clientName: "AXIS BANK LIMITED",
        branch: "LUDHIANA",
        region: "PUNJAB",
        siteAddress:
            "AXIS BANK LTD MAIN MARKET LOHGARH PUNJAB",
        taskCategory: "MFM",
        taskType: "Audit",
        status: "Completed",
        updates: 2,
    },
    {
        id: 4,
        taskNo: "TS24082026063412",
        siteId: "18609",
        siteName: "RANIAN",
        clientName: "IIFL FINANCE LIMITED",
        branch: "AMRITSAR",
        region: "PUNJAB",
        siteAddress:
            "IIFL FINANCE MAIN ROAD RANIAN PUNJAB",
        taskCategory: "OTHER VISIT",
        taskType: "Visit",
        status: "Missed",
        updates: 0,
    },
    {
        id: 5,
        taskNo: "TS24082026071829",
        siteId: "18662",
        siteName: "RAYYA",
        clientName: "ICICI BANK LIMITED",
        branch: "AMRITSAR",
        region: "PUNJAB",
        siteAddress:
            "ICICI BANK MAIN MARKET RAYYA PUNJAB",
        taskCategory: "NIGHT VISIT",
        taskType: "Inspection",
        status: "Unassigned",
        updates: 0,
    },
];

const statusCards = [
    {
        label: "UNASSIGNED",
        value: 2,
        className: "unassigned",
        icon: AlertTriangle,
    },
    {
        label: "MISSED",
        value: 0,
        className: "missed",
        icon: XCircle,
    },
    {
        label: "PENDING",
        value: 7,
        className: "pending",
        icon: Clock3,
    },
    {
        label: "COMPLETED",
        value: 30,
        className: "completed",
        icon: CheckCircle,
    },
];

const TaskDetails = () => {
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [pageSize, setPageSize] = useState("25");

    const filteredData = useMemo(() => {
        const query = search.toLowerCase().trim();

        return taskData.filter((task) => {
            const matchesSearch =
                !query ||
                task.taskNo.toLowerCase().includes(query) ||
                task.siteId.toLowerCase().includes(query) ||
                task.siteName.toLowerCase().includes(query) ||
                task.clientName.toLowerCase().includes(query) ||
                task.branch.toLowerCase().includes(query) ||
                task.region.toLowerCase().includes(query) ||
                task.taskCategory.toLowerCase().includes(query) ||
                task.taskType.toLowerCase().includes(query);

            const matchesStatus =
                activeStatus === "ALL" ||
                task.status.toUpperCase() === activeStatus;

            return matchesSearch && matchesStatus;
        });
    }, [search, activeStatus]);

    const handleExport = () => {
        console.log("Task details Excel export");
    };

    const getStatusClass = (status) => {
        return status.toLowerCase().replace(" ", "-");
    };

    return (
        <div className="task-details-page">

            {/* =========================
          STATUS CARDS
      ========================= */}

            <section className="task-status-cards">
                {statusCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <button
                            type="button"
                            key={card.label}
                            className={`task-status-card ${card.className}`}
                            onClick={() =>
                                setActiveStatus(
                                    activeStatus === card.label
                                        ? "ALL"
                                        : card.label
                                )
                            }
                        >
                            <div className="task-status-icon">
                                <Icon size={31} />
                            </div>

                            <div className="task-status-info">
                                <span>{card.label}</span>
                                <strong>{card.value}</strong>
                            </div>
                        </button>
                    );
                })}
            </section>

            {/* =========================
          TABLE CARD
      ========================= */}

            <section className="task-details-card">

                <div className="task-details-toolbar">

                    <div className="task-details-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        <Search size={18} />
                    </div>

                    <button
                        type="button"
                        className="task-details-export"
                        onClick={handleExport}
                        title="Export Excel"
                    >
                        <Download size={18} />
                    </button>

                </div>

                {/* TABLE */}

                <div className="task-details-table-wrapper">
                    <table className="task-details-table">
                        <thead>
                            <tr>
                                <th>
                                    <MessageCircle size={14} />
                                </th>

                                <th>Task Updates</th>

                                <th>Task No</th>

                                <th>Site ID</th>

                                <th>Site Name</th>

                                <th>Client Name</th>

                                <th>Branch</th>

                                <th>Region</th>

                                <th>Site Address</th>

                                <th>Task Category</th>

                                <th>Task Type</th>

                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.map((task) => (
                                <tr key={task.id}>

                                    <td className="task-comment-cell">
                                        <MessageCircle size={15} />
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="task-updates-link"
                                            onClick={() =>
                                                console.log(
                                                    "Task updates:",
                                                    task.taskNo
                                                )
                                            }
                                        >
                                            TASK
                                            <br />
                                            UPDATES
                                        </button>
                                    </td>

                                    <td>
                                        {task.taskNo}
                                    </td>

                                    <td>
                                        {task.siteId}
                                    </td>

                                    <td>
                                        {task.siteName}
                                    </td>

                                    <td>
                                        {task.clientName}
                                    </td>

                                    <td>
                                        {task.branch}
                                    </td>

                                    <td>
                                        {task.region}
                                    </td>

                                    <td className="task-address">
                                        {task.siteAddress}
                                    </td>

                                    <td>
                                        {task.taskCategory}
                                    </td>

                                    <td>
                                        {task.taskType}
                                    </td>

                                    <td>
                                        <span
                                            className={`task-detail-status ${getStatusClass(
                                                task.status
                                            )}`}
                                        >
                                            {task.status}
                                        </span>
                                    </td>

                                </tr>
                            ))}

                            {filteredData.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="task-details-empty"
                                    >
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* =========================
            FOOTER
        ========================= */}

                <div className="task-details-footer">

                    <span>
                        Showing 1 to {filteredData.length} of{" "}
                        {filteredData.length} entries
                    </span>

                    <div className="task-details-show">
                        <span>Show</span>

                        <select
                            value={pageSize}
                            onChange={(e) =>
                                setPageSize(e.target.value)
                            }
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>

                        <span>entries</span>
                    </div>

                    <div className="task-details-pagination">
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

export default TaskDetails;
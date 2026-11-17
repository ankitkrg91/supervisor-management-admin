import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    Eye,
    FileSpreadsheet,
    FileText,
    MapPin,
    ExternalLink,
    Camera,
    Printer,
    RotateCcw,
    Search,
    Users,
    XCircle,
} from "lucide-react";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { apiFetch } from "../../utils/api";

import "./Reports.css";

const reportTypes = [
    "Task Report",
    "Visit Report",
    "Audit Report",
    "Missed Task Report",
    "Field Force Performance",
    "Distance Report",
];

const formatDistance = (value) => {
    const number = Number(value);

    return Number.isNaN(number)
        ? "0.00"
        : number.toFixed(2);
};

// Always use the CLIENT email stored on the task/report row.
// Never use Supervisor/Field Force email.
const getClientEmail = (item) => {
    const email =
        item?.clientEmail ||
        item?.task?.clientEmail ||
        item?.client?.email ||
        "";

    const normalizedEmail = String(email).trim();

    return normalizedEmail && normalizedEmail !== "-"
        ? normalizedEmail
        : "-";
};

const Reports = () => {
    const [searchParams] = useSearchParams();
    const requestedReportType = searchParams.get("type");
    const initialReportType = reportTypes.includes(requestedReportType)
        ? requestedReportType
        : "Task Report";
    const autoRunKey = useRef("");

    const [reportType, setReportType] =
        useState(initialReportType);

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [region, setRegion] =
        useState("");

    const [branch, setBranch] =
        useState("");

    const [client, setClient] =
        useState("");

    const [user, setUser] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [generated, setGenerated] =
        useState(false);

    const [rows, setRows] =
        useState([]);

    const [summary, setSummary] =
        useState({
            totalRecords: 0,
            completed: 0,
            pending: 0,
            missed: 0,
            auditVerified: 0,
            auditUnverified: 0,
            auditPending: 0,
            totalDistance: 0,
        });

    const [filterOptions, setFilterOptions] =
        useState({
            regions: [],
            branches: [],
            clients: [],
            users: [],
        });

    const [pageSize, setPageSize] =
        useState("10");

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
        });

    const [loading, setLoading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    // Audit drill-down state
    const [selectedSupervisor, setSelectedSupervisor] =
        useState("");

    const [auditDetail, setAuditDetail] =
        useState(null);

    const [auditDetailLoading, setAuditDetailLoading] =
        useState(false);

    const [auditDetailError, setAuditDetailError] =
        useState("");

    const [visitDetail, setVisitDetail] =
        useState(null);

    const fetchReport = async (overrides = {}) => {
        try {
            setLoading(true);
            setErrorMessage("");

            const params =
                new URLSearchParams();

            const currentReportType =
                overrides.reportType ?? reportType;

            const currentPage =
                overrides.page ?? page;

            const currentPageSize =
                overrides.pageSize ?? pageSize;

            const currentRegion =
                overrides.region ?? region;

            const currentBranch =
                overrides.branch ?? branch;

            const currentClient =
                overrides.client ?? client;

            const currentUser =
                overrides.user ?? user;

            const currentSearch =
                overrides.search ?? search;

            const currentFromDate =
                overrides.fromDate ?? fromDate;

            const currentToDate =
                overrides.toDate ?? toDate;

            params.set(
                "type",
                currentReportType
            );

            params.set(
                "page",
                String(currentPage)
            );

            params.set(
                "limit",
                String(currentPageSize)
            );

            if (currentFromDate) {
                params.set(
                    "fromDate",
                    currentFromDate
                );
            }

            if (currentToDate) {
                params.set(
                    "toDate",
                    currentToDate
                );
            }

            if (currentRegion) {
                params.set(
                    "region",
                    currentRegion
                );
            }

            if (currentBranch) {
                params.set(
                    "branch",
                    currentBranch
                );
            }

            if (currentClient) {
                params.set(
                    "client",
                    currentClient
                );
            }

            if (currentUser) {
                params.set(
                    "user",
                    currentUser
                );
            }

            if (currentSearch.trim()) {
                params.set(
                    "search",
                    currentSearch.trim()
                );
            }

            const response =
                await apiFetch(
                    `/api/reports?${params.toString()}`
                );

            const data =
                await response.json();

            if (response.status === 401) {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                window.location.href =
                    "/login";

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to generate report"
                );
            }

            const reportData =
                data?.data || {};

            setRows(
                reportData.rows || []
            );

            setSummary(
                reportData.summary || {
                    totalRecords: 0,
                    completed: 0,
                    pending: 0,
                    missed: 0,
                    auditVerified: 0,
                    auditUnverified: 0,
                    auditPending: 0,
                    totalDistance: 0,
                }
            );

            setFilterOptions(
                reportData.filters || {
                    regions: [],
                    branches: [],
                    clients: [],
                    users: [],
                }
            );

            setPagination(
                reportData.pagination || {
                    page: 1,
                    limit:
                        Number(pageSize),
                    total: 0,
                    totalPages: 1,
                }
            );

            setGenerated(true);
        } catch (error) {
            console.error(
                "Report error:",
                error
            );

            setRows([]);

            setSummary({
                totalRecords: 0,
                completed: 0,
                pending: 0,
                missed: 0,
                auditVerified: 0,
                auditUnverified: 0,
                auditPending: 0,
                totalDistance: 0,
            });

            setErrorMessage(
                error?.message ||
                "Failed to generate report"
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditDetail = async (visitId) => {
        if (!visitId) {
            setAuditDetailError(
                "This audit record does not have a visit ID."
            );
            return;
        }

        try {
            setAuditDetailLoading(true);
            setAuditDetailError("");
            setAuditDetail(null);

            const response = await apiFetch(
                `/api/audit/visits/${visitId}/submission`
            );

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to load audit details"
                );
            }

            const submission =
                data?.data?.submission || null;

            if (!submission) {
                throw new Error(
                    "No audit submission was found for this visit."
                );
            }

            setAuditDetail(submission);

            const supervisorName =
                submission?.visit?.user?.name || "";

            if (supervisorName) {
                setSelectedSupervisor(supervisorName);
            }
        } catch (error) {
            console.error(
                "Audit detail error:",
                error
            );

            setAuditDetailError(
                error?.message ||
                "Failed to load audit details"
            );
        } finally {
            setAuditDetailLoading(false);
        }
    };

    const handleVisitDetail = (item) => {
        setVisitDetail(item || null);
    };

    const handleSupervisorClick = (supervisorName) => {
        const name = String(
            supervisorName || ""
        ).trim();

        if (!name) {
            return;
        }

        setSelectedSupervisor(name);
        setUser(name);
        setAuditDetail(null);
        setAuditDetailError("");
        setVisitDetail(null);
        setPage(1);

        if (generated) {
            fetchReport({
                user: name,
                page: 1,
            });
        }
    };

    const handleAuditClick = (item) => {
        if (reportType !== "Audit Report") {
            return;
        }

        fetchAuditDetail(item?.visitId);
    };

    const handleBackFromAudit = () => {
        setAuditDetail(null);
        setAuditDetailError("");
    };

    const getAuditAnswer = (answer) => {
        if (answer?.booleanValue === true) {
            return "YES";
        }

        if (answer?.booleanValue === false) {
            return "NO";
        }

        if (
            answer?.textValue !== null &&
            answer?.textValue !== undefined &&
            String(answer.textValue).trim() !== ""
        ) {
            return String(answer.textValue);
        }

        return "-";
    };

    const getAuditAnswerClass = (answer) => {
        if (answer?.booleanValue === true) {
            return "success";
        }

        if (answer?.booleanValue === false) {
            return "danger";
        }

        return "neutral";
    };

    const formatAuditDateTime = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    useEffect(() => {
        const requestedType = searchParams.get("type");
        const shouldGenerate = searchParams.get("generate") === "1";
        const requestKey = searchParams.toString();

        if (
            !shouldGenerate ||
            !reportTypes.includes(requestedType) ||
            autoRunKey.current === requestKey
        ) {
            return;
        }

        autoRunKey.current = requestKey;
        setReportType(requestedType);
        setPage(1);
        setGenerated(true);
        fetchReport({ reportType: requestedType, page: 1 });
    }, [searchParams]);

    useEffect(() => {
        if (!generated) {
            return;
        }

        fetchReport();
    }, [
        page,
        pageSize,
    ]);

    const handleGenerate = () => {
        if (
            fromDate &&
            toDate &&
            new Date(toDate) <
            new Date(fromDate)
        ) {
            setErrorMessage(
                "To date cannot be before from date."
            );

            return;
        }

        setErrorMessage("");
        setPage(1);
        setGenerated(true);

        fetchReport({
            page: 1,
        });
    };

    const handleReset = () => {
        setReportType(
            "Task Report"
        );

        setFromDate("");
        setToDate("");
        setRegion("");
        setBranch("");
        setClient("");
        setUser("");
        setSearch("");

        setRows([]);

        setSummary({
            totalRecords: 0,
            completed: 0,
            pending: 0,
            missed: 0,
            auditVerified: 0,
            auditUnverified: 0,
            auditPending: 0,
            totalDistance: 0,
        });

        setFilterOptions({
            regions: [],
            branches: [],
            clients: [],
            users: [],
        });

        setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
        });

        setPage(1);
        setGenerated(false);
        setErrorMessage("");
        setSelectedSupervisor("");
        setAuditDetail(null);
        setAuditDetailError("");
        setAuditDetailLoading(false);
        setVisitDetail(null);
    };

    const handleReportTypeChange = (
        value
    ) => {
        setReportType(value);
        setVisitDetail(null);

        setRegion("");
        setBranch("");
        setClient("");
        setUser("");
        setSearch("");
        setSelectedSupervisor("");
        setAuditDetail(null);
        setAuditDetailError("");

        setPage(1);

        if (generated) {
            fetchReport({
                reportType: value,
                region: "",
                branch: "",
                client: "",
                user: "",
                search: "",
                page: 1,
            });
        }
    };

    const handleExcel = () => {
        try {
            const exportRows = rows.map((item, index) => {
                if (["Field Force Performance", "Distance Report"].includes(reportType)) {
                    return {
                        "#": index + 1,
                        Date: item.date || "-",
                        "Field Force": item.user || "-",
                        Client: item.client || "-",
                        "Client Email": getClientEmail(item),
                        Site: item.site || "-",
                        "Task / Visit Type": item.type || "-",
                        Status: item.status || "-",
                        "Check In": item.checkIn || "-",
                        "Check Out": item.checkOut || "-",
                        "Distance (KM)": item.distance || "0.00",
                    };
                }
                return {
                    "#": index + 1,
                    Date: item.date || "-",
                    "Date & Time": item.dateTime || item.missedDateTime || "-",
                    "Site Visited At": item.visitDateTime || "-",
                    "Field Force / Supervisor": item.user || "-",
                    "Created By": item.createdBy || "-",
                    Client: item.client || "-",
                    "Client Email": getClientEmail(item),
                    "Task ID": item.taskId || "-",
                    "Task Title": item.taskTitle || "-",
                    "Task Type": item.taskType || item.type || "-",
                    "Site": item.site || "-",
                    "Site Code": item.siteCode || "-",
                    Address: item.address || "-",
                    "Scheduled Date": item.scheduledDate || "-",
                    "Scheduled Time": item.scheduledTime || "-",
                    "Due Date": item.dueDate || "-",
                    "Due Time": item.dueTime || "-",
                    "Check In": item.checkIn || "-",
                    "Check Out": item.checkOut || "-",
                    "Check-In Status": item.checkInStatus || "-",
                    "Visit / Audit Status": item.status || "-",
                    "Audit Questions": item.answerCount ?? "-",
                    "Check-In Photo": item.checkInPhotoUrl || "-",
                    "Audit Review Link": item.auditReviewUrl ? `${window.location.origin}${item.auditReviewUrl}` : "-",
                    "Map Link": item.mapUrl || "-",
                    "Distance (KM)": item.distance || "0.00",
                };
            });

            const workbook = XLSX.utils.book_new();

            let worksheet;

            if (exportRows.length > 0) {
                worksheet = XLSX.utils.json_to_sheet(exportRows);
            } else {
                worksheet = XLSX.utils.aoa_to_sheet([
                    [`${reportType}`],
                    [`Generated: ${new Date().toLocaleString("en-IN")}`],
                    [],
                    ["No records found"],
                ]);
            }

            worksheet["!cols"] = exportRows.length > 0
                ? Object.keys(exportRows[0]).map((header) => ({ wch: Math.min(Math.max(String(header).length + 3, 14), 36) }))
                : [{ wch: 24 }];

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Report"
            );

            const safeFileName =
                reportType
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") || "report";

            XLSX.writeFile(
                workbook,
                `${safeFileName}.xlsx`
            );
        } catch (error) {
            console.error("Excel export error:", error);

            alert(
                "Excel export failed. Please check the browser console."
            );
        }
    };

    const handlePdf = () => {
        try {
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const safeFileName = reportType
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "report";

            const generatedAt = new Date().toLocaleString("en-IN");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text(reportType, 14, 15);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Generated: ${generatedAt}`, 14, 21);

            let metaY = 27;
            const filters = [];

            if (fromDate) filters.push(`From: ${fromDate}`);
            if (toDate) filters.push(`To: ${toDate}`);
            if (region) filters.push(`Region: ${region}`);
            if (branch) filters.push(`Branch: ${branch}`);
            if (client) filters.push(`Client: ${client}`);
            if (user) filters.push(`Field Force: ${user}`);

            if (filters.length > 0) {
                doc.text(filters.join("   |   "), 14, metaY);
                metaY += 6;
            }

            doc.text(
                `Total Records: ${summary.totalRecords}   |   Completed/Verified: ${summary.completed}   |   Pending: ${summary.pending}   |   Missed: ${summary.missed}   |   Distance: ${formatDistance(summary.totalDistance)} KM`,
                14,
                metaY
            );

            const tableHead = reportColumns;
            const tableBody = rows.map((item, index) => reportColumns.map((column) => {
                if (column === "Map") return item.mapUrl || "-";
                if (column === "Check-In Report") return item.checkInPhotoUrl || "No photo";
                if (column === "Audit Review") return item.auditReviewUrl ? `${window.location.origin}${item.auditReviewUrl}` : "No audit link";
                return getRowCell(item, column, index);
            }));

            if (tableBody.length === 0) {
                autoTable(doc, {
                    startY: metaY + 7,
                    head: [tableHead],
                    body: [Array.from({ length: tableHead.length }, (_, index) => index === Math.floor(tableHead.length / 2) ? "No records found" : "")],
                    theme: "grid",
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        valign: "middle",
                    },
                    headStyles: {
                        fillColor: [31, 78, 121],
                        textColor: 255,
                        fontStyle: "bold",
                    },
                    bodyStyles: {
                        textColor: [90, 90, 90],
                        halign: "center",
                    },
                });
            } else {
                autoTable(doc, {
                    startY: metaY + 7,
                    head: [tableHead],
                    body: tableBody,
                    theme: "grid",
                    styles: {
                        fontSize: tableHead.length > 12 ? 5.5 : 7.5,
                        cellPadding: 2.0,
                        overflow: "linebreak",
                        valign: "middle",
                    },
                    headStyles: {
                        fillColor: [31, 78, 121],
                        textColor: 255,
                        fontStyle: "bold",
                        halign: "center",
                    },
                    columnStyles: {
                        0: { cellWidth: 8, halign: "center" },
                        1: { cellWidth: 22 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 28 },
                        4: { cellWidth: 30 },
                        5: { cellWidth: 32 },
                        6: { cellWidth: 24 },
                        7: { cellWidth: 22 },
                        8: { cellWidth: 22 },
                        9: { cellWidth: 23, halign: "right" },
                        10: { cellWidth: 28 },
                    },
                    didDrawPage: (data) => {
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();

                        doc.setFontSize(8);
                        doc.setFont("helvetica", "normal");
                        doc.text(
                            `Page ${data.pageNumber}`,
                            pageWidth - 25,
                            pageHeight - 8
                        );
                    },
                });
            }

            doc.save(`${safeFileName}.pdf`);
        } catch (error) {
            console.error("PDF export error:", error);
            alert(
                "PDF export failed. Please install jspdf and jspdf-autotable in the frontend."
            );
        }
    };

    const handleAuditPdf = () => {
        try {
            if (!auditDetail) {
                alert("No audit details available.");
                return;
            }

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const supervisor =
                auditDetail?.visit?.user?.name || "-";

            const site =
                auditDetail?.visit?.site?.name || "-";

            const siteCode =
                auditDetail?.visit?.site?.siteCode || "-";

            const city =
                auditDetail?.visit?.site?.city || "-";

            const state =
                auditDetail?.visit?.site?.state || "-";

            const visitDate =
                formatAuditDateTime(
                    auditDetail?.visit?.visitAt
                );

            const submittedAt =
                formatAuditDateTime(
                    auditDetail?.submittedAt
                );

            const status =
                auditDetail?.visit?.status || "-";

            const templateName =
                auditDetail?.template?.name || "-";

            const generatedAt =
                new Date().toLocaleString("en-IN");

            const answers = [
                ...(auditDetail?.answers || []),
            ].sort(
                (a, b) =>
                    Number(a?.questionNo || 0) -
                    Number(b?.questionNo || 0)
            );

            const safeFileName =
                `audit-${supervisor}-${site}-${auditDetail?.visit?.visitAt || "details"}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");

            doc.setProperties({
                title: "Audit Details",
                subject: "Audit Questions and Answers",
                author: "Supervisor Management System",
            });

            // TITLE
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("Audit Details", 14, 16);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(
                `Generated: ${generatedAt}`,
                14,
                22
            );

            // META
            let y = 32;

            const metaRows = [
                ["Supervisor", supervisor],
                ["Site", `${site} (${siteCode})`],
                ["Location", `${city}, ${state}`],
                ["Visit Date", visitDate],
                ["Audit Submitted", submittedAt],
                ["Status", status],
                ["Audit Template", templateName],
            ];

            metaRows.forEach(([label, value]) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text(`${label}:`, 14, y);

                doc.setFont("helvetica", "normal");
                doc.text(String(value || "-"), 48, y);

                y += 6;
            });

            y += 4;

            // QUESTIONS + ANSWERS
            const tableHead = [
                "#",
                "Question",
                "Answer",
            ];

            const tableBody =
                answers.length > 0
                    ? answers.map((answer) => [
                        answer?.questionNo || "-",
                        answer?.questionText || "-",
                        getAuditAnswer(answer),
                    ])
                    : [
                        ["", "No audit answers found.", ""],
                    ];

            autoTable(doc, {
                startY: y,
                head: [tableHead],
                body: tableBody,
                theme: "grid",

                styles: {
                    fontSize: 8.5,
                    cellPadding: 3,
                    overflow: "linebreak",
                    valign: "middle",
                    lineColor: [210, 214, 220],
                    lineWidth: 0.2,
                },

                headStyles: {
                    fillColor: [31, 78, 121],
                    textColor: 255,
                    fontStyle: "bold",
                    halign: "center",
                },

                columnStyles: {
                    0: {
                        cellWidth: 15,
                        halign: "center",
                    },
                    1: {
                        cellWidth: 115,
                    },
                    2: {
                        cellWidth: 45,
                        halign: "center",
                    },
                },

                didParseCell: (data) => {
                    if (
                        data.section === "body" &&
                        data.column.index === 2
                    ) {
                        const answer = String(
                            data.cell.raw || ""
                        ).toUpperCase();

                        if (answer === "YES") {
                            data.cell.styles.textColor = [
                                22,
                                163,
                                74,
                            ];
                            data.cell.styles.fontStyle =
                                "bold";
                        }

                        if (answer === "NO") {
                            data.cell.styles.textColor = [
                                220,
                                38,
                                38,
                            ];
                            data.cell.styles.fontStyle =
                                "bold";
                        }
                    }
                },

                didDrawPage: (data) => {
                    const pageWidth =
                        doc.internal.pageSize.getWidth();

                    const pageHeight =
                        doc.internal.pageSize.getHeight();

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8);

                    doc.text(
                        `Audit Details • Page ${data.pageNumber}`,
                        14,
                        pageHeight - 8
                    );

                    doc.text(
                        "Supervisor Management System",
                        pageWidth - 72,
                        pageHeight - 8
                    );
                },
            });

            doc.save(
                `${safeFileName || "audit-details"}.pdf`
            );
        } catch (error) {
            console.error(
                "Audit PDF export error:",
                error
            );

            alert(
                "Failed to export audit PDF."
            );
        }
    };

    const handleAuditExcel = () => {
        try {
            if (!auditDetail) {
                alert("No audit details available.");
                return;
            }

            const supervisor =
                auditDetail?.visit?.user?.name || "-";

            const site =
                auditDetail?.visit?.site?.name || "-";

            const siteCode =
                auditDetail?.visit?.site?.siteCode || "-";

            const city =
                auditDetail?.visit?.site?.city || "-";

            const state =
                auditDetail?.visit?.site?.state || "-";

            const visitDate =
                formatAuditDateTime(
                    auditDetail?.visit?.visitAt
                );

            const submittedAt =
                formatAuditDateTime(
                    auditDetail?.submittedAt
                );

            const status =
                auditDetail?.visit?.status || "-";

            const templateName =
                auditDetail?.template?.name || "-";

            const answers = [
                ...(auditDetail?.answers || []),
            ].sort(
                (a, b) =>
                    Number(a?.questionNo || 0) -
                    Number(b?.questionNo || 0)
            );

            const metadata = [
                {
                    Field: "Supervisor",
                    Value: supervisor,
                },
                {
                    Field: "Site",
                    Value: site,
                },
                {
                    Field: "Site Code",
                    Value: siteCode,
                },
                {
                    Field: "City",
                    Value: city,
                },
                {
                    Field: "State",
                    Value: state,
                },
                {
                    Field: "Visit Date",
                    Value: visitDate,
                },
                {
                    Field: "Audit Submitted",
                    Value: submittedAt,
                },
                {
                    Field: "Status",
                    Value: status,
                },
                {
                    Field: "Audit Template",
                    Value: templateName,
                },
            ];

            const questionRows = answers.map(
                (answer) => ({
                    "#":
                        answer?.questionNo || "",
                    "Question":
                        answer?.questionText || "",
                    "Answer":
                        getAuditAnswer(answer),
                })
            );

            if (!questionRows.length) {
                questionRows.push({
                    "#": "",
                    Question: "No audit answers found.",
                    Answer: "",
                });
            }

            const worksheet =
                XLSX.utils.aoa_to_sheet([
                    ["AUDIT DETAILS"],
                    [],
                    ["Field", "Value"],
                    ...metadata.map((item) => [
                        item.Field,
                        item.Value,
                    ]),
                    [],
                    ["#", "Question", "Answer"],
                    ...questionRows.map((row) => [
                        row["#"],
                        row.Question,
                        row.Answer,
                    ]),
                ]);

            worksheet["!cols"] = [
                { wch: 10 },
                { wch: 80 },
                { wch: 30 },
            ];

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Audit Details"
            );

            const safeFileName =
                `audit-${supervisor}-${site}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") ||
                "audit-details";

            XLSX.writeFile(
                workbook,
                `${safeFileName}.xlsx`
            );
        } catch (error) {
            console.error(
                "Audit Excel export error:",
                error
            );

            alert(
                "Failed to export audit Excel."
            );
        }
    };

    /* =========================================================
       PRINT REPORT TABLE ONLY (NO SIDEBAR / NO APPSHELL / CLEAN)
       ========================================================= */
    const handlePrint = () => {
        if (!generated || rows.length === 0) {
            alert("Please generate a report with records before printing.");
            return;
        }

        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) {
            alert("Please allow popups to print the report.");
            return;
        }

        const filters = [];
        if (fromDate) filters.push(`From: ${fromDate}`);
        if (toDate) filters.push(`To: ${toDate}`);
        if (region) filters.push(`Region: ${region}`);
        if (branch) filters.push(`Branch: ${branch}`);
        if (client) filters.push(`Client: ${client}`);
        if (user) filters.push(`Field Force: ${user}`);

        const filterText = filters.length > 0 ? filters.join(" &nbsp;|&nbsp; ") : "All Records";

        const escapePrintHtml = (value) => String(value ?? "-")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        const tableHeadHtml = reportColumns
            .map((column) => `<th>${escapePrintHtml(column)}</th>`)
            .join("");

        const tableRowsHtml = rows
            .map((item, index) => {
                const values = reportColumns.map((column) => {
                    if (column === "Map") return item.mapUrl || "-";
                    if (column === "Check-In Report") return item.checkInPhotoUrl || "No photo";
                    if (column === "Audit Review") return item.auditReviewUrl ? `${window.location.origin}${item.auditReviewUrl}` : "No audit link";
                    return getRowCell(item, column, index);
                });
                return `<tr>${values.map((value) => `<td>${escapePrintHtml(value)}</td>`).join("")}</tr>`;
            })
            .join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportType} - Print</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11.5px; }
                    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .header h1 { margin: 0; font-size: 18px; color: #1e3a8a; }
                    .header p { margin: 3px 0 0; color: #64748b; font-size: 11px; }
                    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 11.5px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
                    th { background: #1e3a8a; color: #ffffff; padding: 7px 8px; text-align: left; font-weight: 600; border: 1px solid #1e3a8a; }
                    td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: middle; }
                    tr:nth-child(even) { background: #f8fafc; }
                    tr { page-break-inside: avoid; break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>${reportType.toUpperCase()}</h1>
                        <p>Filters: ${filterText}</p>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #64748b;">
                        <div>Generated: ${new Date().toLocaleString("en-IN")}</div>
                        <div>Total Records: <strong>${summary.totalRecords}</strong></div>
                    </div>
                </div>

                <div class="summary-box">
                    <span>Completed / Verified: <strong>${summary.completed}</strong></span>
                    <span>Pending: <strong>${summary.pending}</strong></span>
                    <span>Missed: <strong>${summary.missed}</strong></span>
                    <span>Total Distance: <strong>${formatDistance(summary.totalDistance)} KM</strong></span>
                </div>

                <table>
                    <thead><tr>${tableHeadHtml}</tr></thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 400);
    };

    const getStatusClass = (
        status
    ) => {
        const value =
            String(status || "")
                .toLowerCase();

        if (
            value.includes(
                "completed"
            ) ||
            value.includes(
                "verified"
            ) ||
            value.includes(
                "present"
            ) ||
            value.includes(
                "tracked"
            )
        ) {
            return "success";
        }

        if (
            value.includes(
                "pending"
            ) ||
            value.includes(
                "unverified"
            ) ||
            value.includes(
                "progress"
            )
        ) {
            return "warning";
        }

        if (
            value.includes(
                "missed"
            ) ||
            value.includes(
                "cancelled"
            )
        ) {
            return "danger";
        }

        return "neutral";
    };

    const showingFrom =
        pagination.total === 0
            ? 0
            : (
                pagination.page - 1
            ) *
            pagination.limit +
            1;

    const showingTo =
        pagination.total === 0
            ? 0
            : Math.min(
                pagination.page *
                pagination.limit,
                pagination.total
            );

    const paginationPages =
        useMemo(() => {
            const totalPages =
                pagination.totalPages;

            if (totalPages <= 5) {
                return Array.from(
                    {
                        length:
                            totalPages,
                    },
                    (_, index) =>
                        index + 1
                );
            }

            const current =
                pagination.page;

            if (current <= 3) {
                return [
                    1,
                    2,
                    3,
                    4,
                    5,
                ];
            }

            if (
                current >=
                totalPages - 2
            ) {
                return [
                    totalPages - 4,
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages,
                ];
            }

            return [
                current - 2,
                current - 1,
                current,
                current + 1,
                current + 2,
            ];
        }, [
            pagination.page,
            pagination.totalPages,
        ]);

    const isTaskReport = reportType === "Task Report";
    const isMissedTaskReport = reportType === "Missed Task Report";
    const isVisitReport = reportType === "Visit Report";
    const isAuditReport = reportType === "Audit Report";
    const isPerformanceOrDistance = ["Field Force Performance", "Distance Report"].includes(reportType);

    const reportColumns = isPerformanceOrDistance
        ? ["#", "Date", "Field Force", "Client", "Client Email", "Site", "Task / Visit Type", "Status", "Check In", "Check Out", "Distance (KM)"]
        : isTaskReport
            ? ["#", "Created", "Field Force", "Created By", "Client", "Client Email", "Task", "Task Type", "Site", "Address", "Scheduled For", "Due By", "Status", "Map"]
            : isMissedTaskReport
                ? ["#", "Missed Date", "Field Force", "Client", "Client Email", "Task", "Task Type", "Site", "Address", "Scheduled For", "Due By", "Status", "Map"]
                : isVisitReport
                    ? ["#", "Visit Date & Time", "Field Force", "Client", "Client Email", "Task Type", "Site", "Address", "Check In", "Check Out", "Check-In Status", "Visit Status", "Check-In Report", "Map"]
                    : ["#", "Audit Date & Time", "Visited At", "Field Force", "Client", "Client Email", "Task Type / Template", "Site", "Address", "Questions", "Verification Status", "Audit Review", "Map"];

    const getRowCell = (item, column, index) => {
        const scheduled = [item.scheduledDate, item.scheduledTime].filter(Boolean).join(" · ") || "-";
        const due = [item.dueDate, item.dueTime].filter(Boolean).join(" · ") || "-";
        if (column === "#") return (pagination.page - 1) * pagination.limit + index + 1;
        if (column === "Date") return item.date || "-";
        if (column === "Created") return [item.createdDate, item.createdTime].filter(Boolean).join(" · ") || item.date || "-";
        if (column === "Missed Date") return item.missedDateTime || item.date || "-";
        if (column === "Visit Date & Time" || column === "Audit Date & Time") return item.dateTime || item.date || "-";
        if (column === "Visited At") return item.visitDateTime || "-";
        if (column === "Field Force") return item.user || "-";
        if (column === "Created By") return item.createdBy || "-";
        if (column === "Client") return item.client || "-";
        if (column === "Client Email") return getClientEmail(item);
        if (column === "Task") return item.taskTitle || item.type || "-";
        if (column === "Task / Visit Type" || column === "Task Type" || column === "Task Type / Template") return item.taskType || item.type || "-";
        if (column === "Site") return item.site || "-";
        if (column === "Address") return item.address || "-";
        if (column === "Scheduled For") return scheduled;
        if (column === "Due By") return due;
        if (column === "Status" || column === "Visit Status" || column === "Verification Status") return item.status || "-";
        if (column === "Check In") return item.checkIn || "-";
        if (column === "Check Out") return item.checkOut || "-";
        if (column === "Check-In Status") return item.checkInStatus || "-";
        if (column === "Distance (KM)") return item.distance || "0.00";
        if (column === "Questions") return item.answerCount ?? 0;
        return "-";
    };

    return (
        <div className="reports-page">

            {/* SUMMARY */}

            <section className="reports-summary">

                <div className="report-summary-card blue">
                    <div className="report-summary-icon">
                        <Users size={23} />
                    </div>

                    <div>
                        <span>
                            FIELD FORCE
                        </span>

                        <strong>
                            {
                                filterOptions
                                    .users
                                    .length
                            }
                        </strong>

                        <small>
                            Users in report
                        </small>
                    </div>
                </div>

                <div className="report-summary-card green">
                    <div className="report-summary-icon">
                        <ClipboardCheck size={23} />
                    </div>

                    <div>
                        <span>
                            {isTaskReport ? "TASKS CREATED" : isMissedTaskReport ? "MISSED TASKS" : isVisitReport ? "TOTAL VISITS" : isAuditReport ? "TOTAL AUDITS" : "TOTAL RECORDS"}
                        </span>

                        <strong>
                            {
                                summary.totalRecords
                            }
                        </strong>

                        <small>
                            {reportType}
                        </small>
                    </div>
                </div>

                <div className="report-summary-card orange">
                    <div className="report-summary-icon">
                        <CheckCircle2 size={23} />
                    </div>

                    <div>
                        <span>
                            {isAuditReport ? "VERIFIED AUDITS" : isMissedTaskReport ? "MISSED TASKS" : "COMPLETED / VERIFIED"}
                        </span>

                        <strong>
                            {isAuditReport ? summary.auditVerified : isMissedTaskReport ? summary.missed : summary.completed}
                        </strong>

                        <small>
                            {isAuditReport ? "Audits approved / verified" : isMissedTaskReport ? "Tasks past their due date" : "Successful records"}
                        </small>
                    </div>
                </div>

                <div className="report-summary-card red">
                    <div className="report-summary-icon">
                        <XCircle size={23} />
                    </div>

                    <div>
                        <span>
                            {isAuditReport ? "UNVERIFIED / PENDING" : isMissedTaskReport ? "SUPERVISOR COUNT" : "PENDING / MISSED"}
                        </span>

                        <strong>
                            {isAuditReport ? summary.auditUnverified + summary.auditPending : isMissedTaskReport ? filterOptions.users.length : summary.pending + summary.missed}
                        </strong>

                        <small>
                            {isAuditReport ? `${summary.auditUnverified} unverified · ${summary.auditPending} pending review` : isMissedTaskReport ? "Supervisors with tasks in selected report" : `${summary.missed} missed`}
                        </small>
                    </div>
                </div>

            </section>

            {/* FILTER */}

            <section className="reports-filter-card">

                <div className="reports-filter-title">

                    <BarChart3 size={19} />

                    <div>
                        <h2>
                            Generate Report
                        </h2>

                        <p>
                            Select the report type and
                            filters for the required period.
                        </p>
                    </div>

                </div>

                <div className="reports-filter-grid">

                    <div className="report-field">
                        <label>
                            Report Type
                        </label>

                        <select
                            value={reportType}
                            onChange={(event) =>
                                handleReportTypeChange(
                                    event.target.value
                                )
                            }
                        >
                            {reportTypes.map(
                                (type) => (
                                    <option
                                        key={type}
                                        value={type}
                                    >
                                        {type}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="report-field">
                        <label>
                            From Date
                        </label>

                        <div className="report-date-input">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(event) =>
                                    setFromDate(
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="report-field">
                        <label>
                            To Date
                        </label>

                        <div className="report-date-input">
                            <input
                                type="date"
                                min={
                                    fromDate ||
                                    undefined
                                }
                                value={toDate}
                                onChange={(event) =>
                                    setToDate(
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="report-field">
                        <label>
                            Region
                        </label>

                        <select
                            value={region}
                            onChange={(event) =>
                                setRegion(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All Regions
                            </option>

                            {filterOptions.regions.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="report-field">
                        <label>
                            Branch
                        </label>

                        <select
                            value={branch}
                            onChange={(event) =>
                                setBranch(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All Branches
                            </option>

                            {filterOptions.branches.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="report-field">
                        <label>
                            Client
                        </label>

                        <select
                            value={client}
                            onChange={(event) =>
                                setClient(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All Clients
                            </option>

                            {filterOptions.clients.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="report-field">
                        <label>
                            Field Force
                        </label>

                        <select
                            value={user}
                            onChange={(event) =>
                                setUser(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All Users
                            </option>

                            {filterOptions.users.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                </div>

                <div className="reports-filter-actions">

                    <button
                        type="button"
                        className="generate-report-button"
                        onClick={
                            handleGenerate
                        }
                        disabled={loading}
                    >
                        <Search size={17} />

                        {loading
                            ? "GENERATING..."
                            : "GENERATE REPORT"}
                    </button>

                    <button
                        type="button"
                        className="reset-report-button"
                        onClick={
                            handleReset
                        }
                    >
                        <RotateCcw size={16} />

                        RESET
                    </button>

                </div>

            </section>

            {errorMessage && (
                <div
                    className="reports-error"
                >
                    {errorMessage}
                </div>
            )}

            {/* AUDIT DETAIL */}

            {reportType === "Audit Report" &&
                auditDetailLoading && (
                    <section
                        className="reports-results-card"
                        style={{ marginTop: 16 }}
                    >
                        <div className="reports-empty">
                            Loading audit details...
                        </div>
                    </section>
                )}

            {reportType === "Audit Report" &&
                auditDetailError && (
                    <section
                        className="reports-results-card"
                        style={{ marginTop: 16 }}
                    >
                        <div className="reports-error">
                            {auditDetailError}
                        </div>

                        <div
                            style={{
                                marginTop: 14,
                                display: "flex",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    className="pdf-button"
                                    onClick={handleAuditPdf}
                                >
                                    <FileText size={16} />
                                    Export PDF
                                </button>

                                <button
                                    type="button"
                                    className="reset-report-button"
                                    onClick={handleBackFromAudit}
                                >
                                    <ArrowLeft size={16} />
                                    BACK TO REPORT
                                </button>
                            </div>
                        </div>
                    </section>
                )}

            {reportType === "Audit Report" &&
                auditDetail &&
                !auditDetailLoading && (
                    <section
                        className="reports-results-card"
                        style={{ marginTop: 16 }}
                    >
                        <div className="reports-results-header">
                            <div className="reports-results-title">
                                <div className="reports-results-icon">
                                    <ClipboardCheck size={20} />
                                </div>

                                <div>
                                    <h2>
                                        Audit Details
                                    </h2>

                                    <p>
                                        Complete audit questions and submitted answers
                                    </p>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    className="excel-button"
                                    onClick={handleAuditExcel}
                                >
                                    <FileSpreadsheet size={16} />
                                    Export Excel
                                </button>

                                <button
                                    type="button"
                                    className="pdf-button"
                                    onClick={handleAuditPdf}
                                >
                                    <FileText size={16} />
                                    Export PDF
                                </button>

                                <button
                                    type="button"
                                    className="reset-report-button"
                                    onClick={handleBackFromAudit}
                                >
                                    <ArrowLeft size={16} />
                                    BACK TO REPORT
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 12,
                                marginTop: 18,
                            }}
                        >
                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    SUPERVISOR
                                </small>
                                <strong>
                                    {auditDetail?.visit?.user?.name || "-"}
                                </strong>
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    SITE
                                </small>
                                <strong>
                                    {auditDetail?.visit?.site?.name || "-"}
                                </strong>

                                {auditDetail?.visit?.site?.siteCode && (
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#64748b",
                                            marginTop: 4,
                                        }}
                                    >
                                        Code: {auditDetail.visit.site.siteCode}
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    VISIT DATE
                                </small>
                                <strong>
                                    {formatAuditDateTime(
                                        auditDetail?.visit?.visitAt
                                    )}
                                </strong>
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    AUDIT SUBMITTED
                                </small>
                                <strong>
                                    {formatAuditDateTime(
                                        auditDetail?.submittedAt
                                    )}
                                </strong>
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    STATUS
                                </small>
                                <span
                                    className={`report-status ${getStatusClass(
                                        auditDetail?.visit?.status
                                    )}`}
                                >
                                    {auditDetail?.visit?.status || "-"}
                                </span>
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    background: "#f8fafc",
                                }}
                            >
                                <small
                                    style={{
                                        display: "block",
                                        color: "#64748b",
                                        marginBottom: 5,
                                    }}
                                >
                                    AUDIT TEMPLATE
                                </small>
                                <strong>
                                    {auditDetail?.template?.name || "-"}
                                </strong>
                            </div>
                        </div>

                        {(auditDetail?.visit?.site?.city ||
                            auditDetail?.visit?.site?.state) && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        marginTop: 14,
                                        color: "#475569",
                                        fontSize: 14,
                                    }}
                                >
                                    <MapPin size={15} />
                                    {[
                                        auditDetail?.visit?.site?.city,
                                        auditDetail?.visit?.site?.state,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </div>
                            )}

                        <div
                            style={{
                                marginTop: 20,
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "14px 16px",
                                    background: "#f8fafc",
                                    borderBottom:
                                        "1px solid #e5e7eb",
                                    fontWeight: 700,
                                }}
                            >
                                Audit Questions & Answers
                            </div>

                            <div
                                className="reports-table-wrapper"
                                style={{ maxHeight: 620 }}
                            >
                                <table className="reports-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 70 }}>
                                                #
                                            </th>
                                            <th>
                                                Question
                                            </th>
                                            <th style={{ width: 180 }}>
                                                Answer
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(
                                            auditDetail?.answers || []
                                        )
                                            .slice()
                                            .sort(
                                                (a, b) =>
                                                    Number(
                                                        a.questionNo || 0
                                                    ) -
                                                    Number(
                                                        b.questionNo || 0
                                                    )
                                            )
                                            .map(
                                                (
                                                    answer,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            answer.id ||
                                                            `${answer.questionId}-${index}`
                                                        }
                                                    >
                                                        <td>
                                                            {answer.questionNo ||
                                                                index + 1}
                                                        </td>

                                                        <td>
                                                            {answer.questionText ||
                                                                "-"}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`report-status ${getAuditAnswerClass(
                                                                    answer
                                                                )}`}
                                                                style={{
                                                                    maxWidth:
                                                                        260,
                                                                    display:
                                                                        "inline-block",
                                                                    whiteSpace:
                                                                        "normal",
                                                                    lineHeight:
                                                                        1.4,
                                                                }}
                                                            >
                                                                {getAuditAnswer(
                                                                    answer
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}

                                        {(
                                            auditDetail?.answers || []
                                        ).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="reports-empty"
                                                    >
                                                        No audit answers found.
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

            {/* RESULTS */}

            {generated && !auditDetail && !auditDetailLoading && (
                <section className="reports-results-card">

                    <div className="reports-results-header">

                        <div className="reports-results-title">

                            <div className="reports-results-icon">
                                <FileText size={20} />
                            </div>

                            <div>
                                <h2>
                                    Report Results
                                </h2>

                                <p>
                                    {reportType}
                                    {" "}
                                    details for the selected
                                    period
                                </p>
                            </div>

                        </div>

                        <div className="reports-export-actions">

                            <button
                                type="button"
                                className="excel-button"
                                onClick={handleExcel}
                                disabled={loading}
                            >
                                <FileSpreadsheet size={16} />
                                Export Excel
                            </button>

                            <button
                                type="button"
                                className="pdf-button"
                                onClick={
                                    handlePdf
                                }
                                disabled={loading}
                            >
                                <FileText size={16} />
                                Export PDF
                            </button>

                            <button
                                type="button"
                                className="print-button"
                                onClick={
                                    handlePrint
                                }
                            >
                                <Printer size={16} />
                                Print
                            </button>
                            {reportType !== "Distance Report" && (
                                <a className="distance-report-shortcut" href="/distance-report">
                                    <MapPin size={15} /> Distance Details
                                </a>
                            )}

                        </div>
                    </div>

                    <div className="report-result-stats">
                        {isAuditReport ? (
                            <>
                                <div><span>Total Audits Submitted</span><strong>{summary.totalRecords}</strong></div>
                                <div><span>Verified</span><strong className="success-text">{summary.auditVerified}</strong></div>
                                <div><span>Unverified</span><strong className="danger-text">{summary.auditUnverified}</strong></div>
                                <div><span>Pending Review</span><strong className="warning-text">{summary.auditPending}</strong></div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <span>{isMissedTaskReport ? "Missed Tasks" : isTaskReport ? "Tasks Created" : isVisitReport ? "Total Visits" : "Total Distance"}</span>
                                    <strong>{isMissedTaskReport || isTaskReport || isVisitReport ? summary.totalRecords : `${formatDistance(summary.totalDistance)} KM`}</strong>
                                </div>
                                <div><span>{isVisitReport ? "Verified Visits" : "Completed / Verified"}</span><strong className="success-text">{summary.completed}</strong></div>
                                <div><span>{isVisitReport ? "Pending / Unverified Visits" : "Pending"}</span><strong className="warning-text">{summary.pending}</strong></div>
                                <div><span>Missed</span><strong className="danger-text">{summary.missed}</strong></div>
                            </>
                        )}
                    </div>

                    <div className="reports-table-toolbar">

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {reportType === "Audit Report" &&
                                selectedSupervisor && (
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "7px 10px",
                                            borderRadius: 8,
                                            background: "#eff6ff",
                                            color: "#1d4ed8",
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Supervisor: {selectedSupervisor}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSupervisor("");
                                                setUser("");
                                                setPage(1);
                                                fetchReport({
                                                    user: "",
                                                    page: 1,
                                                });
                                            }}
                                            style={{
                                                border: 0,
                                                background: "transparent",
                                                padding: 0,
                                                display: "inline-flex",
                                                cursor: "pointer",
                                                color: "inherit",
                                            }}
                                            title="Clear supervisor filter"
                                        >
                                            <XCircle size={15} />
                                        </button>
                                    </span>
                                )}
                        </div>

                        <div className="reports-search">

                            <input
                                type="text"
                                placeholder="Search report..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target.value
                                    );

                                    setPage(1);
                                }}
                            />

                            <Search size={17} />
                        </div>

                        <span className="report-record-count">
                            {pagination.total} records
                        </span>

                    </div>

                    <div className="reports-table-wrapper">

                        <table className="reports-table">
                            <thead>
                                <tr>
                                    {reportColumns.map((column) => (
                                        <th key={column}>{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={reportColumns.length} className="reports-empty">Generating report...</td></tr>
                                ) : rows.length > 0 ? (
                                    rows.map((item, index) => (
                                        <tr key={item.id || `${item.taskId || "row"}-${index}`}>
                                            {reportColumns.map((column) => {
                                                if (column === "Map") {
                                                    return <td key={column}>
                                                        {item.mapUrl ? <a className="report-action-link" href={item.mapUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> View Map</a> : "-"}
                                                    </td>;
                                                }
                                                if (column === "Check-In Report") {
                                                    return <td key={column}>
                                                        <button type="button" className="report-action-link report-action-button" onClick={() => handleVisitDetail(item)}>
                                                            <Camera size={14} /> View Check-In
                                                        </button>
                                                        {item.checkInPhotoUrl ? <a className="report-action-link report-photo-link" href={item.checkInPhotoUrl} target="_blank" rel="noreferrer">Photo</a> : <span className="report-muted">No photo</span>}
                                                    </td>;
                                                }
                                                if (column === "Audit Review") {
                                                    return <td key={column}>
                                                        <div className="report-link-stack">
                                                            <button type="button" className="report-action-link report-action-button" disabled={!item.visitId || loading} onClick={() => handleAuditClick(item)}><Eye size={14} /> Review Audit</button>
                                                            {item.auditReviewUrl ? <a className="report-action-link report-photo-link" href={item.auditReviewUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Open Report</a> : <span className="report-muted">No link</span>}
                                                        </div>
                                                    </td>;
                                                }
                                                if (column === "Status" || column === "Visit Status" || column === "Verification Status" || column === "Check-In Status") {
                                                    const status = getRowCell(item, column, index);
                                                    return <td key={column}><span className={`report-status ${getStatusClass(status)}`}>{status}</span></td>;
                                                }
                                                if (column === "Field Force" && isAuditReport) {
                                                    return <td key={column} className="report-user"><button type="button" className="report-text-link" onClick={() => handleSupervisorClick(item.user)}>{item.user || "-"}</button></td>;
                                                }
                                                return <td key={column}>{getRowCell(item, column, index)}</td>;
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={reportColumns.length} className="reports-empty">No matching records found</td></tr>
                                )}
                            </tbody>
                        </table>

                    </div>

                    <div className="reports-footer">

                        <span>
                            Showing{" "}
                            {showingFrom} to{" "}
                            {showingTo} of{" "}
                            {pagination.total}{" "}
                            entries
                        </span>

                        <div className="reports-page-size">

                            <span>
                                Show
                            </span>

                            <select
                                value={pageSize}
                                onChange={(event) => {
                                    setPageSize(
                                        event.target.value
                                    );

                                    setPage(1);
                                }}
                            >
                                <option value="10">
                                    10
                                </option>

                                <option value="25">
                                    25
                                </option>

                                <option value="50">
                                    50
                                </option>

                                <option value="100">
                                    100
                                </option>
                            </select>

                            <span>
                                entries
                            </span>

                        </div>

                        <div className="reports-pagination">

                            <button
                                disabled={
                                    loading ||
                                    pagination.page <=
                                    1
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current - 1
                                    )
                                }
                            >
                                Previous
                            </button>

                            {paginationPages.map(
                                (
                                    pageNumber
                                ) => (
                                    <button
                                        key={
                                            pageNumber
                                        }
                                        className={
                                            pageNumber ===
                                                pagination.page
                                                ? "active"
                                                : ""
                                        }
                                        disabled={
                                            loading
                                        }
                                        onClick={() =>
                                            setPage(
                                                pageNumber
                                            )
                                        }
                                    >
                                        {
                                            pageNumber
                                        }
                                    </button>
                                )
                            )}

                            <button
                                disabled={
                                    loading ||
                                    pagination.page >=
                                    pagination.totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current + 1
                                    )
                                }
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </section>
            )}

            {visitDetail && (
                <div className="report-detail-backdrop" onClick={() => setVisitDetail(null)}>
                    <section className="report-detail-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="report-detail-header">
                            <div>
                                <h2>Visit / Check-In Report</h2>
                                <p>{visitDetail.site || "-"} · {visitDetail.user || "-"}</p>
                            </div>
                            <button type="button" onClick={() => setVisitDetail(null)} aria-label="Close visit details">×</button>
                        </div>
                        <div className="report-detail-grid">
                            <div><span>Visit Date & Time</span><strong>{visitDetail.dateTime || visitDetail.date || "-"}</strong></div>
                            <div><span>Check-In</span><strong>{visitDetail.checkIn || "-"}</strong></div>
                            <div><span>Check-Out</span><strong>{visitDetail.checkOut || "-"}</strong></div>
                            <div><span>Check-In Status</span><strong>{visitDetail.checkInStatus || "-"}</strong></div>
                            <div><span>Visit Status</span><strong>{visitDetail.visitStatus || visitDetail.status || "-"}</strong></div>
                            <div><span>Task Type</span><strong>{visitDetail.taskType || visitDetail.type || "-"}</strong></div>
                            <div><span>Client</span><strong>{visitDetail.client || "-"}</strong></div>
                            <div><span>Address</span><strong>{visitDetail.address || "-"}</strong></div>
                            <div><span>Distance</span><strong>{visitDetail.distance || "0.00"} KM</strong></div>
                        </div>
                        {(visitDetail.checkInPhotoUrl || visitDetail.photoUrl) ? (
                            <div className="report-detail-photo-wrap">
                                <h3>Check-In Photo / Site Evidence</h3>
                                <a href={visitDetail.checkInPhotoUrl || visitDetail.photoUrl} target="_blank" rel="noreferrer">
                                    <img src={visitDetail.checkInPhotoUrl || visitDetail.photoUrl} alt="Supervisor check-in evidence" />
                                </a>
                                <a className="report-action-link" href={visitDetail.checkInPhotoUrl || visitDetail.photoUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open original photo</a>
                            </div>
                        ) : (
                            <p className="report-muted">No check-in photo was saved for this visit.</p>
                        )}
                        <div className="report-detail-actions">
                            {visitDetail.mapUrl && <a className="generate-report-button" href={visitDetail.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> Open Site Location</a>}
                            <button type="button" className="reset-report-button" onClick={() => setVisitDetail(null)}>Close</button>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
};

export default Reports;
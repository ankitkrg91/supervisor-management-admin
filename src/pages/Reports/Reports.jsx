import { useEffect, useMemo, useState } from "react";

import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Eye,
    FileSpreadsheet,
    FileText,
    MapPin,
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
    "Check-In / Check-Out Report",
    "Field Force Performance",
    "Distance Report",
];

const formatDistance = (value) => {
    const number = Number(value);

    return Number.isNaN(number)
        ? "0.00"
        : number.toFixed(2);
};

const Reports = () => {
    const [reportType, setReportType] =
        useState("Task Report");

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
                    fromDate
                );
            }

            if (currentToDate) {
                params.set(
                    "toDate",
                    toDate
                );
            }

            if (currentRegion) {
                params.set(
                    "region",
                    region
                );
            }

            if (currentBranch) {
                params.set(
                    "branch",
                    branch
                );
            }

            if (currentClient) {
                params.set(
                    "client",
                    client
                );
            }

            if (currentUser) {
                params.set(
                    "user",
                    user
                );
            }

            if (currentSearch.trim()) {
                params.set(
                    "search",
                    search.trim()
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
    };

    const handleReportTypeChange = (
        value
    ) => {
        setReportType(value);

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
            const exportRows = rows.map((item, index) => ({
                "#": index + 1,
                Date: item.date || "-",
                "Field Force": item.user || "-",
                Client: item.client || "-",
                Site: item.site || "-",
                "Task / Visit Type": item.type || "-",
                Status: item.status || "-",
                "Check In": item.checkIn || "-",
                "Check Out": item.checkOut || "-",
                "Distance (KM)": item.distance || "0.00",
            }));

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

            worksheet["!cols"] = [
                { wch: 6 },
                { wch: 15 },
                { wch: 25 },
                { wch: 25 },
                { wch: 25 },
                { wch: 25 },
                { wch: 18 },
                { wch: 15 },
                { wch: 15 },
                { wch: 17 },
            ];

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

            const tableHead = [
                "#",
                "Date",
                "Field Force",
                "Client",
                "Site",
                "Task / Visit Type",
                "Status",
                "Check In",
                "Check Out",
                "Distance (KM)",
            ];

            const tableBody = rows.map((item, index) => [
                index + 1,
                item.date || "-",
                item.user || "-",
                item.client || "-",
                item.site || "-",
                item.type || "-",
                item.status || "-",
                item.checkIn || "-",
                item.checkOut || "-",
                item.distance || "0.00",
            ]);

            if (tableBody.length === 0) {
                autoTable(doc, {
                    startY: metaY + 7,
                    head: [tableHead],
                    body: [["", "", "", "", "No records found", "", "", "", "", ""]],
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
                        fontSize: 7.5,
                        cellPadding: 2.5,
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

    const handlePrint = () => {
        window.print();
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
                            TOTAL RECORDS
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
                            COMPLETED / VERIFIED
                        </span>

                        <strong>
                            {
                                summary.completed
                            }
                        </strong>

                        <small>
                            Successful records
                        </small>
                    </div>
                </div>

                <div className="report-summary-card red">
                    <div className="report-summary-icon">
                        <XCircle size={23} />
                    </div>

                    <div>
                        <span>
                            PENDING / MISSED
                        </span>

                        <strong>
                            {
                                summary.pending +
                                summary.missed
                            }
                        </strong>

                        <small>
                            {
                                summary.missed
                            } missed
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

                            <CalendarDays
                                size={16}
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

                            <CalendarDays
                                size={16}
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

                        </div>
                    </div>

                    <div className="report-result-stats">

                        <div>
                            <span>
                                Total Distance
                            </span>

                            <strong>
                                {
                                    formatDistance(
                                        summary.totalDistance
                                    )
                                } KM
                            </strong>
                        </div>

                        <div>
                            <span>
                                Completed / Verified
                            </span>

                            <strong className="success-text">
                                {
                                    summary.completed
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Pending
                            </span>

                            <strong className="warning-text">
                                {
                                    summary.pending
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Missed
                            </span>

                            <strong className="danger-text">
                                {
                                    summary.missed
                                }
                            </strong>
                        </div>

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
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Field Force</th>
                                    <th>Client</th>
                                    <th>Site</th>
                                    <th>
                                        Task / Visit Type
                                    </th>
                                    <th>Status</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Distance (KM)</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="reports-empty"
                                        >
                                            Generating report...
                                        </td>
                                    </tr>
                                ) : rows.length > 0 ? (
                                    rows.map(
                                        (item, index) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        (
                                                            pagination.page -
                                                            1
                                                        ) *
                                                        pagination.limit +
                                                        index +
                                                        1
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.date
                                                    }
                                                </td>

                                                <td className="report-user">
                                                    {reportType === "Audit Report" ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleSupervisorClick(
                                                                    item.user
                                                                );
                                                            }}
                                                            title="Show this supervisor's audits"
                                                            style={{
                                                                border: 0,
                                                                background: "transparent",
                                                                padding: 0,
                                                                margin: 0,
                                                                font: "inherit",
                                                                color: "inherit",
                                                                cursor: "pointer",
                                                                textAlign: "left",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {item.user}
                                                        </button>
                                                    ) : (
                                                        item.user
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        item.client
                                                    }
                                                </td>

                                                <td>
                                                    <span className="report-site">
                                                        <MapPin size={13} />
                                                        {
                                                            item.site
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {reportType === "Audit Report" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleAuditClick(
                                                                    item
                                                                )
                                                            }
                                                            disabled={
                                                                !item.visitId ||
                                                                loading
                                                            }
                                                            title={
                                                                item.visitId
                                                                    ? "Open audit details"
                                                                    : "Audit visit ID is not available"
                                                            }
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 6,
                                                                border: 0,
                                                                background: "transparent",
                                                                padding: 0,
                                                                margin: 0,
                                                                font: "inherit",
                                                                color: "#2563eb",
                                                                cursor: item.visitId
                                                                    ? "pointer"
                                                                    : "not-allowed",
                                                                textAlign: "left",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {item.type}
                                                            <Eye size={14} />
                                                        </button>
                                                    ) : (
                                                        item.type
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`report-status ${getStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {
                                                            item.status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {
                                                        item.checkIn
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.checkOut
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.distance
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
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

        </div>
    );
};

export default Reports;
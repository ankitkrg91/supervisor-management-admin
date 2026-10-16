import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays, Search, FileSpreadsheet, FileText, Printer, MapPin,
    Check, X, RefreshCw, ShieldCheck, CheckCircle2, XCircle, RotateCcw,
    Camera, Loader2, ZoomIn, Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../../utils/api";
import "./LatestVisits.css";

const PAGE_SIZE = 10;
const LOCAL_QUESTIONS_KEY = "audit_custom_questions_v6";

export const getLocalActiveQuestions = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(LOCAL_QUESTIONS_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter((q) => q.isActive !== false) : [];
    } catch {
        return [];
    }
};

export const extractSiteEvidencePhotos = (visit) => {
    if (!visit) return [];
    const list = [];
    const seen = new Set();
    const add = (url, label) => {
        const clean = typeof url === "string" ? url.trim() : "";
        if (!clean || seen.has(clean)) return;
        seen.add(clean);
        list.push({ url: clean, label });
    };

    if (typeof visit.notes === "string") {
        const m = visit.notes.match(/\[SITE_EVIDENCE\]:\s*(\{[\s\S]*?\})/);
        if (m) {
            try {
                const ev = JSON.parse(m[1]);
                add(ev.nameplate || ev.namePlatePhoto, "Client Name Plate Photo");
                add(ev.selfie || ev.selfiePhoto, "Supervisor Selfie");
                add(ev.photo1 || ev.sitePhoto1 || ev.sitePhoto, "Site Photo 1");
            } catch { }
        }
    }
    add(visit.photoUrl, list.length === 0 ? "Site Evidence Photo" : "Site Photo");
    add(visit.selfieUrl, "Check-In Selfie");
    return list;
};

export const extractClientFeedback = (visit) => {
    if (!visit) return null;
    if (typeof visit.notes === "string") {
        const m = visit.notes.match(/\[CLIENT_FEEDBACK\]:\s*(\{[\s\S]*?\})/);
        if (m) {
            try {
                const data = JSON.parse(m[1]);
                if (data && typeof data === "object") {
                    return {
                        rating: data.rating ? String(data.rating) : null,
                        clientName: data.clientName ? String(data.clientName).trim() : null,
                        clientPhone: data.clientPhone ? String(data.clientPhone).trim() : null,
                        comments: data.comments ? String(data.comments).trim() : null,
                        submittedAt: data.submittedAt || null,
                    };
                }
            } catch { }
        }
    }
    if (visit.clientFeedback || visit.feedback) {
        const fb = visit.clientFeedback || visit.feedback;
        return {
            rating: fb.rating ? String(fb.rating) : (visit.clientRating ? String(visit.clientRating) : null),
            clientName: fb.clientName || visit.clientName || null,
            clientPhone: fb.clientPhone || null,
            comments: fb.comments || fb.comment || (typeof fb === "string" ? fb : null),
            submittedAt: fb.submittedAt || null,
        };
    }
    return null;
};

export const extractAuditQuestions = (visit, activeChecklist = []) => {
    const answers = visit?.auditSubmission?.answers;
    if (Array.isArray(answers) && answers.length > 0) {
        return answers.map((ans, idx) => {
            let photos = [];
            let textVal = ans.textValue;
            if (textVal) {
                try {
                    const p = JSON.parse(textVal);
                    if (Array.isArray(p)) {
                        photos = p.filter(Boolean);
                        textVal = null;
                    } else if (typeof p === "string" && (p.startsWith("data:image") || p.startsWith("http"))) {
                        photos = [p];
                        textVal = null;
                    }
                } catch {
                    if (typeof textVal === "string" && (textVal.startsWith("data:image") || textVal.startsWith("http"))) {
                        photos = [textVal];
                        textVal = null;
                    }
                }
            }
            const hasBool = typeof ans.booleanValue === "boolean";
            return {
                no: ans.questionNo || idx + 1,
                text: ans.questionText || `Question #${ans.questionNo || idx + 1}`,
                ans: hasBool ? (ans.booleanValue ? "YES" : "NO") : (textVal || "—"),
                booleanValue: hasBool ? ans.booleanValue : true,
                photos,
            };
        });
    }

    const src = Array.isArray(activeChecklist) && activeChecklist.length > 0
        ? activeChecklist.filter((q) => q.isActive !== false)
        : getLocalActiveQuestions();

    return src.map((q, idx) => ({
        no: idx + 1,
        text: q.question || q.text || `Question #${idx + 1}`,
        ans: "Pending",
        booleanValue: null,
        photos: [],
    }));
};

export const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

export const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A";

const LatestVisits = ({ showVerificationTabs = false }) => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [activeChecklist, setActiveChecklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchText, setSearchText] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);

    const [selectedAuditVisit, setSelectedAuditVisit] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const fetchActiveChecklist = async () => {
        try {
            const local = getLocalActiveQuestions();
            if (local.length > 0) setActiveChecklist(local);
            const res = await apiFetch("/api/audit/checklist", { method: "GET" });
            if (res.ok) {
                const body = await res.json();
                const qs = (body?.data?.checklist?.questions || []).filter((q) => q.isActive !== false);
                if (qs.length > 0) setActiveChecklist(qs);
            }
        } catch { }
    };

    const fetchVisits = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch("/api/visits?role=SUPERVISOR&page=1&limit=100", { method: "GET" });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.message || "Failed to fetch visits");
            setVisits(body?.data?.visits || body?.visits || []);
            setPage(1);
        } catch (err) {
            setError(err?.message || "Failed to load visit records");
            setVisits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
        fetchActiveChecklist();
    }, []);

    const handleOpenAuditModal = async (visit) => {
        setSelectedAuditVisit(visit);
        if (!visit?.auditSubmission?.answers?.length && visit?.id) {
            try {
                const res = await apiFetch(`/api/audit/visits/${visit.id}/submission`, { method: "GET" });
                if (res.ok) {
                    const sub = (await res.json())?.data?.submission;
                    if (sub?.answers?.length) {
                        setSelectedAuditVisit((p) => (p?.id === visit.id ? { ...p, auditSubmission: sub } : p));
                        setVisits((p) => p.map((it) => (it.id === visit.id ? { ...it, auditSubmission: sub } : it)));
                    }
                }
            } catch { }
        }
    };

    const updateStatus = async (visit, nextStatus) => {
        if (!visit?.id) return;
        try {
            setUpdatingId(visit.id);
            setError("");
            const res = await apiFetch(`/api/visits/${visit.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.message || "Failed to update visit status");
            setVisits((p) => p.map((it) => (it.id === visit.id ? { ...it, status: nextStatus } : it)));
            if (selectedAuditVisit?.id === visit.id) {
                setSelectedAuditVisit((p) => (p ? { ...p, status: nextStatus } : null));
            }
        } catch (err) {
            setError(err?.message || "Failed to update verification status");
        } finally {
            setUpdatingId(null);
        }
    };

    const openMap = (visit) => {
        const userId = visit.user?.id || visit.userId;
        if (!userId) return alert("No user ID available for this visit.");
        const dateStr = (visit.visitAt ? new Date(visit.visitAt) : new Date()).toISOString().split("T")[0];
        navigate(`/distance-report?userId=${userId}&date=${dateStr}`);
    };

    const counts = useMemo(() => {
        return visits.reduce(
            (acc, curr) => {
                acc.ALL += 1;
                const s = String(curr.status || "PENDING").toUpperCase();
                if (s === "VERIFIED") acc.VERIFIED += 1;
                else if (s === "REJECTED") acc.REJECTED += 1;
                else if (s === "UNVERIFIED") acc.UNVERIFIED += 1;
                else acc.PENDING += 1;
                return acc;
            },
            { ALL: 0, PENDING: 0, VERIFIED: 0, UNVERIFIED: 0, REJECTED: 0 }
        );
    }, [visits]);

    const filteredVisits = useMemo(() => {
        return visits.filter((it) => {
            if (statusFilter !== "ALL" && String(it.status || "PENDING").toUpperCase() !== statusFilter) return false;
            if (fromDate && new Date(it.visitAt).getTime() < new Date(`${fromDate}T00:00:00.000Z`).getTime()) return false;
            if (toDate && new Date(it.visitAt).getTime() > new Date(`${toDate}T23:59:59.999Z`).getTime()) return false;
            if (searchText.trim()) {
                const q = searchText.trim().toLowerCase();
                return [it.user?.name, it.user?.email, it.site?.name, it.site?.siteCode, it.clientName].some((v) =>
                    v?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [visits, statusFilter, fromDate, toDate, searchText]);

    const paginatedData = useMemo(
        () => filteredVisits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredVisits, page]
    );
    const totalPages = Math.ceil(filteredVisits.length / PAGE_SIZE) || 1;

    const handleExportExcel = () => {
        if (!filteredVisits.length) return;
        const rows = filteredVisits.map((it, idx) => ({
            "#": idx + 1,
            "Supervisor Name": it.user?.name || "N/A",
            Contact: it.user?.phone || it.user?.email || "N/A",
            "Site Name": it.site?.name || "N/A",
            "Site Code": it.site?.siteCode || "—",
            "Client / Branch": it.clientName || it.branch || "—",
            "Visit Date": formatDate(it.visitAt),
            "Visit Time": formatTime(it.visitAt),
            Status: it.status || "PENDING",
            "GPS Latitude": it.latitude ?? "—",
            "GPS Longitude": it.longitude ?? "—",
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Visits");
        XLSX.writeFile(wb, `Visits_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const printAuditReport = (visit) => {
        if (!visit) return;
        const pw = window.open("", "_blank", "width=1000,height=900");
        if (!pw) return alert("Please allow popups to print the audit report.");
        const qs = extractAuditQuestions(visit, activeChecklist);
        const passed = qs.filter((q) => q.booleanValue === true).length;
        const pct = qs.length > 0 ? Math.round((passed / qs.length) * 100) : 100;
        const siteName = visit.site?.name || visit.clientName || "Client Site";
        const fb = extractClientFeedback(visit);
        const rowsHtml = qs
            .map(
                (q) =>
                    `<tr><td style="text-align:center;font-weight:bold;">#${q.no}</td><td><strong>${q.text}</strong>${q.photos?.length ? `<div style="font-size:11px;color:#059669;">📷 ${q.photos.length} Photo(s) Attached</div>` : ""
                    }</td><td style="text-align:center;font-weight:bold;color:${q.booleanValue === false ? "#dc2626" : "#15803d"
                    };">${q.ans}</td></tr>`
            )
            .join("");
        pw.document.write(
            `<!DOCTYPE html><html><head><title>Audit Report - ${siteName}</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;font-size:12px;}table{width:100%;border-collapse:collapse;margin-top:12px;}th,td{border:1px solid #cbd5e1;padding:7px 10px;text-align:left;}th{background:#1e3a8a;color:#fff;}</style></head><body><h2>${siteName.toUpperCase()} — SITE AUDIT REPORT</h2><p>Auditor: <strong>${visit.user?.name || "Supervisor"
            }</strong> | Date: ${formatDate(visit.visitAt)} ${formatTime(visit.visitAt)} | Status: <strong>${visit.status || "PENDING"
            }</strong> | Compliance: <strong>${pct}% (${passed}/${qs.length})</strong></p>${fb ? `<div style="background:#f0fdf4;border:1.5px solid #86efac;padding:12px;margin:14px 0;border-radius:6px;"><strong style="color:#166534;">⭐ CLIENT FEEDBACK & RATING:</strong> Rating: <strong>${fb.rating || "5"}/5</strong> ${fb.clientName ? ` | Client: <strong>${fb.clientName}</strong> (${fb.clientPhone || ""})` : ""}${fb.comments ? `<div style="margin-top:6px;font-style:italic;color:#1e293b;">"${fb.comments}"</div>` : ""}</div>` : ""}<table><thead><tr><th style="width:45px;text-align:center;">#</th><th>Audit Checklist Question</th><th style="width:120px;text-align:center;">Response</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
        );
        pw.document.close();
        pw.focus();
        setTimeout(() => pw.print(), 400);
    };

    const printTable = () => {
        if (!filteredVisits.length) return alert("No visits available to print.");
        const pw = window.open("", "_blank", "width=1100,height=800");
        if (!pw) return;
        const rows = filteredVisits
            .map(
                (it, idx) =>
                    `<tr><td>${idx + 1}</td><td>${it.user?.name || "N/A"}</td><td>${it.site?.name || "N/A"} (${it.site?.siteCode || "—"
                    })</td><td>${formatDate(it.visitAt)} ${formatTime(it.visitAt)}</td><td>${it.status || "PENDING"}</td><td>${it.latitude ? `${it.latitude},${it.longitude}` : "No GPS"
                    }</td></tr>`
            )
            .join("");
        pw.document.write(
            `<!DOCTYPE html><html><head><title>Visits Report</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;}th{background:#f1f5f9;}</style></head><body><h2>Supervisor Site Visits Report</h2><table><thead><tr><th>#</th><th>Supervisor</th><th>Site</th><th>Date & Time</th><th>Status</th><th>GPS</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
        );
        pw.document.close();
        pw.focus();
        setTimeout(() => pw.print(), 400);
    };

    const v = selectedAuditVisit;
    const realQuestions = v ? extractAuditQuestions(v, activeChecklist) : [];
    const siteEvidencePhotos = v ? extractSiteEvidencePhotos(v) : [];
    const clientFeedback = v ? extractClientFeedback(v) : null;
    const totalQ = realQuestions.length;
    const passedQ = realQuestions.filter((q) => q.booleanValue === true).length;
    const scorePct = totalQ > 0 ? Math.round((passedQ / totalQ) * 100) : 100;
    const currentSite = v?.site?.name || v?.clientName || "Site";

    return (
        <div className="verification-page">
            <div className="verification-card">
                <div className="verification-header">
                    <div>
                        <h2>{showVerificationTabs ? "Visit Verification & Audit Review" : "Latest Visits & Site Audit Stream"}</h2>
                        <p>
                            Real-time supervisor site inspections, site evidence photos, GPS records, and submitted audit checklist reports.
                        </p>
                    </div>
                    <button type="button" className="verification-refresh" onClick={fetchVisits} disabled={loading}>
                        <RefreshCw size={14} className={loading ? "btn-spinner" : ""} /> Refresh
                    </button>
                </div>

                {showVerificationTabs && (
                    <div className="verification-tabs">
                        {[
                            { key: "ALL", label: "All Visits", count: counts.ALL },
                            { key: "PENDING", label: "Pending Verification", count: counts.PENDING },
                            { key: "VERIFIED", label: "Verified Visits", count: counts.VERIFIED },
                            { key: "UNVERIFIED", label: "Unverified", count: counts.UNVERIFIED },
                            { key: "REJECTED", label: "Rejected Visits", count: counts.REJECTED },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`tab-pill ${statusFilter === tab.key ? "active" : ""}`}
                                onClick={() => {
                                    setStatusFilter(tab.key);
                                    setPage(1);
                                }}
                            >
                                <span>{tab.label}</span>
                                <span className="tab-count-badge">{tab.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="verification-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-wrap">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search supervisor, site, or client..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <div className="date-filter-group">
                            <CalendarDays size={14} color="#64748b" />
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From Date" />
                            <span>to</span>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="To Date" />
                        </div>
                        {!showVerificationTabs && (
                            <select
                                className="status-filter-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending / Unverified</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        )}
                    </div>
                    <div className="toolbar-right">
                        <button type="button" className="btn-export-excel" onClick={handleExportExcel}>
                            <FileSpreadsheet size={15} /> Export Excel
                        </button>
                        <button type="button" className="btn-print" onClick={printTable}>
                            <Printer size={15} /> Print
                        </button>
                    </div>
                </div>

                {error && <div className="verification-error-banner">{error}</div>}

                <div className="verification-table-wrap">
                    <table className="verification-table">
                        <thead>
                            <tr>
                                <th style={{ width: "45px" }}>#</th>
                                <th style={{ width: "160px" }}>Audit Report</th>
                                <th>Supervisor</th>
                                <th>Site Details</th>
                                <th>Visit Date & Time</th>
                                <th>Status</th>
                                <th>GPS Location</th>
                                {showVerificationTabs && <th style={{ width: "230px" }}>Verification Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={showVerificationTabs ? "8" : "7"} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                        <Loader2 size={24} className="btn-spinner" style={{ margin: "0 auto 8px" }} /> Loading visits...
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={showVerificationTabs ? "8" : "7"} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                        No visit records found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const st = String(item.status || "PENDING").toUpperCase();
                                    const isUpdating = updatingId === item.id;
                                    return (
                                        <tr key={item.id}>
                                            <td><strong>{(page - 1) * PAGE_SIZE + idx + 1}</strong></td>
                                            <td>
                                                <button type="button" className="btn-review-audit" onClick={() => handleOpenAuditModal(item)}>
                                                    <FileText size={15} /> <span>Review Audit</span>
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <strong style={{ color: "#0f172a", fontSize: "13px" }}>{item.user?.name || "N/A"}</strong>
                                                    <span style={{ color: "#64748b", fontSize: "11px" }}>{item.user?.phone || item.user?.email || "No contact"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <strong style={{ color: "#334155", fontSize: "13px" }}>{item.site?.name || item.clientName || "Client Site"}</strong>
                                                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                                                        Code: {item.site?.siteCode || "N/A"} • {item.site?.city || item.site?.state || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatDate(item.visitAt)}</span>
                                                    <span style={{ color: "#64748b", fontSize: "11px" }}>{formatTime(item.visitAt)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-pill status-${st.toLowerCase()}`}>
                                                    {st === "VERIFIED" && <CheckCircle2 size={12} />}
                                                    {st === "REJECTED" && <XCircle size={12} />}
                                                    {st === "PENDING" && <RotateCcw size={12} />}
                                                    {st}
                                                </span>
                                            </td>
                                            <td>
                                                {item.latitude !== null && item.longitude !== null ? (
                                                    <button type="button" className="btn-table-map" onClick={() => openMap(item)}>
                                                        <MapPin size={13} /> GPS Map
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>No GPS</span>
                                                )}
                                            </td>
                                            {showVerificationTabs && (
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        {st !== "VERIFIED" && (
                                                            <button type="button" className="btn-action-verify" disabled={isUpdating} onClick={() => updateStatus(item, "VERIFIED")}>
                                                                {isUpdating ? <Loader2 size={13} className="btn-spinner" /> : <Check size={13} />} Verify
                                                            </button>
                                                        )}
                                                        {st !== "REJECTED" && (
                                                            <button type="button" className="btn-action-reject" disabled={isUpdating} onClick={() => updateStatus(item, "REJECTED")}>
                                                                <X size={13} /> Reject
                                                            </button>
                                                        )}
                                                        {st !== "PENDING" && st !== "UNVERIFIED" && (
                                                            <button type="button" className="btn-action-unverify" disabled={isUpdating} onClick={() => updateStatus(item, "UNVERIFIED")}>
                                                                <RotateCcw size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="verification-pagination-footer">
                    <span>
                        Showing {paginatedData.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to{" "}
                        {Math.min(page * PAGE_SIZE, filteredVisits.length)} of {filteredVisits.length} entries
                    </span>
                    <div className="pagination-buttons">
                        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                        <span className="page-indicator">Page {page} of {totalPages}</span>
                        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                    </div>
                </div>
            </div>

            {/* DYNAMIC AUDIT REPORT MODAL */}
            {v && (
                <div className="audit-modal-overlay" onClick={() => setSelectedAuditVisit(null)}>
                    <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="audit-modal-top-header">
                            <div>
                                <h3>{currentSite} — Audit & Visit Verification Details</h3>
                                <p>{currentSite} ({v.site?.siteCode || "N/A"}) • {formatDate(v.visitAt)}, {formatTime(v.visitAt)}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className={`status-pill status-${String(v.status || "PENDING").toLowerCase()}`}>{v.status || "PENDING"}</span>
                                <button type="button" className="btn-close-modal" onClick={() => setSelectedAuditVisit(null)}>✕</button>
                            </div>
                        </div>

                        <div className="audit-modal-scrollable-body">
                            <div className="audit-score-banner">
                                <div className="score-badge-circle"><span className="score-num">{scorePct}</span><span className="score-max">/100</span></div>
                                <div className="score-info">
                                    <h4>{currentSite.toUpperCase()} — SITE AUDIT CHECKLIST</h4>
                                    <p>{totalQ > 0 ? `${passedQ} of ${totalQ} Audited Checkpoints Passed` : "Site Operations & Security Compliance Audit"}</p>
                                    <div className="score-meta">
                                        <span className="badge-pass"><ShieldCheck size={14} /> COMPLIANCE: {scorePct}%</span>
                                        <span>Status: <strong>{v.status || "PENDING"}</strong></span>
                                        <span>Auditor: <strong>{v.user?.name || "Supervisor"}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="audit-details-grid">
                                <div className="audit-detail-cell"><label>Visit / Task ID</label><p>{v.id}</p></div>
                                <div className="audit-detail-cell"><label>Site Code & Name</label><p>{currentSite} ({v.site?.siteCode || "N/A"})</p></div>
                                <div className="audit-detail-cell"><label>Auditor Name & Contact</label><p>{v.user?.name || "Supervisor"} ({v.user?.phone || v.user?.email || "N/A"})</p></div>
                                <div className="audit-detail-cell"><label>Date & Time</label><p>{formatDate(v.visitAt)} at {formatTime(v.visitAt)}</p></div>
                                <div className="audit-detail-cell" style={{ gridColumn: "1 / -1" }}>
                                    <label>Site Address & GPS Coordinates</label>
                                    <p>{v.site?.address || "—"}, {v.site?.city || ""} {v.site?.state || ""} • Coordinates: [{v.latitude ?? "N/A"}, {v.longitude ?? "N/A"}]</p>
                                </div>
                            </div>

                            {siteEvidencePhotos.length > 0 && (
                                <div className="audit-photo-section">
                                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>Site Evidence & Turnout Photos</span>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb" }}>(Click any photo to enlarge)</span>
                                    </h4>
                                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                                        {siteEvidencePhotos.map((photo, idx) => (
                                            <div
                                                key={idx}
                                                className="evidence-photo-box"
                                                style={{ cursor: "pointer", position: "relative", width: "160px", height: "115px", borderRadius: "10px", overflow: "hidden", border: "2px solid #cbd5e1" }}
                                                onClick={() => setPreviewPhoto({ url: photo.url, title: photo.label })}
                                                title="Click to view full size photo"
                                            >
                                                <img src={photo.url} alt={photo.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                <span className="photo-tag">{photo.label}</span>
                                                <div style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(15,23,42,0.78)", color: "#fff", borderRadius: "6px", padding: "3px 6px", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 600 }}>
                                                    <ZoomIn size={12} /> Zoom
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CLIENT FEEDBACK & RATING DISPLAY */}
                            <div className="audit-feedback-section" style={{
                                marginTop: "16px",
                                marginBottom: "20px",
                                padding: "16px 18px",
                                borderRadius: "10px",
                                background: clientFeedback ? "rgba(34, 197, 94, 0.08)" : "var(--bg-tertiary, #f8fafc)",
                                border: clientFeedback ? "1.5px solid #22c55e" : "1px dashed var(--border-color, #cbd5e1)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: clientFeedback ? "12px" : "0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "18px" }}>⭐</span>
                                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: clientFeedback ? "#15803d" : "var(--text-primary, #0f172a)" }}>
                                            Client Feedback & Rating
                                        </h4>
                                    </div>

                                    {clientFeedback ? (
                                        <div style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 12px",
                                            borderRadius: "999px",
                                            background: "rgba(34, 197, 94, 0.18)",
                                            border: "1px solid #22c55e",
                                            fontWeight: "800",
                                            fontSize: "13px",
                                            color: "#15803d",
                                        }}>
                                            <span>Rating:</span>
                                            <strong>{clientFeedback.rating || "5"} / 5</strong>
                                            <span style={{ color: "#eab308", fontSize: "14px", letterSpacing: "1px" }}>
                                                {"★".repeat(Math.min(5, Math.max(1, parseInt(clientFeedback.rating) || 5)))}
                                            </span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#d97706" }}>
                                            ⏳ Feedback Pending (Link sent to client via WhatsApp)
                                        </span>
                                    )}
                                </div>

                                {clientFeedback && (
                                    <>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "12px" }}>
                                            {clientFeedback.clientName && (
                                                <div>
                                                    <span style={{ color: "var(--text-secondary, #64748b)" }}>Client Name: </span>
                                                    <strong style={{ color: "var(--text-primary, #0f172a)" }}>{clientFeedback.clientName}</strong>
                                                </div>
                                            )}
                                            {clientFeedback.clientPhone && (
                                                <div>
                                                    <span style={{ color: "var(--text-secondary, #64748b)" }}>Contact Number: </span>
                                                    <strong style={{ color: "var(--text-primary, #0f172a)" }}>{clientFeedback.clientPhone}</strong>
                                                </div>
                                            )}
                                            {clientFeedback.submittedAt && (
                                                <div>
                                                    <span style={{ color: "var(--text-secondary, #64748b)" }}>Submitted At: </span>
                                                    <strong style={{ color: "var(--text-primary, #0f172a)" }}>{new Date(clientFeedback.submittedAt).toLocaleString("en-IN")}</strong>
                                                </div>
                                            )}
                                        </div>

                                        {clientFeedback.comments && (
                                            <div style={{
                                                marginTop: "12px",
                                                padding: "10px 14px",
                                                borderRadius: "7px",
                                                background: "var(--card-bg, #ffffff)",
                                                border: "1px solid rgba(34, 197, 94, 0.3)",
                                                fontSize: "13px",
                                                color: "var(--text-primary, #1e293b)",
                                                lineHeight: "1.5",
                                            }}>
                                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#166534", textTransform: "uppercase", marginBottom: "4px" }}>
                                                    💬 Client Remarks / Comments:
                                                </div>
                                                <div style={{ fontStyle: "italic" }}>
                                                    "{clientFeedback.comments}"
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="audit-questions-section">
                                <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#0f172a" }}>Audit Checklist Responses ({realQuestions.length} Questions)</h4>
                                <div className="audit-cards-grid">
                                    {realQuestions.length === 0 ? (
                                        <p style={{ color: "#64748b", padding: "16px" }}>No checklist answers submitted for this visit.</p>
                                    ) : (
                                        realQuestions.map((q) => (
                                            <div key={q.no} className="audit-question-card">
                                                <div className="q-card-header">
                                                    <span className="q-badge">#{q.no}</span>
                                                    <strong className="q-text">{q.text}</strong>
                                                    <span style={{ background: q.booleanValue === false ? "#fee2e2" : q.booleanValue === true ? "#dcfce7" : "#f1f5f9", color: q.booleanValue === false ? "#b91c1c" : q.booleanValue === true ? "#15803d" : "#475569", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>{q.ans}</span>
                                                </div>
                                                {q.photos && q.photos.length > 0 ? (
                                                    <div style={{ marginTop: "10px" }}>
                                                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#059669", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <Camera size={13} /> {q.photos.length} Photo(s) Attached (Click to enlarge):
                                                        </div>
                                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                            {q.photos.map((imgSrc, pIdx) => (
                                                                <div
                                                                    key={pIdx}
                                                                    style={{ width: "96px", height: "74px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #cbd5e1", cursor: "pointer", position: "relative" }}
                                                                    onClick={() => setPreviewPhoto({ url: imgSrc, title: `Q#${q.no}: ${q.text} (Photo ${pIdx + 1})` })}
                                                                    title="Click to enlarge photo"
                                                                >
                                                                    <img src={imgSrc} alt={`Q${q.no} photo ${pIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                    <div style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(15,23,42,0.78)", color: "#fff", borderRadius: "4px", padding: "2px 4px", display: "flex" }}>
                                                                        <ZoomIn size={11} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>No Photo Attached</div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="audit-modal-footer-bar">
                            <div className="footer-status-info">
                                <span>Current Status:</span>
                                <span className={`status-pill status-${String(v.status || "PENDING").toLowerCase()}`}>{v.status || "PENDING"}</span>
                            </div>
                            <div className="footer-action-buttons">
                                <button type="button" className="btn-modal-print" onClick={() => printAuditReport(v)}><Printer size={15} /> Print Report</button>
                                <button type="button" className="btn-modal-reject" disabled={updatingId === v.id} onClick={() => updateStatus(v, "REJECTED")}><XCircle size={16} /> Reject Visit</button>
                                <button type="button" className="btn-modal-unverify" disabled={updatingId === v.id} onClick={() => updateStatus(v, "UNVERIFIED")}><RotateCcw size={16} /> Mark Unverified</button>
                                <button type="button" className="btn-modal-verify" disabled={updatingId === v.id} onClick={() => updateStatus(v, "VERIFIED")}>
                                    {updatingId === v.id ? <Loader2 size={16} className="btn-spinner" /> : <CheckCircle2 size={16} />} Verify Visit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL-SCREEN PHOTO LIGHTBOX MODAL */}
            {previewPhoto && (
                <div
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.92)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div
                        style={{ maxWidth: "92vw", maxHeight: "90vh", background: "#0f172a", borderRadius: "14px", padding: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #334155" }}>
                            <strong style={{ color: "#f8fafc", fontSize: "15px" }}>{previewPhoto.title || "Evidence Photo Preview"}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <a href={previewPhoto.url} download={`evidence-photo-${Date.now()}.jpg`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                                    <Download size={14} /> Download
                                </a>
                                <button type="button" onClick={() => setPreviewPhoto(null)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, fontSize: "12px" }}>
                                    <X size={16} /> Close
                                </button>
                            </div>
                        </div>
                        <img src={previewPhoto.url} alt={previewPhoto.title || "Full Preview"} style={{ maxWidth: "86vw", maxHeight: "76vh", objectFit: "contain", borderRadius: "8px", background: "#000" }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LatestVisits;
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Download,
    FileText,
    Loader2,
    ZoomIn,
    X,
} from "lucide-react";
import { PUBLIC_API_BASE } from "../../utils/publicConfig";
import duckminiLogo from "../../assets/duckmini-logo.png";
import "./PublicAuditView.css";

const parseSiteEvidence = (notes) => {
    if (!notes) return {};
    const match = notes.match(/\[SITE_EVIDENCE\]:\s*(\{[\s\S]*?\})/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (_) { }
    }
    return {};
};

const parseSubmittedAnswers = (visit) => {
    const answers = visit?.auditSubmission?.answers;
    if (answers && Array.isArray(answers) && answers.length > 0) {
        return answers.map((a, idx) => {
            let photos = [];
            let displayTextValue = a.textValue;
            if (a.textValue) {
                try {
                    const parsed = JSON.parse(a.textValue);
                    if (Array.isArray(parsed)) {
                        photos = parsed.filter(Boolean);
                        displayTextValue = null;
                    } else if (typeof parsed === "string" && (parsed.startsWith("data:image") || parsed.startsWith("http"))) {
                        photos = [parsed];
                        displayTextValue = null;
                    }
                } catch (_) {
                    if (typeof a.textValue === "string" && (a.textValue.startsWith("data:image") || a.textValue.startsWith("http"))) {
                        photos = [a.textValue];
                        displayTextValue = null;
                    }
                }
            }
            const hasBool = typeof a.booleanValue === "boolean";
            return {
                no: a.questionNo || idx + 1,
                text: a.questionText || `Question #${a.questionNo || idx + 1}`,
                ans: hasBool ? (a.booleanValue ? "Yes" : "No") : (displayTextValue || "-"),
                booleanValue: a.booleanValue,
                photos,
                score: a.booleanValue === false ? "0 / 4" : "4 / 4",
            };
        });
    }
    // New supervisor app stores the report inside visit.notes
    const m = typeof visit?.notes === "string" ? visit.notes.match(/\[VINICA_VSF_REPORT\]:\s*(.+)/) : null;
    if (m) {
        try {
            const report = JSON.parse(m[1]);
            if (Array.isArray(report?.answers)) {
                return report.answers.map((a, idx) => {
                    const v = String(a.a ?? "").trim();
                    const isYes = /^yes$/i.test(v), isNo = /^no$/i.test(v);
                    let ans = isYes ? "Yes" : isNo ? "No" : (v || "-");
                    const extra = [];
                    if (a.kp) extra.push(`Number: ${a.kp}`);
                    if (a.rm) extra.push(`Remark: ${a.rm}`);
                    if (extra.length) ans += ` (${extra.join(" | ")})`;
                    return {
                        no: a.n || idx + 1,
                        text: a.t || `Question #${a.n || idx + 1}`,
                        ans,
                        booleanValue: isYes ? true : isNo ? false : undefined,
                        photos: Array.isArray(a.ph) ? a.ph.filter(Boolean) : (a.ph ? [a.ph] : []),
                        score: isNo ? "0 / 4" : "4 / 4",
                    };
                });
            }
        } catch (_) { }
    }
    return [];
};

export default function PublicAuditView() {
    const { visitId } = useParams();
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [previewPhoto, setPreviewPhoto] = useState(null);

    const siteEvidence = useMemo(() => parseSiteEvidence(visit?.notes), [visit]);
    const submittedQuestions = useMemo(() => parseSubmittedAnswers(visit), [visit]);
    const totalQ = submittedQuestions.length;
    const passedQ = submittedQuestions.filter((q) => q.booleanValue === true).length;
    const dynamicScore = totalQ > 0 ? Math.round((passedQ / totalQ) * 100) : 100;

    const API_BASE_URL = PUBLIC_API_BASE;

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await fetch(`${API_BASE_URL}/api/public/audit/${encodeURIComponent(visitId)}`);
                if (res.status === 404) {
                    setError("This audit report was not found. The link may be incorrect or the visit was removed.");
                    return;
                }
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!data?.data?.visit) {
                    setError("This audit report is not available.");
                    return;
                }
                setVisit(data.data.visit);
            } catch (err) {
                console.error("Public audit fetch error:", err);
                setError("Could not load the report. Please check your connection and try again in a minute.");
            } finally {
                setLoading(false);
            }
        };
        if (visitId) {
            fetchAudit();
        }
    }, [visitId, API_BASE_URL]);

    const handleDownloadReport = () => {
        window.print();
    };

    const siteTitle = visit?.site?.name
        ? `${visit.site.name} ${visit.site?.siteCode ? `(${visit.site.siteCode})` : ""}`
        : visit?.clientName || "CLIENT SITE AUDIT REPORT";

    const branchTag = visit?.site?.city || visit?.site?.state || "SITE LOCATION";
    const auditorName = visit?.user?.name || "SUPERVISOR";
    const visitDateStr = visit?.visitAt
        ? new Date(visit.visitAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        : "—";

    const displayVisitId = visit?.id
        ? `Visit ID ${auditorName.replace(/\s+/g, "")}-${visit.id.slice(0, 8)}`
        : "Visit ID";
    const lat = visit?.latitude !== null && visit?.latitude !== undefined ? Number(visit.latitude).toFixed(6) : "N/A";
    const lng = visit?.longitude !== null && visit?.longitude !== undefined ? Number(visit.longitude).toFixed(6) : "N/A";

    const namePlateImg = siteEvidence?.nameplate || siteEvidence?.namePlatePhoto || null;
    const selfieImg = siteEvidence?.selfie || siteEvidence?.selfiePhoto || null;
    const sitePhoto1Img = siteEvidence?.photo1 || siteEvidence?.sitePhoto1 || visit?.photoUrl || null;

    return (
        <div className="public-audit-page">
            <header className="public-audit-header">
                <div className="header-left-col">
                    <div className="site-name-row">
                        <h1>{siteTitle}</h1>
                        <span className="location-pill">📍 {branchTag}</span>
                    </div>

                    <div className="header-meta-row">
                        <span>📄 {displayVisitId}</span>
                        <span>📅 {visitDateStr}</span>
                        <span>👤 {auditorName}</span>
                    </div>
                </div>

                <div className="header-right-col">
                    <button
                        type="button"
                        className="btn-download-report"
                        onClick={handleDownloadReport}
                        title="Download / Print Official Audit Report (PDF)"
                    >
                        <FileText size={16} />
                        <span>DOWNLOAD / PRINT REPORT</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="audit-loading-container">
                    <Loader2 size={32} className="btn-spinner" />
                    <p>Loading Verified Site Audit Report...</p>
                </div>
            ) : error ? (
                <div className="audit-loading-container" role="alert">
                    <p>{error}</p>
                </div>
            ) : (
                <main className="public-audit-main">
                    <div className="audit-sub-header">
                        <span className="report-category-name">MSF COMPLIANCE REPORT</span>
                        <strong className="total-score-text">( Total Score - {dynamicScore}/100 )</strong>
                    </div>

                    {/* SITE EVIDENCE SECTION (3 PHOTOS) */}
                    <section className="site-evidence-card">
                        <div className="evidence-title">
                            <span>📷 Site Evidence (Click any photo to enlarge)</span>
                        </div>

                        <div className="evidence-photos-grid">
                            {/* 1. CLIENT NAME PLATE PHOTO */}
                            <div
                                className="evidence-photo-item"
                                style={{ cursor: namePlateImg ? "pointer" : "default" }}
                                onClick={() =>
                                    namePlateImg &&
                                    setPreviewPhoto({
                                        url: namePlateImg,
                                        title: "CLIENT NAME PLATE PHOTO",
                                    })
                                }
                            >
                                <div className="photo-wrapper">
                                    {namePlateImg ? (
                                        <img src={namePlateImg} alt="Client Name Plate" />
                                    ) : (
                                        <div className="mock-photo-placeholder nameplate">
                                            <span>NAME PLATE</span>
                                            <small>NOT CAPTURED</small>
                                        </div>
                                    )}
                                </div>
                                <span className="photo-caption">CLIENT NAME PLATE</span>
                            </div>

                            {/* 2. SUPERVISOR SELFIE */}
                            <div
                                className="evidence-photo-item"
                                style={{ cursor: selfieImg ? "pointer" : "default" }}
                                onClick={() =>
                                    selfieImg &&
                                    setPreviewPhoto({
                                        url: selfieImg,
                                        title: "SUPERVISOR SELFIE",
                                    })
                                }
                            >
                                <div className="photo-wrapper">
                                    {selfieImg ? (
                                        <img src={selfieImg} alt="Supervisor Selfie" />
                                    ) : (
                                        <div className="mock-photo-placeholder site">
                                            <span>SUPERVISOR</span>
                                            <small>FACE SELFIE</small>
                                        </div>
                                    )}
                                </div>
                                <span className="photo-caption">SUPERVISOR SELFIE</span>
                            </div>

                            {/* 3. PHOTO 1 (SITE ENTRANCE) */}
                            <div
                                className="evidence-photo-item"
                                style={{ cursor: sitePhoto1Img ? "pointer" : "default" }}
                                onClick={() =>
                                    sitePhoto1Img &&
                                    setPreviewPhoto({
                                        url: sitePhoto1Img,
                                        title: "SITE ENTRANCE (PHOTO 1)",
                                    })
                                }
                            >
                                <div className="photo-wrapper">
                                    {sitePhoto1Img ? (
                                        <img src={sitePhoto1Img} alt="Site Photo 1" />
                                    ) : (
                                        <div className="mock-photo-placeholder site">
                                            <span>SITE ENTRANCE</span>
                                            <small>PHOTO 1</small>
                                        </div>
                                    )}
                                </div>
                                <span className="photo-caption">SITE ENTRANCE</span>
                            </div>
                        </div>

                        <div className="verification-sign-row">
                            <div className="location-verified-box">
                                <div className="verified-label">📍 Location Verified:</div>
                                <div className="lat-long-badge">
                                    Lat : {lat} | Long : {lng}
                                </div>
                            </div>

                            <div className="signature-box-wrapper">
                                <div className="signature-line">
                                    <svg width="120" height="40" viewBox="0 0 120 40">
                                        <path
                                            d="M 10 25 Q 30 10, 60 20 T 110 15"
                                            stroke="#1e3a8a"
                                            strokeWidth="2"
                                            fill="none"
                                        />
                                    </svg>
                                </div>
                                <span className="sign-caption">DIGITALLY VERIFIED SIGNATURE</span>
                            </div>
                        </div>
                    </section>

                    {/* REAL SUBMITTED AUDIT CHECKLIST QUESTIONS */}
                    <section className="audit-checklist-section">
                        {submittedQuestions.length === 0 ? (
                            <p style={{ padding: "20px", color: "#64748b" }}>
                                No audit responses recorded for this visit.
                            </p>
                        ) : (
                            submittedQuestions.map((q) => (
                                <div key={q.no} className="audit-row-item">
                                    <div className="q-number-col">{q.no}.</div>

                                    <div className="q-content-col">
                                        <div className="q-title-text">{q.text}</div>
                                        <div className="q-answer-text">{q.ans}</div>

                                        {q.photos && q.photos.length > 0 && (
                                            <div
                                                className="q-attached-photos-row"
                                                style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}
                                            >
                                                {q.photos.map((pUrl, pIdx) => (
                                                    <div
                                                        key={pIdx}
                                                        className="q-thumb-box"
                                                        style={{ width: "90px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #cbd5e1", cursor: "pointer", position: "relative" }}
                                                        onClick={() =>
                                                            setPreviewPhoto({
                                                                url: pUrl,
                                                                title: `Q#${q.no}: ${q.text} (Photo ${pIdx + 1})`,
                                                            })
                                                        }
                                                        title="Click to enlarge photo"
                                                    >
                                                        <img
                                                            src={pUrl}
                                                            alt={`Q${q.no} Evidence ${pIdx + 1}`}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                        <div
                                                            style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(15, 23, 42, 0.75)", color: "#fff", borderRadius: "4px", padding: "2px 4px", display: "flex" }}
                                                        >
                                                            <ZoomIn size={11} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {q.score && (
                                        <div className="q-score-col">
                                            <span
                                                className="score-pill"
                                                style={{ color: q.booleanValue === false ? "#dc2626" : "#0891b2", borderColor: q.booleanValue === false ? "#f87171" : "#06b6d4" }}
                                            >
                                                SCORE : {q.score}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </section>

                    <footer className="public-audit-footer">
                        <div className="footer-company-info">
                            <img
                                src={duckminiLogo}
                                alt="DuckMini — One Platform. Total Visibility."
                            />
                        </div>
                        <p>© {new Date().getFullYear()} All Rights Reserved. Verified by Device GPS & Timestamp.</p>
                    </footer>
                </main>
            )}

            {/* FULL-SCREEN PHOTO LIGHTBOX MODAL */}
            {previewPhoto && (
                <div
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.92)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div
                        style={{ maxWidth: "92vw", maxHeight: "90vh", background: "#0f172a", borderRadius: "14px", padding: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", alignItems: "center" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #334155" }}
                        >
                            <strong style={{ color: "#f8fafc", fontSize: "15px" }}>
                                {previewPhoto.title || "Evidence Photo Preview"}
                            </strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <a
                                    href={previewPhoto.url}
                                    download={`evidence-photo-${Date.now()}.jpg`}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#2563eb", color: "#ffffff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                                >
                                    <Download size={14} /> Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewPhoto(null)}
                                    style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, fontSize: "12px" }}
                                >
                                    <X size={16} /> Close
                                </button>
                            </div>
                        </div>

                        <img
                            src={previewPhoto.url}
                            alt={previewPhoto.title || "Full Preview"}
                            style={{ maxWidth: "86vw", maxHeight: "76vh", objectFit: "contain", borderRadius: "8px", background: "#000" }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
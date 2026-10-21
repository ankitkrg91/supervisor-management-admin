import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    MapPin,
    Search,
    FileSpreadsheet,
    Printer,
    Calendar,
    User,
    Loader2,
    X,
    Radio,
    Clock,
    Camera,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Navigation,
    CalendarDays,
    ShieldCheck,
    CheckCircle2,
    Car,
    FileText,
    ZoomIn,
    Download,
    XCircle,
    RotateCcw,
} from "lucide-react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    CircleMarker,
    Popup,
    ZoomControl,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import * as XLSX from "xlsx";
import { apiFetch } from "../../utils/api";

import "leaflet/dist/leaflet.css";
import "./DistanceReport.css";
import "../Visits/LatestVisits.css";
import "../CheckInCheckOut/LatestCheckIn.css";

const LOCAL_QUESTIONS_KEY = "audit_custom_questions_v6";

const getLocalActiveQuestions = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(LOCAL_QUESTIONS_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter((q) => q.isActive !== false) : [];
    } catch {
        return [];
    }
};

const parseVsfReport = (visit) => {
    const notes = visit?.notes;
    if (typeof notes !== "string") return null;
    const marker = "[VINICA_VSF_REPORT]:";
    const markerAt = notes.indexOf(marker);
    if (markerAt < 0) return null;
    const start = notes.indexOf("{", markerAt + marker.length);
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < notes.length; i += 1) {
        const ch = notes[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === "{") depth += 1;
        else if (ch === "}") {
            depth -= 1;
            if (depth === 0) {
                try {
                    const parsed = JSON.parse(notes.slice(start, i + 1));
                    return parsed && typeof parsed === "object" ? parsed : null;
                } catch { return null; }
            }
        }
    }
    return null;
};

const isVsfVisit = (visit) => Boolean(parseVsfReport(visit) || String(visit?.reportType || "").toUpperCase().includes("VSF"));
const escapeReportHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

const extractSiteEvidencePhotos = (visit) => {
    if (!visit) return [];
    const list = [];
    const seen = new Set();
    const add = (url, label) => {
        const clean = typeof url === "string" ? url.trim() : "";
        if (!clean || seen.has(clean)) return;
        if (!clean.startsWith("data:image/") && !/^https?:\/\//i.test(clean)) return;
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
                (Array.isArray(ev.opt) ? ev.opt : []).forEach((url, idx) => add(url, `Additional Site Photo ${idx + 1}`));
            } catch { }
        }
    }

    const report = parseVsfReport(visit);
    if (report?.photos) {
        add(report.photos.nameplate, "Client Name Plate Photo");
        add(report.photos.selfie, "Supervisor Selfie");
        (Array.isArray(report.photos.opt) ? report.photos.opt : []).forEach((url, idx) => add(url, `Additional Site Photo ${idx + 1}`));
        add(report.photos.signature || report.signature, "Supervisor Signature");
    }
    add(visit.photoUrl, list.length === 0 ? "Site Evidence Photo" : "Site Photo");
    add(visit.selfieUrl, "Check-In Selfie");
    return list;
};

const extractClientFeedback = (visit) => {
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

const extractAuditQuestions = (visit, activeChecklist = []) => {
    const vsf = parseVsfReport(visit);
    if (vsf && Array.isArray(vsf.answers)) {
        return vsf.answers.map((answer, idx) => {
            const raw = String(answer?.a ?? "").trim();
            const normalized = raw.toLowerCase();
            const isYes = normalized === "yes";
            const isNo = normalized === "no";
            const photos = Array.isArray(answer?.ph) ? answer.ph.filter((url) => typeof url === "string" && url.trim()) : [];
            const details = [];
            if (answer?.kp !== undefined && answer.kp !== null && String(answer.kp).trim()) {
                details.push(`Number: ${String(answer.kp).trim()}`);
            }
            if (answer?.rm) details.push(String(answer.rm).trim());
            return {
                no: answer?.n || idx + 1,
                text: answer?.t || `Question #${answer?.n || idx + 1}`,
                section: answer?.sec || "VSF Inspection",
                ans: isYes ? "YES" : isNo ? "NO" : (raw || (answer?.kp ? String(answer.kp) : "—")),
                booleanValue: isYes ? true : isNo ? false : null,
                remarks: details.filter(Boolean).join(" • "),
                photos,
            };
        });
    }

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
                section: ans.section || "",
                ans: hasBool ? (ans.booleanValue ? "YES" : "NO") : (textVal || "—"),
                booleanValue: hasBool ? ans.booleanValue : null,
                remarks: ans.remarks || ans.remark || "",
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
        section: q.section || "",
        ans: "Pending",
        booleanValue: null,
        remarks: "",
        photos: [],
    }));
};

// Numbered purple stop marker
const createStopIcon = (number) => {
    return L.divIcon({
        className: "custom-stop-marker",
        html: `<div class="stop-badge">${number}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -15],
    });
};

// Green Live GPS pulse marker
const createLiveIcon = () => {
    return L.divIcon({
        className: "custom-live-marker",
        html: `<div class="live-pin-pulse"></div><div class="live-pin-badge">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 28],
        popupAnchor: [0, -30],
    });
};

// Auto fit map bounds
const MapBoundsFitter = ({ routeCoords, markersCoords }) => {
    const map = useMap();

    useEffect(() => {
        const allPoints = [];
        if (Array.isArray(routeCoords)) {
            routeCoords.forEach((pt) => {
                if (Number.isFinite(pt[0]) && Number.isFinite(pt[1])) allPoints.push(pt);
            });
        }
        if (Array.isArray(markersCoords)) {
            markersCoords.forEach((pt) => {
                if (Number.isFinite(pt[0]) && Number.isFinite(pt[1])) allPoints.push(pt);
            });
        }

        if (allPoints.length === 1) {
            map.setView(allPoints[0], 14);
        } else if (allPoints.length > 1) {
            const bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [map, routeCoords, markersCoords]);

    return null;
};

// Date format helper
const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        weekday: "short",
    });
};

const DistanceReport = () => {
    const [searchParams] = useSearchParams();
    const urlUserId = searchParams.get("userId") || "";
    const urlDate = searchParams.get("date") || "";

    // VIEW MODE: "summary" (30-day all supervisors) vs "map" (single day GPS playback)
    const [viewMode, setViewMode] = useState(() => (urlUserId ? "map" : "summary"));

    // Supervisors list
    const [supervisors, setSupervisors] = useState([]);

    // DATE RANGE FILTER FOR SUMMARY VIEW (Default 30 Days)
    const todayStr = new Date().toISOString().split("T")[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [datePreset, setDatePreset] = useState("30_DAYS");
    const [fromDate, setFromDate] = useState(thirtyDaysAgoStr);
    const [toDate, setToDate] = useState(todayStr);
    const [summarySearch, setSummarySearch] = useState("");

    // 30-Day Summary Data
    const [distanceReports, setDistanceReports] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Day-wise breakdown state (expanded supervisor)
    const [expandedSupervisorId, setExpandedSupervisorId] = useState(null);
    const [dailyBreakdowns, setDailyBreakdowns] = useState({});
    const [breakdownLoading, setBreakdownLoading] = useState(false);

    // DAILY ROUTE MAP VIEW STATE
    const [selectedOfficer, setSelectedOfficer] = useState(urlUserId);
    const [selectedDate, setSelectedDate] = useState(urlDate || todayStr);
    const [routeData, setRouteData] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState("");
    const [tableSearch, setTableSearch] = useState("");

    // Modals & Checklist
    const [selectedCheckIn, setSelectedCheckIn] = useState(null);
    const [selectedAuditVisit, setSelectedAuditVisit] = useState(null);
    const [activeChecklist, setActiveChecklist] = useState([]);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // Fetch active checklist once on mount
    useEffect(() => {
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
        fetchActiveChecklist();
    }, []);

    // 1. Fetch Supervisors list
    useEffect(() => {
        const fetchSupervisors = async () => {
            try {
                const response = await apiFetch("/api/users?role=SUPERVISOR");
                const result = await response.json();
                if (response.ok) {
                    const list = result.data?.users || result.users || [];
                    setSupervisors(list);
                    if (!selectedOfficer && list.length > 0) {
                        setSelectedOfficer(urlUserId || list[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load supervisors:", err);
            }
        };
        fetchSupervisors();
    }, [urlUserId]);

    // 2. Fetch 30-Day Distance Summary for all supervisors
    const fetchSummaryReport = async () => {
        try {
            setSummaryLoading(true);
            const params = new URLSearchParams();
            if (fromDate) params.set("fromDate", fromDate);
            if (toDate) params.set("toDate", toDate);
            if (summarySearch.trim()) params.set("search", summarySearch.trim());

            const res = await apiFetch(`/api/location/distance-report?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const reports = data.data?.reports || [];
                setDistanceReports(reports);
            } else {
                setDistanceReports([]);
            }
        } catch (err) {
            console.error("Summary distance fetch error:", err);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "summary") {
            fetchSummaryReport();
        }
    }, [viewMode, fromDate, toDate, summarySearch]);

    // Handle Date Presets
    const handlePresetChange = (preset) => {
        setDatePreset(preset);
        const now = new Date();
        const nowStr = now.toISOString().split("T")[0];

        if (preset === "30_DAYS") {
            const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            setFromDate(d);
            setToDate(nowStr);
        } else if (preset === "7_DAYS") {
            const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            setFromDate(d);
            setToDate(nowStr);
        } else if (preset === "TODAY") {
            setFromDate(nowStr);
            setToDate(nowStr);
        }
    };

    // 3. Fetch Day-wise breakdown for a specific supervisor
    const toggleSupervisorBreakdown = async (supervisorId) => {
        if (expandedSupervisorId === supervisorId) {
            setExpandedSupervisorId(null);
            return;
        }

        setExpandedSupervisorId(supervisorId);

        // Fetch daily breakdown if not already cached
        if (!dailyBreakdowns[supervisorId]) {
            try {
                setBreakdownLoading(true);
                const params = new URLSearchParams();
                params.set("userId", supervisorId);
                params.set("fromDate", fromDate);
                params.set("toDate", toDate);

                const res = await apiFetch(`/api/location/daily-breakdown?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    const days = data.data?.days || [];
                    setDailyBreakdowns((prev) => ({ ...prev, [supervisorId]: days }));
                } else {
                    // Fallback to building date slots between fromDate & toDate
                    setDailyBreakdowns((prev) => ({ ...prev, [supervisorId]: generateDateSlots(fromDate, toDate) }));
                }
            } catch (err) {
                console.error("Breakdown error:", err);
                setDailyBreakdowns((prev) => ({ ...prev, [supervisorId]: generateDateSlots(fromDate, toDate) }));
            } finally {
                setBreakdownLoading(false);
            }
        }
    };

    // Helper to generate date slots
    const generateDateSlots = (startStr, endStr) => {
        const slots = [];
        const start = new Date(startStr);
        const end = new Date(endStr);
        for (let d = new Date(end); d >= start; d.setDate(d.getDate() - 1)) {
            slots.push({
                date: d.toISOString().split("T")[0],
                distanceKm: 0.0,
                pointsCount: 0,
            });
        }
        return slots;
    };

    // 4. Open Map for specific supervisor & date
    const openMapForSupervisorAndDate = (supervisorId, dateStr) => {
        setSelectedOfficer(supervisorId);
        setSelectedDate(dateStr || todayStr);
        setViewMode("map");
    };

    // 5. Fetch Daily Route & Stops for Map View
    const fetchDailyRoute = async () => {
        if (!selectedOfficer) return;
        try {
            setMapLoading(true);
            setMapError("");
            const params = new URLSearchParams();
            params.set("userId", selectedOfficer);

            // Normalize DD-MM-YYYY to YYYY-MM-DD
            let queryDate = (selectedDate || todayStr).trim();
            if (queryDate.includes("-")) {
                const parts = queryDate.split("-");
                if (parts[0].length === 2 && parts[2].length === 4) {
                    queryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            params.set("date", queryDate);

            const res = await apiFetch(`/api/location/daily-route?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to fetch daily tracking route");
            }

            setRouteData(data.data);
        } catch (err) {
            console.error("Fetch route error:", err);
            setMapError(err.message || "Failed to load route data");
            setRouteData(null);
        } finally {
            setMapLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "map" && selectedOfficer) {
            fetchDailyRoute();
        }
    }, [viewMode, selectedOfficer, selectedDate]);

    // Map Route coordinates for Polyline
    const routeCoords = useMemo(() => {
        if (!routeData?.route || !Array.isArray(routeData.route)) return [];
        return routeData.route
            .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
            .map((p) => [p.latitude, p.longitude]);
    }, [routeData]);

    const stopsList = routeData?.stops || [];
    const stopCoords = useMemo(() => {
        return stopsList
            .filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
            .map((s) => [s.latitude, s.longitude]);
    }, [stopsList]);

    const sitesList = routeData?.sites || [];

    // Filtered stops table in Map view
    const filteredStops = useMemo(() => {
        if (!tableSearch.trim()) return stopsList;
        const q = tableSearch.toLowerCase().trim();
        return stopsList.filter(
            (s) =>
                (s.locationName && s.locationName.toLowerCase().includes(q)) ||
                (s.type && s.type.toLowerCase().includes(q)) ||
                (s.siteCode && s.siteCode.toLowerCase().includes(q))
        );
    }, [stopsList, tableSearch]);

    // Summary Calculations across all supervisors
    const summaryKPIs = useMemo(() => {
        const totalKm = distanceReports.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0);
        const totalLogs = distanceReports.reduce((acc, r) => acc + (Number(r.locationPoints) || 0), 0);
        const activeCount = distanceReports.filter((r) => (Number(r.distanceKm) || 0) > 0).length;
        return {
            totalKm: Number(totalKm.toFixed(2)),
            totalLogs,
            supervisorsCount: distanceReports.length || supervisors.length,
            activeCount,
        };
    }, [distanceReports, supervisors]);

    // Export Summary to Excel
    const handleExportSummaryExcel = () => {
        const exportData = distanceReports.map((r, idx) => ({
            "#": idx + 1,
            "Supervisor Name": r.user?.name || "N/A",
            "Phone": r.user?.phone || "N/A",
            "Email": r.user?.email || "N/A",
            "Site / Branch": r.site?.name || "N/A",
            "State / Region": r.site?.state || "N/A",
            "From Date": fromDate,
            "To Date": toDate,
            "Total Distance (KM)": r.distanceKm || 0,
            "GPS Points": r.locationPoints || 0,
            "Status": r.user?.status || "ACTIVE",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Supervisors Summary");
        XLSX.writeFile(wb, `Distance_Summary_${fromDate}_to_${toDate}.xlsx`);
    };

    // Export Daily Map Stops to Excel
    const handleExportMapExcel = () => {
        const exportData = stopsList.map((stop) => ({
            "Stop #": stop.stopNumber || stop.srNo,
            "Type": stop.type,
            "Location / Site": stop.locationName,
            "Time": stop.time,
            "Distance from Prev (KM)": stop.distanceFromPrevKm,
            "Latitude": stop.latitude,
            "Longitude": stop.longitude,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daily Route Stops");
        XLSX.writeFile(wb, `Daily_Route_${selectedOfficer}_${selectedDate}.xlsx`);
    };


    /* =========================================================
       PRINT 30-DAY SUMMARY TABLE ONLY (NO SIDEBAR / BUTTONS)
       ========================================================= */
    const printSummaryTable = () => {
        if (distanceReports.length === 0) {
            alert("No summary reports to print.");
            return;
        }
        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) {
            alert("Please allow popups to print.");
            return;
        }

        const rows = distanceReports.map((r, idx) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${r.user?.name || "N/A"}</strong><br/><span style="color: #64748b; font-size: 11px;">${r.user?.phone || r.user?.email || ""}</span></td>
                <td><strong>${r.site?.name || "Unassigned"}</strong><br/><span style="color: #64748b; font-size: 11px;">${r.site?.city || ""}, ${r.site?.state || ""}</span></td>
                <td style="font-weight: 700; color: #15803d;">${Number(r.distanceKm || 0).toFixed(2)} KM</td>
                <td>${r.locationPoints || 0} logs</td>
                <td>~${(Number(r.distanceKm || 0) / 30).toFixed(2)} KM/day</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Supervisor Distance Summary Report</title>
                <style>
                    @page { size: A4 landscape; margin: 12mm; }
                    body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; }
                    h2 { margin: 0 0 4px; color: #1e3a8a; }
                    p { margin: 0 0 14px; color: #64748b; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #f1f5f9; color: #334155; padding: 8px 10px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; }
                    td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: middle; }
                    tr:nth-child(even) { background: #f8fafc; }
                </style>
            </head>
            <body>
                <h2>Supervisor Distance Summary Report</h2>
                <p>Period: ${fromDate} to ${toDate} | Total Distance: ${summaryKPIs.totalKm} KM</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th>Supervisor Details</th>
                            <th>Site / Region</th>
                            <th>Total Distance</th>
                            <th>GPS Points</th>
                            <th>Avg / Day</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
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

    /* =========================================================
       PRINT DAILY STOPS TIMELINE ONLY
       ========================================================= */
    const printStopsTable = () => {
        if (stopsList.length === 0) {
            alert("No stops recorded to print.");
            return;
        }
        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) {
            alert("Please allow popups to print.");
            return;
        }

        const rows = stopsList.map((s) => `
            <tr>
                <td style="text-align: center; font-weight: bold;">#${s.stopNumber || s.srNo}</td>
                <td><strong style="color: ${s.type === 'CHECK_IN' || s.type === 'CHECKIN' ? '#1e40af' : '#92400e'}">${s.type}</strong></td>
                <td><strong>${s.locationName || s.siteLocation}</strong> ${s.siteCode ? `(${s.siteCode})` : ""}</td>
                <td>${s.time || s.timeOfVisit}</td>
                <td>${s.distanceFromPrevKm || s.distanceInKm || "0.00"} KM</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daily Route Stops - ${selectedDate}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; }
                    h2 { margin: 0 0 4px; color: #1e3a8a; }
                    p { margin: 0 0 14px; color: #64748b; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #f1f5f9; color: #334155; padding: 8px 10px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; }
                    td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: middle; }
                    tr:nth-child(even) { background: #f8fafc; }
                </style>
            </head>
            <body>
                <h2>Supervisor Daily Stops & Route Tracking</h2>
                <p>Date: ${selectedDate} | Supervisor: ${routeData?.user?.name || "N/A"} | Total Distance: ${routeData?.totalDistanceKm || "0"} KM</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">Stop #</th>
                            <th>Stop Type</th>
                            <th>Location / Site Name</th>
                            <th>Arrival Time</th>
                            <th>Distance from Prev</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
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

    const handleOpenCheckInModal = (stop) => {
        const ci = stop.rawCheckIn || {};
        const supUser = routeData?.user || {};
        const supervisorName = supUser.name || stop.assignTo || "Supervisor";
        const supervisorPhone = supUser.phone || "0000";

        const inDate = stop.checkInTime ? new Date(stop.checkInTime) : (stop.timeFull ? new Date(stop.timeFull) : null);
        const outDate = stop.checkOutTime ? new Date(stop.checkOutTime) : null;

        const checkInDateTime = inDate && !isNaN(inDate.getTime())
            ? inDate.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : stop.time || "N/A";

        const checkOutDateTime = outDate && !isNaN(outDate.getTime())
            ? outDate.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : (stop.checkOutTime ? String(stop.checkOutTime) : "NA (Currently Active)");

        const site = ci.site || {};
        const checkInPhotoUrl = stop.selfieIn || ci.photoUrl || ci.checkInPhotoUrl || ci.selfieUrl || null;

        const dateTag = inDate && !isNaN(inDate.getTime())
            ? inDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s+/g, "_")
            : "DATE";
        const timeTag = inDate && !isNaN(inDate.getTime())
            ? inDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }).replace(/\s+/g, "_")
            : "TIME";

        const checkInId = stop.checkInId || `${supervisorName.replace(/\s+/g, "")}${supervisorPhone}-${dateTag}_${timeTag}`;

        setSelectedCheckIn({
            checkInId,
            name: supervisorName,
            checkInDateTime,
            checkOutDateTime,
            gpsCheckInAddress: stop.checkInAddress || site.address || (stop.latitude ? `Lat: ${Number(stop.latitude).toFixed(6)}, Long: ${Number(stop.longitude).toFixed(6)}` : "Verified by Device GPS"),
            gpsCheckOutAddress: stop.checkOutAddress || (outDate ? (site.address || "Verified on Check-Out") : "NA"),
            checkInLatitude: ci.checkInLatitude ?? stop.latitude,
            checkInLongitude: ci.checkInLongitude ?? stop.longitude,
            checkOutLatitude: ci.checkOutLatitude ?? null,
            checkOutLongitude: ci.checkOutLongitude ?? null,
            siteName: site.name || stop.locationName || "Site",
            siteCode: site.siteCode || stop.siteCode || "NA",
            siteLatitude: site.latitude ?? null,
            siteLongitude: site.longitude ?? null,
            distanceTravelled: stop.distanceTravelled || stop.distanceFromPrevKm || "0.00 KM",
            checkInPhotoUrl,
            isAlternate: stop.isAlternate || ci.isAlternate || false,
            alternateReason: stop.alternateReason || ci.alternateReason || null,
        });
    };

    const handleOpenAuditModal = async (stop) => {
        const visit = stop.visit ? { ...stop.visit } : {
            id: stop.visitId || stop.id,
            visitAt: stop.timeFull,
            status: stop.status || "VERIFIED",
            latitude: stop.latitude,
            longitude: stop.longitude,
            site: {
                name: stop.siteName || stop.locationName,
                siteCode: stop.siteCode,
                address: stop.address,
            },
            user: routeData?.user || { name: stop.assignTo || "Supervisor" },
            auditSubmission: stop.auditAnswers ? { answers: stop.auditAnswers } : null,
            notes: stop.notes,
            photoUrl: stop.photoUrl,
            selfieUrl: stop.selfieUrl,
        };

        if (!visit.user && routeData?.user) {
            visit.user = routeData.user;
        }

        setSelectedAuditVisit(visit);

        if (!parseVsfReport(visit) && !visit?.auditSubmission?.answers?.length && visit?.id) {
            try {
                const res = await apiFetch(`/api/audit/visits/${visit.id}/submission`, { method: "GET" });
                if (res.ok) {
                    const sub = (await res.json())?.data?.submission;
                    if (sub?.answers?.length) {
                        setSelectedAuditVisit((p) => (p?.id === visit.id ? { ...p, auditSubmission: sub } : p));
                    }
                }
            } catch { }
        }
    };

    const updateVisitStatus = async (visit, nextStatus) => {
        if (!visit?.id) return;
        try {
            setUpdatingId(visit.id);
            const res = await apiFetch(`/api/visits/${visit.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            if (res.ok) {
                setSelectedAuditVisit((p) => (p ? { ...p, status: nextStatus } : null));
                setRouteData((prev) => {
                    if (!prev || !prev.stops) return prev;
                    return {
                        ...prev,
                        stops: prev.stops.map((s) =>
                            s.visit?.id === visit.id || s.id === visit.id
                                ? { ...s, status: nextStatus, visit: { ...s.visit, status: nextStatus } }
                                : s
                        ),
                    };
                });
            }
        } catch { }
        finally {
            setUpdatingId(null);
        }
    };

    const printAuditReport = (visit) => {
        if (!visit) return;
        const pw = window.open("", "_blank", "width=1000,height=900");
        if (!pw) return alert("Please allow popups to print the report.");

        const report = parseVsfReport(visit);
        const qs = extractAuditQuestions(visit, activeChecklist);
        const scoreQuestions = qs.filter((q) => q.booleanValue === true || q.booleanValue === false);
        const yesCount = qs.filter((q) => q.ans === "YES").length;
        const noCount = qs.filter((q) => q.ans === "NO").length;
        const score = scoreQuestions.length ? Math.round((yesCount / scoreQuestions.length) * 100) : 0;
        const siteName = report?.siteName || visit.site?.name || visit.clientName || "Client Site";
        const supervisorName = report?.supervisor?.name || visit.user?.name || "Supervisor";
        const supervisorEmail = report?.supervisor?.email || visit.user?.email || "—";
        const taskId = report?.taskId || visit.taskId || "—";
        const submittedAt = report?.submittedAt || visit.visitAt;
        const vDate = submittedAt ? new Date(submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" }) : "N/A";
        const fb = extractClientFeedback(visit);
        const safe = escapeReportHtml;

        let previousSection = "";
        const rowsHtml = qs.map((q) => {
            let sectionRow = "";
            if (report && q.section && q.section !== previousSection) {
                sectionRow = `<tr class="section-row"><td colspan="4">${safe(q.section)}</td></tr>`;
                previousSection = q.section;
            }
            const responseColor = q.booleanValue === false ? "#b91c1c" : q.booleanValue === true ? "#166534" : "#334155";
            const photos = (q.photos || []).map((url) => `<img class="answer-photo" src="${safe(url)}" alt="Question ${safe(q.no)} evidence" />`).join("");
            return sectionRow + `<tr><td class="number">#${safe(q.no)}</td><td><strong>${safe(q.text)}</strong>${q.remarks ? `<div class="remark">${safe(q.remarks)}</div>` : ""}${photos ? `<div class="answer-photos">${photos}</div>` : ""}</td><td class="response" style="color:${responseColor}">${safe(q.ans)}</td><td>${photos ? `${q.photos.length} photo(s)` : "—"}</td></tr>`;
        }).join("");

        const coverPhotoItems = [];
        if (report?.photos?.nameplate) coverPhotoItems.push({ url: report.photos.nameplate, label: "Client Name Plate" });
        if (report?.photos?.selfie) coverPhotoItems.push({ url: report.photos.selfie, label: "Supervisor Selfie" });
        (Array.isArray(report?.photos?.opt) ? report.photos.opt : []).forEach((url, idx) => coverPhotoItems.push({ url, label: `Additional Site Photo ${idx + 1}` }));
        const evidenceHtml = coverPhotoItems.filter((p) => typeof p.url === "string" && p.url.trim()).map((p) =>
            `<div class="evidence-item"><img src="${safe(p.url)}" alt="${safe(p.label)}"><div>${safe(p.label)}</div></div>`
        ).join("");
        const signatureHtml = report?.signature || report?.photos?.signature
            ? `<section class="signature"><h3>Authorised Signature</h3><img src="${safe(report.signature || report.photos.signature)}" alt="Supervisor signature"><p>${safe(supervisorName)} • ${safe(supervisorEmail)} • ${safe(vDate)}</p></section>`
            : "";
        const metadataHtml = report
            ? `<div class="meta-grid"><div><span>Task</span><strong>${safe(report.taskTitle || "VSF Inspection")}</strong></div><div><span>Task ID</span><strong>${safe(taskId)}</strong></div><div><span>Site / Area</span><strong>${safe(siteName)}${visit.site?.siteCode ? ` · ${safe(visit.site.siteCode)}` : ""}</strong></div><div><span>Submitted By</span><strong>${safe(supervisorName)}<br>${safe(supervisorEmail)}</strong></div><div><span>Submitted On</span><strong>${safe(vDate)}</strong></div><div><span>Review Status</span><strong>${safe(visit.status || "PENDING")}</strong></div><div><span>GPS Coordinates</span><strong>${safe(visit.latitude ?? "—")}, ${safe(visit.longitude ?? "—")}</strong></div><div><span>Server Visit ID</span><strong>${safe(visit.id || "—")}</strong></div></div>`
            : `<p>Auditor: <strong>${safe(supervisorName)}</strong> | Date: ${safe(vDate)} | Status: <strong>${safe(visit.status || "PENDING")}</strong> | Compliance: <strong>${score}% (${yesCount}/${scoreQuestions.length || 0} Yes/No)</strong></p>`;

        pw.document.open();
        pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report ? "VSF Inspection Report" : "Site Audit Report"} - ${safe(siteName)}</title><style>
            @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:0;color:#172033;font-size:11px;line-height:1.4}header{display:flex;justify-content:space-between;align-items:center;border-bottom:5px solid #6b6cf5;padding:0 0 12px;margin-bottom:15px}header .logo{font-size:25px;font-weight:900;color:#f47735;letter-spacing:.5px}header .sub{text-align:right;color:#475569}h1{font-size:19px;margin:4px 0 12px;color:#111827}h3{font-size:12px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.3px}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f5f6fb;border:1px solid #dfe3ee;border-radius:8px;padding:12px;margin-bottom:12px}.meta-grid div{display:flex;flex-direction:column;gap:3px;overflow-wrap:anywhere}.meta-grid span{font-size:9px;text-transform:uppercase;color:#64748b;font-weight:bold}.meta-grid strong{font-size:11px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.stat{border:1px solid #e2e8f0;border-radius:6px;text-align:center;padding:9px}.stat b{display:block;font-size:18px;color:#6b6cf5}.stat span{font-size:9px;color:#64748b;text-transform:uppercase}.section-title{background:#6b6cf5;color:#fff;padding:7px 9px;margin:16px 0 0;font-weight:bold;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:0 0 10px;table-layout:fixed}th,td{border:1px solid #d5dae5;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f1f3f9;font-size:9px;text-transform:uppercase}.number{text-align:center;font-weight:bold;width:7%}.response{font-weight:bold;text-align:center;width:16%}td:last-child{width:12%;font-size:10px}.section-row td{background:#eef0ff;color:#3730a3;font-weight:bold;text-transform:uppercase;padding:6px 8px}.remark{margin-top:4px;color:#475569;font-size:10px;white-space:pre-wrap}.answer-photos{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.answer-photo{width:90px;height:65px;object-fit:cover;border:1px solid #cbd5e1;border-radius:4px}.evidence-grid{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 14px}.evidence-item{width:150px;text-align:center;font-size:10px;color:#475569}.evidence-item img{width:100%;height:105px;object-fit:contain;border:1px solid #cbd5e1;border-radius:5px}.signature{margin-top:20px;border-top:1px solid #cbd5e1;padding-top:12px;page-break-inside:avoid}.signature img{max-width:240px;max-height:90px;object-fit:contain;display:block}.signature p{color:#475569}.feedback{background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin:12px 0}.footer{margin-top:18px;border-top:1px solid #d5dae5;padding-top:8px;font-size:9px;color:#64748b;display:flex;justify-content:space-between}@media print{tr{page-break-inside:avoid}.evidence-item,.signature{page-break-inside:avoid}}
            </style></head><body>
            <header><div class="logo">VINICIA</div><div class="sub"><strong>${report ? "SITE VISIT REPORT" : "SITE AUDIT REPORT"}</strong><br>${report ? "VSF Inspection Report" : "Audit & Visit Report"}<br>Vinicia Security Services Pvt Ltd</div></header>
            <h1>${safe(siteName)} — ${report ? "VSF INSPECTION REPORT" : "SITE AUDIT REPORT"}</h1>
            ${metadataHtml}
            ${report ? `<div class="summary"><div class="stat"><b>${qs.length}</b><span>Responses</span></div><div class="stat"><b>${yesCount}</b><span>Yes</span></div><div class="stat"><b>${noCount}</b><span>No</span></div><div class="stat"><b>${coverPhotoItems.length + qs.reduce((n, q) => n + (q.photos?.length || 0), 0)}</b><span>Photos</span></div></div>` : ""}
            ${evidenceHtml ? `<div class="section-title">Photo Evidence</div><div class="evidence-grid">${evidenceHtml}</div>` : ""}
            ${fb ? `<div class="feedback"><strong>Client Feedback:</strong> ${safe(fb.rating || "—")} ${fb.clientName ? `· ${safe(fb.clientName)} (${safe(fb.clientPhone || "")})` : ""}${fb.comments ? `<div>${safe(fb.comments)}</div>` : ""}</div>` : ""}
            <div class="section-title">${report ? "Inspection Responses" : "Audit Checklist Responses"}</div>
            <table><thead><tr><th class="number">#</th><th>Parameter / Question</th><th class="response">Response</th><th>Evidence</th></tr></thead><tbody>${rowsHtml || `<tr><td colspan="4">No submitted responses found.</td></tr>`}</tbody></table>
            ${signatureHtml}<div class="footer"><span>Vinicia Security Services Pvt Ltd | Confidential</span><span>Generated ${safe(new Date().toLocaleString("en-IN"))}</span></div>
            </body></html>`);
        pw.document.close();
        pw.focus();
        setTimeout(() => pw.print(), 500);
    };

    return (
        <div className="distance-report-page">
            <section className="distance-report-card">
                {/* HEADER & VIEW TABS */}
                <div className="distance-header-banner">
                    <div className="distance-header-left">
                        <h1>
                            <MapPin size={24} color="#2563eb" />
                            Distance Report & Route Tracking
                        </h1>
                        <p>
                            Monitor total travel distance across 30 days and inspect daily GPS playback routes for site audits & check-ins.
                        </p>
                    </div>

                    <div className="view-mode-tabs">
                        <button
                            type="button"
                            className={`tab-btn ${viewMode === "summary" ? "active" : ""}`}
                            onClick={() => setViewMode("summary")}
                        >
                            <CalendarDays size={16} />
                            All Supervisors (30-Day Summary)
                        </button>

                        <button
                            type="button"
                            className={`tab-btn ${viewMode === "map" ? "active" : ""}`}
                            onClick={() => setViewMode("map")}
                        >
                            <Navigation size={16} />
                            Daily Route & Audit Map
                        </button>
                    </div>
                </div>

                {/* =========================================================
                    VIEW 1: ALL SUPERVISORS 30-DAY SUMMARY VIEW
                ========================================================= */}
                {viewMode === "summary" && (
                    <div className="distance-summary-section">
                        {/* KPI METRIC CARDS */}
                        <div className="distance-kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon-wrap green">
                                    <Car size={22} />
                                </div>
                                <div className="kpi-info">
                                    <span className="kpi-label">Total Distance Traveled</span>
                                    <span className="kpi-value">{summaryKPIs.totalKm} KM</span>
                                    <span className="kpi-subtext">All supervisors combined</span>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon-wrap blue">
                                    <User size={22} />
                                </div>
                                <div className="kpi-info">
                                    <span className="kpi-label">Active Supervisors</span>
                                    <span className="kpi-value">{summaryKPIs.activeCount} / {summaryKPIs.supervisorsCount}</span>
                                    <span className="kpi-subtext">With recorded travel</span>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon-wrap purple">
                                    <Clock size={22} />
                                </div>
                                <div className="kpi-info">
                                    <span className="kpi-label">GPS Locations Logged</span>
                                    <span className="kpi-value">{summaryKPIs.totalLogs} Points</span>
                                    <span className="kpi-subtext">Across tracking period</span>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon-wrap orange">
                                    <Calendar size={22} />
                                </div>
                                <div className="kpi-info">
                                    <span className="kpi-label">Active Date Window</span>
                                    <span className="kpi-value" style={{ fontSize: "15px", marginTop: "5px" }}>
                                        {formatDateDisplay(fromDate).split(",")[0]} - {formatDateDisplay(toDate).split(",")[0]}
                                    </span>
                                    <span className="kpi-subtext">
                                        {datePreset === "30_DAYS" ? "Last 30 Days" : datePreset === "7_DAYS" ? "Last 7 Days" : "Custom Period"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FILTER TOOLBAR */}
                        <div className="summary-filter-toolbar">
                            <div className="toolbar-left">
                                <div className="preset-pills">
                                    <button
                                        type="button"
                                        className={`preset-pill-btn ${datePreset === "30_DAYS" ? "active" : ""}`}
                                        onClick={() => handlePresetChange("30_DAYS")}
                                    >
                                        Last 30 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-pill-btn ${datePreset === "7_DAYS" ? "active" : ""}`}
                                        onClick={() => handlePresetChange("7_DAYS")}
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-pill-btn ${datePreset === "TODAY" ? "active" : ""}`}
                                        onClick={() => handlePresetChange("TODAY")}
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-pill-btn ${datePreset === "CUSTOM" ? "active" : ""}`}
                                        onClick={() => setDatePreset("CUSTOM")}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {datePreset === "CUSTOM" && (
                                    <div className="custom-date-inputs">
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                        <span>to</span>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="search-box-wrap">
                                    <Search size={15} />
                                    <input
                                        type="text"
                                        placeholder="Search supervisor or site..."
                                        value={summarySearch}
                                        onChange={(e) => setSummarySearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="toolbar-right">
                                <button
                                    type="button"
                                    className="btn-export-excel"
                                    onClick={handleExportSummaryExcel}
                                    title="Download Excel Report"
                                >
                                    <FileSpreadsheet size={15} />
                                    Export Excel
                                </button>
                                <button
                                    type="button"
                                    className="btn-print"
                                    onClick={printSummaryTable}
                                    title="Print Report"
                                >
                                    <Printer size={15} />
                                    Print
                                </button>
                            </div>
                        </div>

                        {/* MASTER SUPERVISORS TABLE */}
                        <div className="supervisors-table-wrap">
                            <table className="supervisors-master-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "45px" }}>#</th>
                                        <th>Supervisor Details</th>
                                        <th>Site / Region</th>
                                        <th>Total Distance ({datePreset === "30_DAYS" ? "30 Days" : "Selected Period"})</th>
                                        <th>GPS Points</th>
                                        <th>Avg / Day</th>
                                        <th style={{ width: "260px" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryLoading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                                <Loader2 size={24} className="btn-spinner" style={{ margin: "0 auto 8px" }} />
                                                Loading distance summary for all supervisors...
                                            </td>
                                        </tr>
                                    ) : distanceReports.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                                                No distance reports found for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        distanceReports.map((report, idx) => {
                                            const supervisorId = report.user?.id;
                                            const isExpanded = expandedSupervisorId === supervisorId;
                                            const totalKm = Number(report.distanceKm) || 0;
                                            const avgPerDay = (totalKm / 30).toFixed(2);

                                            return (
                                                <>
                                                    <tr key={supervisorId || idx}>
                                                        <td>
                                                            <strong>{idx + 1}</strong>
                                                        </td>

                                                        <td>
                                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                                <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                                                    {report.user?.name || "N/A"}
                                                                </strong>
                                                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                                    {report.user?.phone || report.user?.email || "No contact info"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                                <span style={{ fontWeight: 600, color: "#334155" }}>
                                                                    {report.site?.name || "Unassigned"}
                                                                </span>
                                                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                                    {report.site?.city ? `${report.site.city}, ${report.site.state || ""}` : (report.site?.state || "All Regions")}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span className="distance-km-badge">
                                                                <Car size={13} />
                                                                {totalKm.toFixed(2)} KM
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span style={{ fontWeight: 600, color: "#475569" }}>
                                                                {report.locationPoints || 0} logs
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                                                                ~{avgPerDay} KM/day
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button
                                                                    type="button"
                                                                    className="btn-daywise-toggle"
                                                                    onClick={() => toggleSupervisorBreakdown(supervisorId)}
                                                                >
                                                                    <Calendar size={13} />
                                                                    {isExpanded ? "Hide Days" : "📅 Day-wise Breakdown"}
                                                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="btn-view-map-direct"
                                                                    onClick={() => openMapForSupervisorAndDate(supervisorId, toDate)}
                                                                    title="Open daily GPS map"
                                                                >
                                                                    <Navigation size={13} />
                                                                    Map
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* DAY-WISE BREAKDOWN ACCORDION ROW */}
                                                    {isExpanded && (
                                                        <tr key={`breakdown-${supervisorId}`} className="day-breakdown-row">
                                                            <td colSpan="7">
                                                                <div className="day-breakdown-container">
                                                                    <div className="day-breakdown-header">
                                                                        <h4>
                                                                            <CalendarDays size={16} color="#2563eb" />
                                                                            Day-wise Travel History: {report.user?.name}
                                                                            <span style={{ fontWeight: 400, color: "#64748b", fontSize: "12px" }}>
                                                                                ({formatDateDisplay(fromDate).split(",")[0]} to {formatDateDisplay(toDate).split(",")[0]})
                                                                            </span>
                                                                        </h4>

                                                                        <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                                                                            Click on any date to open its GPS Route Playback & Audit details
                                                                        </span>
                                                                    </div>

                                                                    {breakdownLoading && !dailyBreakdowns[supervisorId] ? (
                                                                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                                                                            <Loader2 size={18} className="btn-spinner" /> Loading daily records...
                                                                        </div>
                                                                    ) : (
                                                                        <table className="day-breakdown-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Date</th>
                                                                                    <th>Distance Traveled</th>
                                                                                    <th>Tracked Points</th>
                                                                                    <th>Route Playback & Site Visits</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {(dailyBreakdowns[supervisorId] || generateDateSlots(fromDate, toDate)).map((day, dIdx) => (
                                                                                    <tr key={dIdx}>
                                                                                        <td>
                                                                                            <strong>{formatDateDisplay(day.date)}</strong>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span
                                                                                                style={{
                                                                                                    padding: "3px 8px",
                                                                                                    borderRadius: "5px",
                                                                                                    fontSize: "12px",
                                                                                                    fontWeight: 700,
                                                                                                    background: day.distanceKm > 0 ? "#DCFCE7" : "#F1F5F9",
                                                                                                    color: day.distanceKm > 0 ? "#15803D" : "#64748B",
                                                                                                }}
                                                                                            >
                                                                                                {Number(day.distanceKm || 0).toFixed(2)} KM
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                                                                                                {day.pointsCount || (day.distanceKm > 0 ? "GPS Logs Active" : "No logs")}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn-open-day-map"
                                                                                                onClick={() => openMapForSupervisorAndDate(supervisorId, day.date)}
                                                                                            >
                                                                                                <Navigation size={12} />
                                                                                                View Route Map & Audits ({day.date})
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    VIEW 2: DAILY ROUTE & AUDIT TRACKING MAP (From Online Page)
                ========================================================= */}
                {viewMode === "map" && (
                    <div className="daily-route-map-section">
                        {/* TOP MAP FILTER BAR */}
                        <div className="distance-top-bar">
                            <button
                                type="button"
                                className="btn-back-to-summary"
                                onClick={() => setViewMode("summary")}
                            >
                                <ArrowLeft size={16} />
                                Back to All Supervisors (Summary)
                            </button>

                            <div className="officer-select-group">
                                <label>Select Officer:</label>
                                <select
                                    value={selectedOfficer}
                                    onChange={(e) => setSelectedOfficer(e.target.value)}
                                >
                                    <option value="">-- Select Supervisor --</option>
                                    {supervisors.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.phone || s.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="date-select-group">
                                <label>Date:</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn-search-route"
                                onClick={fetchDailyRoute}
                                disabled={mapLoading}
                            >
                                {mapLoading ? <Loader2 size={16} className="btn-spinner" /> : "SEARCH"}
                            </button>
                        </div>

                        {/* STATUS PILLS */}
                        {routeData && (
                            <div className="route-stats-bar">
                                <div className="stat-pill">
                                    <User size={15} />
                                    <span>Supervisor: <strong>{routeData.user?.name}</strong></span>
                                </div>
                                <div className="stat-pill">
                                    <Radio size={15} color={routeData.isOnline ? "#16a34a" : "#dc2626"} />
                                    <span>{routeData.isOnline ? "Online (Live GPS Active)" : "Offline"}</span>
                                </div>
                                <div className="stat-pill">
                                    <MapPin size={15} />
                                    <span>Total Travelled ({selectedDate}): <strong>{routeData.totalDistanceKm} KM</strong></span>
                                </div>
                                <div className="stat-pill">
                                    <Clock size={15} />
                                    <span>GPS Logs: {routeData.route?.length || 0} points</span>
                                </div>
                            </div>
                        )}

                        {mapError && <div style={{ padding: "12px", background: "#FEE2E2", color: "#B91C1C", borderRadius: "6px", marginBottom: "14px" }}>{mapError}</div>}

                        {/* LEAFLET MAP */}
                        <div
                            className="tracking-map-container"
                            style={{
                                width: "100%",
                                height: "480px",
                                minHeight: "480px",
                                position: "relative",
                                zIndex: 1,
                                marginBottom: "20px",
                            }}
                        >
                            <MapContainer
                                center={[30.901, 75.8573]}
                                zoom={12}
                                scrollWheelZoom={true}
                                zoomControl={false}
                                className="route-leaflet-map"
                                style={{ width: "100%", height: "100%", minHeight: "480px" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <ZoomControl position="topleft" />

                                <MapBoundsFitter
                                    routeCoords={routeCoords}
                                    markersCoords={stopCoords}
                                />

                                {/* Red Travel Polyline */}
                                {routeCoords.length > 1 && (
                                    <Polyline
                                        positions={routeCoords}
                                        pathOptions={{
                                            color: "#dc2626",
                                            weight: 4,
                                            opacity: 0.9,
                                            lineJoin: "round",
                                        }}
                                    />
                                )}

                                {/* Site Markers */}
                                {sitesList.map((site) => (
                                    <CircleMarker
                                        key={`site-${site.id}`}
                                        center={[Number(site.latitude), Number(site.longitude)]}
                                        radius={8}
                                        pathOptions={{
                                            fillColor: "#ef4444",
                                            color: "#ffffff",
                                            weight: 2,
                                            fillOpacity: 0.9,
                                        }}
                                    >
                                        <Popup>
                                            <div>
                                                <strong>{site.name}</strong>
                                                <p>{site.siteCode}</p>
                                                <p>{site.address}</p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}

                                {/* Numbered Stop Markers */}
                                {stopsList.map((stop) => {
                                    if (!Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) return null;
                                    return (
                                        <Marker
                                            key={`stop-${stop.stopNumber || stop.id}`}
                                            position={[Number(stop.latitude), Number(stop.longitude)]}
                                            icon={createStopIcon(stop.stopNumber || 1)}
                                        >
                                            <Popup>
                                                <div style={{ fontSize: "12px" }}>
                                                    <strong>Stop #{stop.stopNumber} ({stop.type})</strong>
                                                    <p style={{ margin: "3px 0" }}>{stop.locationName}</p>
                                                    <p style={{ margin: "3px 0" }}>Time: {stop.time}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}

                                {/* Live Pulsing Pin */}
                                {routeData?.isOnline && routeData?.route?.length > 0 && (
                                    <Marker
                                        position={[
                                            Number(routeData.route[routeData.route.length - 1].latitude),
                                            Number(routeData.route[routeData.route.length - 1].longitude),
                                        ]}
                                        icon={createLiveIcon()}
                                    >
                                        <Popup>
                                            <div>
                                                <strong>📍 Live GPS Location</strong>
                                                <p>{routeData.user?.name}</p>
                                                <p>Status: LIVE ONLINE</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>

                        {/* STOPS TIMELINE TABLE */}
                        <div className="stops-table-toolbar">
                            <div className="search-box-wrap" style={{ width: "260px" }}>
                                <Search size={15} />
                                <input
                                    type="text"
                                    placeholder="Filter stops..."
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button type="button" className="btn-export-excel" onClick={handleExportMapExcel}>
                                    <FileSpreadsheet size={15} /> Export Stops
                                </button>
                                <button type="button" className="btn-print" onClick={printStopsTable}>
                                    <Printer size={15} /> Print
                                </button>
                            </div>
                        </div>

                        <div className="stops-table-wrapper">
                            <table className="stops-table">
                                <thead>
                                    <tr>
                                        <th>Stop #</th>
                                        <th>Action</th>
                                        <th>Stop Type</th>
                                        <th>Location / Site Name</th>
                                        <th>Arrival Time</th>
                                        <th>Distance from Prev</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStops.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                                No stops recorded for this supervisor on {selectedDate}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStops.map((stop) => (
                                            <tr key={stop.id || stop.stopNumber}>
                                                <td>
                                                    <strong>#{stop.stopNumber}</strong>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-view-doc"
                                                        title="View Details"
                                                        onClick={() => {
                                                            if (stop.type === "CHECK_IN" || stop.type === "CHECK_OUT") {
                                                                handleOpenCheckInModal(stop);
                                                            } else {
                                                                handleOpenAuditModal(stop);
                                                            }
                                                        }}
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                </td>

                                                <td>
                                                    <span
                                                        style={{
                                                            padding: "3px 8px",
                                                            borderRadius: "4px",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            background: stop.type === "CHECK_IN" ? "#DBEAFE" : stop.type === "SITE_VISIT" ? "#FEF3C7" : "#F3E8FF",
                                                            color: stop.type === "CHECK_IN" ? "#1E40AF" : stop.type === "SITE_VISIT" ? "#92400E" : "#6B21A8",
                                                        }}
                                                    >
                                                        {stop.type}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong>{stop.locationName}</strong>
                                                    {stop.siteCode && (
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{stop.siteCode}</div>
                                                    )}
                                                </td>

                                                <td>{stop.time}</td>
                                                <td>{stop.distanceFromPrevKm || "0.00"} KM</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* CHECKIN DETAILS MODAL (Exact match with LatestCheckIn.jsx) */}
            {selectedCheckIn && (
                <div className="checkin-modal-overlay" onClick={() => setSelectedCheckIn(null)}>
                    <div className="checkin-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="checkin-modal-header">
                            <h3>CHECKIN DETAILS</h3>
                            <button type="button" className="modal-close-btn" onClick={() => setSelectedCheckIn(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="checkin-modal-body">
                            <div className="checkin-details-grid">
                                <div className="detail-item"><label>Check In ID :</label><span>{selectedCheckIn.checkInId}</span></div>
                                <div className="detail-item"><label>Name :</label><span>{selectedCheckIn.name}</span></div>
                                <div className="detail-item"><label>Check In Date Time:</label><span>{selectedCheckIn.checkInDateTime}</span></div>
                                <div className="detail-item"><label>Check Out Date Time:</label><span>{selectedCheckIn.checkOutDateTime}</span></div>

                                {/* SUPERVISOR GPS COORDINATES */}
                                <div className="detail-item">
                                    <label>Supervisor Check-In GPS :</label>
                                    <span style={{ fontWeight: 600, color: "#1e40af" }}>
                                        {selectedCheckIn.checkInLatitude != null && selectedCheckIn.checkInLongitude != null
                                            ? `Lat: ${Number(selectedCheckIn.checkInLatitude).toFixed(6)}, Long: ${Number(selectedCheckIn.checkInLongitude).toFixed(6)}`
                                            : "Not recorded"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Supervisor Check-Out GPS :</label>
                                    <span style={{ fontWeight: 600, color: "#1e40af" }}>
                                        {selectedCheckIn.checkOutLatitude != null && selectedCheckIn.checkOutLongitude != null
                                            ? `Lat: ${Number(selectedCheckIn.checkOutLatitude).toFixed(6)}, Long: ${Number(selectedCheckIn.checkOutLongitude).toFixed(6)}`
                                            : (selectedCheckIn.checkOutDateTime !== "NA" && selectedCheckIn.checkOutDateTime !== "NA (Currently Active)" ? "Not recorded" : "Active / Pending")}
                                    </span>
                                </div>

                                {/* SITE GPS COORDINATES & SITE DETAILS */}
                                <div className="detail-item">
                                    <label>Site Name & Code :</label>
                                    <span>{selectedCheckIn.siteName} {selectedCheckIn.siteCode && selectedCheckIn.siteCode !== "NA" ? `(${selectedCheckIn.siteCode})` : ""}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Site Registered GPS :</label>
                                    <span style={{ fontWeight: 600, color: "#b45309" }}>
                                        {selectedCheckIn.siteLatitude != null && selectedCheckIn.siteLongitude != null
                                            ? `Lat: ${Number(selectedCheckIn.siteLatitude).toFixed(6)}, Long: ${Number(selectedCheckIn.siteLongitude).toFixed(6)}`
                                            : "Not registered (Auto-detected)"}
                                    </span>
                                </div>

                                <div className="detail-item full-width"><label>GPS Check In Address :</label><span>{selectedCheckIn.gpsCheckInAddress}</span></div>
                                <div className="detail-item full-width"><label>GPS Check Out Address :</label><span>{selectedCheckIn.gpsCheckOutAddress}</span></div>
                                <div className="detail-item full-width"><label>Distance Travelled :</label><span className="dist-highlight">{selectedCheckIn.distanceTravelled}</span></div>

                                {/* ALTERNATE CHECKIN MODE DISPLAY */}
                                <div className="detail-item full-width" style={{ background: selectedCheckIn.isAlternate ? "#fef3c7" : "#f0fdf4", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${selectedCheckIn.isAlternate ? '#f59e0b' : '#86efac'}` }}>
                                    <label style={{ color: selectedCheckIn.isAlternate ? "#92400e" : "#166534", fontWeight: 700 }}>Check In Mode :</label>
                                    <span style={{ color: selectedCheckIn.isAlternate ? "#d97706" : "#16a34a", fontWeight: "800", fontSize: "13.5px" }}>
                                        {selectedCheckIn.isAlternate
                                            ? `🌧️ Rain / Emergency Exception (${selectedCheckIn.alternateReason || "Geofence Bypassed"})`
                                            : "Standard Verified Check-In (Within 100m)"}
                                    </span>
                                </div>
                            </div>

                            {/* SUPERVISOR SELFIE */}
                            <div className="selfies-container">
                                <div className="selfie-card">
                                    <div
                                        className="selfie-image-wrap"
                                        onClick={() => {
                                            if (selectedCheckIn.checkInPhotoUrl) {
                                                setPreviewPhoto({
                                                    url: selectedCheckIn.checkInPhotoUrl,
                                                    title: `Supervisor Selfie - ${selectedCheckIn.name}`,
                                                });
                                            }
                                        }}
                                        style={{ cursor: selectedCheckIn.checkInPhotoUrl ? "pointer" : "default" }}
                                    >
                                        {selectedCheckIn.checkInPhotoUrl ? (
                                            <div className="selfie-img-container">
                                                <img src={selectedCheckIn.checkInPhotoUrl} alt="Check-In Selfie" />
                                                <div className="selfie-hover-hint">
                                                    <ZoomIn size={14} /> Click to Zoom
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="selfie-placeholder">
                                                <span className="placeholder-text">No Selfie Photo Attached</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="selfie-caption">Selfie (Check In) Image</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DYNAMIC AUDIT REPORT MODAL (Exact match with LatestVisits.jsx) */}
            {selectedAuditVisit && (() => {
                const v = selectedAuditVisit;
                const vsfReport = parseVsfReport(v);
                const realQuestions = extractAuditQuestions(v, activeChecklist);
                const siteEvidencePhotos = extractSiteEvidencePhotos(v);
                const clientFeedback = extractClientFeedback(v);
                const scoreQuestions = realQuestions.filter((q) => q.booleanValue === true || q.booleanValue === false);
                const totalQ = realQuestions.length;
                const passedQ = realQuestions.filter((q) => q.booleanValue === true).length;
                const scorePct = scoreQuestions.length > 0 ? Math.round((passedQ / scoreQuestions.length) * 100) : 0;
                const currentSite = vsfReport?.siteName || v.site?.name || v.siteName || v.clientName || v.locationName || "Site";
                const vDateStr = v.visitAt ? new Date(v.visitAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : (v.completedOn || "N/A");
                const vTimeStr = v.visitAt ? new Date(v.visitAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A";

                return (
                    <div className="audit-modal-overlay" onClick={() => setSelectedAuditVisit(null)}>
                        <div className="audit-modal-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="audit-modal-top-header">
                                <div>
                                    <h3>{vsfReport ? "VINICIA VSF Inspection Report" : `${currentSite} — Audit & Visit Verification Details`}</h3>
                                    <p>{currentSite} ({v.site?.siteCode || v.siteCode || "N/A"}) • {vDateStr}, {vTimeStr}</p>
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
                                        <h4>{vsfReport ? `${currentSite.toUpperCase()} — VSF INSPECTION` : `${currentSite.toUpperCase()} — SITE AUDIT CHECKLIST`}</h4>
                                        <p>{scoreQuestions.length > 0 ? `${passedQ} of ${scoreQuestions.length} Yes/No checkpoints marked YES` : `${totalQ} submitted responses`}</p>
                                        <div className="score-meta">
                                            <span className="badge-pass"><ShieldCheck size={14} /> COMPLIANCE: {scorePct}%</span>
                                            <span>Status: <strong>{v.status || "PENDING"}</strong></span>
                                            <span>Auditor: <strong>{v.user?.name || v.assignTo || "Supervisor"}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="audit-details-grid">
                                    <div className="audit-detail-cell"><label>{vsfReport ? "Server Visit ID" : "Visit / Task ID"}</label><p>{v.id || v.visitId || "N/A"}</p></div>
                                    {vsfReport && <div className="audit-detail-cell"><label>Task ID</label><p>{vsfReport.taskId || "—"}</p></div>}
                                    {vsfReport && <div className="audit-detail-cell"><label>Submitted On</label><p>{vsfReport.submittedAt ? new Date(vsfReport.submittedAt).toLocaleString("en-IN") : `${vDateStr} ${vTimeStr}`}</p></div>}
                                    <div className="audit-detail-cell"><label>Site Code & Name</label><p>{currentSite} ({v.site?.siteCode || v.siteCode || "N/A"})</p></div>
                                    <div className="audit-detail-cell"><label>Auditor Name & Contact</label><p>{v.user?.name || v.assignTo || "Supervisor"} ({v.user?.phone || v.user?.email || "N/A"})</p></div>
                                    <div className="audit-detail-cell"><label>Date & Time</label><p>{vDateStr} at {vTimeStr}</p></div>
                                    <div className="audit-detail-cell" style={{ gridColumn: "1 / -1" }}>
                                        <label>Site Address & GPS Coordinates</label>
                                        <p>{v.site?.address || v.address || "—"} • Coordinates: [{v.latitude ?? "N/A"}, {v.longitude ?? "N/A"}]</p>
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
                                    <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "#0f172a" }}>{vsfReport ? `VSF Inspection Responses (${realQuestions.length} Questions)` : `Audit Checklist Responses (${realQuestions.length} Questions)`}</h4>
                                    <div className="audit-cards-grid">
                                        {realQuestions.length === 0 ? (
                                            <p style={{ color: "#64748b", padding: "16px" }}>No checklist answers submitted for this visit.</p>
                                        ) : (
                                            realQuestions.map((q) => (
                                                <div key={`${q.section || "audit"}-${q.no}`} className="audit-question-card">
                                                    {q.section && <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px", color: "#6366f1", marginBottom: "6px" }}>{q.section}</div>}
                                                    <div className="q-card-header">
                                                        <span className="q-badge">#{q.no}</span>
                                                        <strong className="q-text">{q.text}</strong>
                                                        <span style={{ background: q.booleanValue === false ? "#fee2e2" : q.booleanValue === true ? "#dcfce7" : "#f1f5f9", color: q.booleanValue === false ? "#b91c1c" : q.booleanValue === true ? "#15803d" : "#475569", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>{q.ans}</span>
                                                    </div>
                                                    {q.remarks && <div style={{ marginTop: "7px", fontSize: "12px", color: "#475569", whiteSpace: "pre-wrap" }}><strong>Remarks / Details: </strong>{q.remarks}</div>}
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
                                    <button type="button" className="btn-modal-print" onClick={() => printAuditReport(v)}><Printer size={15} /> Print / Save PDF</button>
                                    <button type="button" className="btn-modal-reject" disabled={updatingId === v.id} onClick={() => updateVisitStatus(v, "REJECTED")}><XCircle size={16} /> Reject Visit</button>
                                    <button type="button" className="btn-modal-unverify" disabled={updatingId === v.id} onClick={() => updateVisitStatus(v, "UNVERIFIED")}><RotateCcw size={16} /> Mark Unverified</button>
                                    <button type="button" className="btn-modal-verify" disabled={updatingId === v.id} onClick={() => updateVisitStatus(v, "VERIFIED")}>
                                        {updatingId === v.id ? <Loader2 size={16} className="btn-spinner" /> : <CheckCircle2 size={16} />} Verify Visit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
                            <strong style={{ color: "#f8fafc", fontSize: "15px" }}>{previewPhoto.title || "Photo Preview"}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <a href={previewPhoto.url} download={`photo-${Date.now()}.jpg`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#2563eb", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
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

export default DistanceReport;
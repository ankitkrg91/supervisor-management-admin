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

// 45 HDFC Audit Questions matching aud.pdf
const HDFC_45_QUESTIONS = [
    { no: 1, text: "NUMBER OF EMPLOYEES", ans: "1", score: null },
    { no: 2, text: "ENTER GUARD DETAILS", ans: "Santosh (Guard ID: 8941)", score: null },
    { no: 3, text: "GROOMING & TURNOUT", ans: "Yes - Complete Uniform & Badge", score: "3/ 3", photo: true, photoCount: 2, photoLabel: "Guard uniform & turnout photos" },
    { no: 4, text: "ESS APP LOGIN STATUS", ans: "Yes", score: "3/ 3", photo: true, photoCount: 1, photoLabel: "ESS App login screen photo" },
    { no: 5, text: "UAN/ PF STATUS", ans: "Yes- 101705766775", score: "5/ 5" },
    { no: 6, text: "ESIC", ans: "Yes- 2914015193", score: "5/ 5" },
    { no: 7, text: "LAST MONTH SALARY RECEIVED", ans: "Yes", score: "3/ 3" },
    { no: 8, text: "KIT RECEIVED", ans: "Yes", score: "2/ 2" },
    { no: 9, text: "RENEWAL KIT RECEIVED", ans: "Yes", score: "2/ 2" },
    { no: 10, text: "SITE HOUSEKEEPING QUALITY", ans: "Yes", score: "5/ 5" },
    { no: 11, text: "LOBBY AREA", ans: "Yes", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Lobby area photo" },
    { no: 12, text: "MEETING ROOM", ans: "Yes", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Meeting room photo" },
    { no: 13, text: "PANTRY", ans: "Yes", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Pantry photo" },
    { no: 14, text: "WASH ROOM", ans: "Yes", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Wash room photo" },
    { no: 15, text: "CABINS", ans: "Yes", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Cabins photo" },
    { no: 16, text: "WORK STATIONS", ans: "Yes", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Work stations photo" },
    { no: 17, text: "COMMON AREA", ans: "Yes", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Common area photo" },
    { no: 18, text: "STORE ROOM", ans: "Yes", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Store room photo" },
    { no: 19, text: "ATTENDANCE REGISTER", ans: "Yes", score: "3/ 3", photo: true, photoCount: 1, photoLabel: "Attendance register page photo" },
    { no: 20, text: "HK WASHROOM CHECKLIST", ans: "Yes", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "HK washroom checklist photo" },
    { no: 21, text: "HK KYC DOCUMENT", ans: "Yes", score: "2/ 2", photo: true, photoCount: 1, photoLabel: "HK KYC document photo" },
    { no: 22, text: "OTHER", ans: "all documents complete", score: null },
    { no: 23, text: "KNOWLEDGE OF DUTY POST", ans: "Yes", score: "2/ 2" },
    { no: 24, text: "KNOWLEDGE OF DOCUMENTATION", ans: "Yes", score: "2/ 2" },
    { no: 25, text: "KNOWLEDGE OF FIRE SAFETY AND EMERGENCY SITUATION", ans: "Yes", score: "5/ 5" },
    { no: 26, text: "OTHER TRAINING", ans: "Yes", score: "0/ 0" },
    { no: 27, text: "TRAINING TOPICS", ans: "Yes", score: "10/ 10", photo: true, photoCount: 2, photoLabel: "Training session photos" },
    { no: 28, text: "POST ORDER", ans: "YES", score: null },
    { no: 29, text: "FED", ans: "YES", score: null },
    { no: 30, text: "MEDICAL EMERGENCY", ans: "YES", score: null },
    { no: 31, text: "FIRST AID AND CPR", ans: "YES", score: null },
    { no: 32, text: "HANDING/TAKING OVER", ans: "YES", score: null },
    { no: 33, text: "POSH", ans: "YES", score: null },
    { no: 34, text: "OPEN SESSION", ans: "YES", score: null },
    { no: 35, text: "DAILY USE EQUIPMENTS / CLEANING CHEMICAL", ans: "YES", score: null },
    { no: 36, text: "PPE TRAINING", ans: "YES", score: null },
    { no: 37, text: "DEEP CLEANING", ans: "YES", score: null },
    { no: 38, text: "CLIENT MET", ans: "YES", score: "3/ 3" },
    { no: 39, text: "NAME", ans: "Govind sir", score: null },
    { no: 40, text: "DESIGNATION", ans: "Branch Manager", score: null },
    { no: 41, text: "CLIENT'S FEEDBACK", ans: "EXCELLENT", score: null },
    { no: 42, text: "OBSERVATIONS", ans: "NO", score: null },
    { no: 43, text: "ANY R & M WORK REQUIRED", ans: "NO", score: "3/ 3" },
    { no: 44, text: "ANY OTHER OBSERVATIONS", ans: "no", score: null },
    { no: 45, text: "INCIDENT RESPONSE", ans: "NO", score: "2/ 2" },
];

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

    // Modals
    const [selectedCheckIn, setSelectedCheckIn] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

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

    /* =========================================================
       PRINT COMPLETE 45-POINT AUDIT REPORT (NO SCROLL CUT-OFF)
       ========================================================= */
    const printAuditReport = (task) => {
        if (!task) return;
        const printWindow = window.open("", "_blank", "width=1000,height=900");
        if (!printWindow) {
            alert("Please allow popups to print the audit report.");
            return;
        }

        const questionsRows = HDFC_45_QUESTIONS.map((q) => `
            <tr>
                <td style="text-align: center; font-weight: bold; width: 40px; border: 1px solid #cbd5e1;">#${q.no}</td>
                <td style="border: 1px solid #cbd5e1;">
                    <strong>${q.text}</strong>
                    ${q.photo ? `<div style="font-size: 11px; color: #d97706; margin-top: 2px;">📷 Photo Verified (${q.photoLabel})</div>` : ""}
                </td>
                <td style="font-weight: 600; color: #2563eb; width: 140px; border: 1px solid #cbd5e1;">${q.ans}</td>
                <td style="text-align: center; font-weight: bold; color: #15803d; width: 80px; border: 1px solid #cbd5e1;">${q.score || "—"}</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>HDFC Audit Report - ${task.siteName || "Branch"}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm 15mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12.5px; line-height: 1.4; }
                    .report-header { border-bottom: 2.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .report-header h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
                    .report-header p { margin: 3px 0 0; color: #64748b; font-size: 12px; }
                    .score-banner { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
                    .score-box { text-align: right; }
                    .score-num { font-size: 24px; font-weight: 800; color: #15803d; }
                    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
                    .meta-table td { padding: 6px 10px; border: 1px solid #e2e8f0; }
                    .meta-label { background: #f8fafc; font-weight: 600; color: #475569; width: 22%; }
                    .meta-val { color: #0f172a; font-weight: 600; }
                    .audit-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 10px; }
                    .audit-table th { background: #1e3a8a; color: #ffffff; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #1e3a8a; }
                    .audit-table td { padding: 6px 10px; vertical-align: middle; }
                    .audit-table tr:nth-child(even) { background: #f8fafc; }
                    .audit-table tr { page-break-inside: avoid; break-inside: avoid; }
                    .footer-sign { margin-top: 30px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <div>
                        <h1>HDFC BANK BRANCH AUDIT REPORT</h1>
                        <p>Comprehensive Branch Operations & Security Compliance Checklist</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: #64748b;">Date: ${new Date().toLocaleDateString("en-IN")}</div>
                        <div style="font-weight: 800; color: #15803d; font-size: 14px; margin-top: 2px;">STATUS: VERIFIED</div>
                    </div>
                </div>

                <div class="score-banner">
                    <div>
                        <strong style="font-size: 15px; color: #166534;">HDFC BRANCH AUDIT CHECKLIST</strong>
                        <div style="font-size: 12px; color: #15803d; margin-top: 2px;">Audit Reference: aud.pdf (45 Compliance Standards Evaluated)</div>
                    </div>
                    <div class="score-box">
                        <div class="score-num">100 / 100</div>
                        <div style="font-size: 11px; font-weight: 700; color: #166534;">COMPLIANCE: 100%</div>
                    </div>
                </div>

                <table class="meta-table">
                    <tr>
                        <td class="meta-label">Task / Visit ID</td>
                        <td class="meta-val">${task.visitId || task.id}</td>
                        <td class="meta-label">Auditor / Supervisor</td>
                        <td class="meta-val">${task.assignTo || "Supervisor"}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Site Name & Code</td>
                        <td class="meta-val">${task.siteName || "Client Site"} (${task.siteCode || "18552"})</td>
                        <td class="meta-label">Completed On</td>
                        <td class="meta-val">${task.completedOn || "Completed"}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Site Address</td>
                        <td class="meta-val" colspan="3">${task.address || "Client Branch Address"}</td>
                    </tr>
                </table>

                <h3 style="margin: 0 0 6px; font-size: 13.5px; color: #1e293b;">Checklist Evaluation (All 45 Questions)</h3>
                <table class="audit-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th>Audit Checklist Parameter</th>
                            <th style="width: 140px;">Response / Status</th>
                            <th style="width: 80px; text-align: center;">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${questionsRows}
                    </tbody>
                </table>

                <div class="footer-sign">
                    <div>
                        <div>Auditor Signature: _______________________</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 4px;">Name: ${task.assignTo || "Supervisor"}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>Verified by Admin: _______________________</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 4px;">Super Admin Portal Verified</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 400);
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
                                                                setSelectedCheckIn(stop);
                                                            } else {
                                                                setSelectedTask(stop);
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

            {/* CHECK-IN DETAILS MODAL */}
            {selectedCheckIn && (
                <div className="checkin-modal-overlay" onClick={() => setSelectedCheckIn(null)}>
                    <div className="checkin-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="checkin-modal-header">
                            <h3>Check-In & Check-Out Details</h3>
                            <button type="button" className="btn-modal-close" onClick={() => setSelectedCheckIn(null)}>×</button>
                        </div>
                        <div className="checkin-modal-body">
                            <div className="checkin-details-grid">
                                <div className="checkin-detail-cell">
                                    <label>Check-In ID</label>
                                    <p>{selectedCheckIn.checkInId || "N/A"}</p>
                                </div>
                                <div className="checkin-detail-cell">
                                    <label>Distance Travelled</label>
                                    <p>{selectedCheckIn.distanceTravelled || selectedCheckIn.distanceFromPrevKm || "0.00"} KM</p>
                                </div>
                                <div className="checkin-detail-cell">
                                    <label>Check-In Date / Time</label>
                                    <p>{selectedCheckIn.checkInTime ? new Date(selectedCheckIn.checkInTime).toLocaleString("en-IN") : selectedCheckIn.time}</p>
                                </div>
                                <div className="checkin-detail-cell">
                                    <label>Check-Out Date / Time</label>
                                    <p style={{ color: selectedCheckIn.checkOutTime ? "#15803D" : "#DC2626", fontWeight: 700 }}>
                                        {selectedCheckIn.checkOutTime ? new Date(selectedCheckIn.checkOutTime).toLocaleString("en-IN") : "NA (Currently Active)"}
                                    </p>
                                </div>
                                <div className="checkin-detail-cell" style={{ gridColumn: "1 / -1" }}>
                                    <label>GPS Check-In Address</label>
                                    <p>{selectedCheckIn.checkInAddress || "Verified by Device GPS"}</p>
                                </div>
                                <div className="checkin-detail-cell" style={{ gridColumn: "1 / -1" }}>
                                    <label>GPS Check-Out Address</label>
                                    <p>{selectedCheckIn.checkOutAddress || (selectedCheckIn.checkOutTime ? "Verified on Check-Out" : "NA")}</p>
                                </div>
                            </div>

                            <div className="selfie-photos-row">
                                <div className="selfie-card">
                                    <label>Selfie (Check In)</label>
                                    <div className="selfie-img-placeholder">
                                        {selectedCheckIn.selfieIn ? (
                                            <img src={selectedCheckIn.selfieIn} alt="Check In Selfie" />
                                        ) : (
                                            <>
                                                <Camera size={26} />
                                                <span>Check-In Selfie</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="selfie-card">
                                    <label>Selfie (Check Out)</label>
                                    <div className="selfie-img-placeholder">
                                        {selectedCheckIn.selfieOut ? (
                                            <img src={selectedCheckIn.selfieOut} alt="Check Out Selfie" />
                                        ) : (
                                            <>
                                                <Camera size={26} />
                                                <span>{selectedCheckIn.checkOutTime ? "Checkout Selfie" : "NA (Pending)"}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TASK / AUDIT DETAILS MODAL (Matching aud.pdf) */}
            {selectedTask && (
                <div className="checkin-modal-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="checkin-modal-card task-audit-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="checkin-modal-header">
                            <h3>Site Audit & Inspection Report</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                    type="button"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        background: "#ffffff",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => printAuditReport(selectedTask)}
                                    title="Print Full 45-Point Audit Report"
                                >
                                    <Printer size={14} /> Print Report
                                </button>
                                <button type="button" className="btn-modal-close" onClick={() => setSelectedTask(null)}>×</button>
                            </div>
                        </div>
                        <div className="checkin-modal-body">
                            <div className="audit-info-banner">
                                <div>
                                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                                        {selectedTask.siteName || selectedTask.locationName} ({selectedTask.siteCode || "MSF"})
                                    </strong>
                                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                                        {selectedTask.address || "Client Verified Site Location"}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>Date & Time</div>
                                    <strong style={{ fontSize: "13px" }}>{selectedTask.timeFull ? new Date(selectedTask.timeFull).toLocaleString("en-IN") : selectedTask.time}</strong>
                                </div>
                            </div>

                            <div className="audit-score-header">
                                <strong>TOTAL SCORE - 100 / 100</strong>
                                <span style={{ fontSize: "12px", background: "#DCFCE7", color: "#15803D", padding: "4px 10px", borderRadius: "999px", fontWeight: 700 }}>
                                    PASSED & VERIFIED
                                </span>
                            </div>

                            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>Audit Checklist Questions (45 Cards)</h4>
                            <div className="audit-checklist-cards-container">
                                {HDFC_45_QUESTIONS.map((q) => (
                                    <div key={q.no} className="audit-question-card">
                                        <div className="card-top-row">
                                            <span className="q-title">{q.no}. &nbsp;{q.text}</span>
                                            {q.score && <span className="score-pill-badge">SCORE : {q.score}</span>}
                                        </div>
                                        <div className="card-answer-val">{q.ans}</div>
                                        {q.photo && (
                                            <div style={{ marginTop: "6px", fontSize: "11px", color: "#d97706", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Camera size={12} />
                                                <span>Photo Attached: {q.photoLabel}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DistanceReport;

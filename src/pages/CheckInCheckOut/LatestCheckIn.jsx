import { useEffect, useMemo, useState } from "react";
import {
    Search,
    FileSpreadsheet,
    File,
    Printer,
    X,
    Filter,
    RefreshCw,
    Loader2,
    ZoomIn,
    Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../../utils/api";
import "./LatestCheckIn.css";

const PAGE_SIZE = 10;

const formatDistance = (val) => {
    if (val === null || val === undefined || val === "") return "0.00 KM";
    if (typeof val === "string" && val.includes("KM")) return val;
    const num = Number(val);
    return Number.isNaN(num) ? "0.00 KM" : `${num.toFixed(2)} KM`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const formatWorkingHours = (checkInAt, checkOutAt) => {
    if (!checkInAt) return "—";
    const start = new Date(checkInAt);
    if (Number.isNaN(start.getTime())) return "—";
    const end = checkOutAt ? new Date(checkOutAt) : new Date();
    if (Number.isNaN(end.getTime())) return "—";
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "0h 0m";
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return checkOutAt ? `${hrs}h ${mins}m` : "Running";
};

const LatestCheckIn = () => {
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedRole, setSelectedRole] = useState("SUPERVISOR");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchText, setSearchText] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

    const [selectedCheckIn, setSelectedCheckIn] = useState(null);
    const [enlargedPhoto, setEnlargedPhoto] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchCheckIns = async (targetPage = page, customFilters = {}) => {
        try {
            setLoading(true);
            setError("");

            const role = customFilters.role !== undefined ? customFilters.role : selectedRole;
            const from = customFilters.from !== undefined ? customFilters.from : fromDate;
            const to = customFilters.to !== undefined ? customFilters.to : toDate;
            const search = customFilters.search !== undefined ? customFilters.search : searchText;

            const params = new URLSearchParams({
                page: String(targetPage),
                limit: String(PAGE_SIZE),
            });

            if (role && role !== "ALL") params.append("role", role);
            if (from) params.append("from", from);
            if (to) params.append("to", to);
            if (search && search.trim()) params.append("search", search.trim());

            const res = await apiFetch(`/api/check-ins?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to fetch check-ins");
            }

            const list = data?.data?.checkIns || [];
            const pag = data?.data?.pagination || { page: targetPage, limit: PAGE_SIZE, total: list.length, totalPages: 1 };

            setCheckIns(list);
            setPagination(pag);
        } catch (err) {
            setError(err?.message || "Error fetching check-in records");
            setCheckIns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckIns(1);
    }, []);

    const rows = useMemo(() => {
        return checkIns.map((item) => ({
            id: item.id,
            name: item.user?.name || "N/A",
            phone: item.user?.phone || "",
            workingHours: formatWorkingHours(item.checkInAt, item.checkOutAt),
            checkInDate: formatDate(item.checkInAt),
            checkInTime: formatTime(item.checkInAt),
            checkOutDate: item.checkOutAt ? formatDate(item.checkOutAt) : "—",
            checkOutTime: item.checkOutAt ? formatTime(item.checkOutAt) : "",
            distance: formatDistance(item.distanceTravelled),
            role: item.user?.role || "SUPERVISOR",
            site: item.site?.name || "NA",
            siteCode: item.site?.siteCode || "NA",
            siteLatitude: item.site?.latitude ?? null,
            siteLongitude: item.site?.longitude ?? null,
            siteAddress: item.site?.address ? `${item.site.address}, ${item.site.city || ""}` : "NA",
            email: item.user?.email || "NA",
            checkInAt: item.checkInAt,
            checkOutAt: item.checkOutAt,
            checkInLatitude: item.checkInLatitude,
            checkInLongitude: item.checkInLongitude,
            checkOutLatitude: item.checkOutLatitude,
            checkOutLongitude: item.checkOutLongitude,
            checkInPhotoUrl: item.checkInPhotoUrl || item.photoUrl || item.selfieUrl || null,
            isAlternate: Boolean(item.isAlternate),
            alternateReason: item.alternateReason || null,
            rawItem: item,
        }));
    }, [checkIns]);

    const handleSearch = () => {
        setPage(1);
        fetchCheckIns(1, { role: selectedRole, from: fromDate, to: toDate, search: searchText });
    };

    const handleRoleChange = (e) => {
        const role = e.target.value;
        setSelectedRole(role);
        setPage(1);
        fetchCheckIns(1, { role, from: fromDate, to: toDate, search: searchText });
    };

    const handleClearFilters = () => {
        setSelectedRole("SUPERVISOR");
        setFromDate("");
        setToDate("");
        setSearchText("");
        setPage(1);
        fetchCheckIns(1, { role: "SUPERVISOR", from: "", to: "", search: "" });
    };

    const exportToExcel = () => {
        if (!rows.length) return;
        const excelRows = rows.map((it) => ({
            Name: it.name,
            "Working Hours": it.workingHours,
            "Check-In Date": it.checkInDate,
            "Check-In Time": it.checkInTime,
            "Check-Out Date": it.checkOutDate,
            "Check-Out Time": it.checkOutTime,
            "Distance Travelled": it.distance,
            "Check-In Mode": it.isAlternate ? `Rain/Emergency (${it.alternateReason || "Geofence Bypassed"})` : "Standard (Within 100m)",
            Role: it.role,
            Site: it.site,
            "Site Code": it.siteCode,
            "Supervisor Lat": it.checkInLatitude ?? "",
            "Supervisor Long": it.checkInLongitude ?? "",
            "Site Lat": it.siteLatitude ?? "",
            "Site Long": it.siteLongitude ?? "",
        }));
        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LatestCheckIns");
        XLSX.writeFile(wb, `Latest_CheckIns_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const printTable = () => {
        if (!rows.length) return;
        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) {
            alert("Please allow popups to print the table.");
            return;
        }

        const tableRowsHtml = rows.map((item) => `
      <tr>
        <td><strong>${item.name}</strong> ${item.isAlternate ? '<span style="color:#d97706;font-size:10px;font-weight:700;">(🌧️ Rain/Emergency)</span>' : ''}</td>
        <td>${item.workingHours}</td>
        <td>${item.checkInDate}</td>
        <td><strong>${item.checkInTime}</strong></td>
        <td>${item.checkOutDate}</td>
        <td><strong>${item.checkOutTime || "—"}</strong></td>
        <td style="font-weight: 600; color: #2563eb;">${item.distance}</td>
        <td><strong>${item.site}</strong> (${item.siteCode})</td>
      </tr>
    `).join("");

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Latest Check-In Report</title>
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
        <h2>Supervisor Latest Check-In Report</h2>
        <p>Generated on: ${new Date().toLocaleString("en-IN")}</p>
        <table>
          <thead>
            <tr>
              <th>Supervisor Name</th>
              <th>Working Hours</th>
              <th>Check-In Date</th>
              <th>Check-In Time</th>
              <th>Check-Out Date</th>
              <th>Check-Out Time</th>
              <th>Distance</th>
              <th>Site & Code</th>
            </tr>
          </thead>
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
        setTimeout(() => {
            printWindow.print();
        }, 400);
    };

    const handleDownloadPhoto = async (photoUrl, filename = "supervisor-selfie.jpg") => {
        if (!photoUrl) return;
        try {
            if (photoUrl.startsWith("data:") || photoUrl.startsWith("blob:")) {
                const link = document.createElement("a");
                link.href = photoUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }
            const response = await fetch(photoUrl, { mode: "cors" });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            window.open(photoUrl, "_blank");
        }
    };

    const handleView = (item) => {
        const inDate = new Date(item.checkInAt);
        const dateTag = isNaN(inDate.getTime()) ? "DATE" : inDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(/\s+/g, "_");
        const timeTag = item.checkInTime ? item.checkInTime.replace(":", "_") : "00_00";
        const checkInId = `${item.name.replace(/\s+/g, "")}${item.phone || "0000"}-${dateTag}_${timeTag}`;

        const inAddr = item.siteAddress && item.siteAddress !== "NA"
            ? item.siteAddress
            : item.checkInLatitude && item.checkInLongitude ? `${item.checkInLatitude.toFixed(6)}, ${item.checkInLongitude.toFixed(6)}` : "Recorded at Site";

        const outAddr = item.checkOutAt
            ? (item.siteAddress && item.siteAddress !== "NA" ? item.siteAddress : item.checkOutLatitude && item.checkOutLongitude ? `${item.checkOutLatitude.toFixed(6)}, ${item.checkOutLongitude.toFixed(6)}` : "Recorded at Site")
            : "NA";

        const photoUrl = item.checkInPhotoUrl || item.rawItem?.checkInPhotoUrl || item.rawItem?.photoUrl || item.rawItem?.selfieUrl || null;

        setSelectedCheckIn({
            checkInId,
            name: item.name,
            checkInDateTime: `${item.checkInDate} ${item.checkInTime}`.trim(),
            checkOutDateTime: item.checkOutAt ? `${item.checkOutDate} ${item.checkOutTime}`.trim() : "NA (Currently Active)",
            gpsCheckInAddress: inAddr,
            gpsCheckOutAddress: outAddr,
            checkInLatitude: item.checkInLatitude,
            checkInLongitude: item.checkInLongitude,
            checkOutLatitude: item.checkOutLatitude,
            checkOutLongitude: item.checkOutLongitude,
            siteName: item.site,
            siteCode: item.siteCode,
            siteLatitude: item.siteLatitude,
            siteLongitude: item.siteLongitude,
            distanceTravelled: item.distance,
            checkInPhotoUrl: photoUrl,
            isAlternate: item.isAlternate,
            alternateReason: item.alternateReason,
        });
    };

    return (
        <div className="latest-checkin-page">
            <div className="latest-checkin-card">
                {/* TABLE CONTROLS */}
                <div className="table-controls">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            className={`filter-button ${showFilters ? "active" : ""}`}
                            onClick={() => setShowFilters((p) => !p)}
                            title="Toggle Filters"
                        >
                            <Filter size={18} />
                        </button>

                        <div className="table-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search supervisor or site..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                    </div>

                    <div className="export-buttons">
                        <button type="button" className="export-button" onClick={exportToExcel} title="Export to Excel">
                            <FileSpreadsheet size={18} />
                        </button>
                        <button type="button" className="export-button" onClick={printTable} title="Print Table">
                            <Printer size={18} />
                        </button>
                        <button type="button" className="export-button" onClick={() => fetchCheckIns(page)} title="Refresh">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* EXPANDABLE FILTER PANEL */}
                {showFilters && (
                    <div className="checkin-filter-panel">
                        <div className="checkin-filter-field">
                            <label>From Date:</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="checkin-filter-field">
                            <label>To Date:</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <div className="checkin-filter-field">
                            <label>Role:</label>
                            <select
                                value={selectedRole}
                                onChange={handleRoleChange}
                                style={{
                                    width: "190px",
                                    height: "38px",
                                    padding: "0 10px",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "5px",
                                    background: "var(--input-bg)",
                                    color: "var(--text-primary)",
                                    outline: "none",
                                    fontSize: "13px",
                                }}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="SUPERVISOR">Supervisor</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                        <button type="button" className="checkin-apply-button" onClick={handleSearch}>
                            Apply Filter
                        </button>
                        <button type="button" className="checkin-reset-button" onClick={handleClearFilters}>
                            Reset
                        </button>
                    </div>
                )}

                {/* ERROR DISPLAY */}
                {error && (
                    <div style={{ padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "14px", fontSize: "13px" }}>
                        <span>{error}</span>
                    </div>
                )}

                {/* DATA TABLE */}
                <div className="checkin-table-wrapper">
                    <table className="checkin-table">
                        <thead>
                            <tr>
                                <th className="view-column">View</th>
                                <th>Name</th>
                                <th>Working Hours</th>
                                <th>Check-In Date</th>
                                <th>Check-In Time</th>
                                <th>Check-Out Date</th>
                                <th>Check-Out Time</th>
                                <th>Distance Travelled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                                        <div>Loading check-in records...</div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        No check-in records found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((item) => (
                                    <tr key={item.id}>
                                        <td className="view-column">
                                            <button
                                                type="button"
                                                className="view-button"
                                                onClick={() => handleView(item)}
                                                title="View Check-In Details"
                                            >
                                                <File size={16} />
                                            </button>
                                        </td>
                                        <td className="name-cell">
                                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                                            {item.isAlternate ? (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        background: "#fef3c7",
                                                        color: "#b45309",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        marginLeft: "6px",
                                                        border: "1px solid #f59e0b",
                                                    }}
                                                >
                                                    🌧️ Rain/Remote
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        background: "#ecfdf5",
                                                        color: "#15803d",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        marginLeft: "6px",
                                                        border: "1px solid #86efac",
                                                    }}
                                                >
                                                    ✓ Standard
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${item.workingHours === 'Running' ? 'running' : ''}`}>
                                                {item.workingHours}
                                            </span>
                                        </td>
                                        <td>{item.checkInDate}</td>
                                        <td><strong style={{ color: "#0f172a" }}>{item.checkInTime}</strong></td>
                                        <td>{item.checkOutDate}</td>
                                        <td><strong style={{ color: "#0f172a" }}>{item.checkOutTime || "—"}</strong></td>
                                        <td style={{ fontWeight: 700, color: "#2563eb" }}>{item.distance}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="checkin-pagination-footer">
                    <span>
                        Showing {rows.length} records. Total: {pagination.total}
                    </span>
                    <div className="checkin-pagination">
                        <button
                            type="button"
                            disabled={pagination.page <= 1}
                            onClick={() => {
                                const prev = pagination.page - 1;
                                setPage(prev);
                                fetchCheckIns(prev);
                            }}
                        >
                            Previous
                        </button>
                        <button type="button" className="active">
                            {pagination.page}
                        </button>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => {
                                const next = pagination.page + 1;
                                setPage(next);
                                fetchCheckIns(next);
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* CHECKIN DETAILS MODAL */}
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
                                                setEnlargedPhoto({
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

            {/* FULL-SCREEN PHOTO LIGHTBOX MODAL (WITH DOWNLOAD & CLOSE BUTTONS) */}
            {enlargedPhoto && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.92)",
                        zIndex: 99999,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                    }}
                    onClick={() => setEnlargedPhoto(null)}
                >
                    <div
                        style={{
                            maxWidth: "92vw",
                            maxHeight: "90vh",
                            background: "#0f172a",
                            borderRadius: "14px",
                            padding: "16px",
                            border: "1px solid #334155",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "16px",
                                marginBottom: "12px",
                                paddingBottom: "10px",
                                borderBottom: "1px solid #334155",
                            }}
                        >
                            <strong style={{ color: "#f8fafc", fontSize: "15px" }}>
                                {enlargedPhoto.title || "Supervisor Selfie"}
                            </strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownloadPhoto(
                                            enlargedPhoto.url,
                                            `selfie-${(selectedCheckIn?.name || "supervisor").replace(/\s+/g, "_")}-${Date.now()}.jpg`
                                        )
                                    }
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "7px 14px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                    title="Download Photo"
                                >
                                    <Download size={15} /> Download
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEnlargedPhoto(null)}
                                    style={{
                                        background: "#dc2626",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "7px 12px",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontWeight: 700,
                                        fontSize: "12px",
                                    }}
                                    title="Close"
                                >
                                    <X size={16} /> Close
                                </button>
                            </div>
                        </div>
                        <img
                            src={enlargedPhoto.url}
                            alt={enlargedPhoto.title || "Full Preview"}
                            style={{
                                maxWidth: "86vw",
                                maxHeight: "76vh",
                                objectFit: "contain",
                                borderRadius: "8px",
                                background: "#000",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LatestCheckIn;
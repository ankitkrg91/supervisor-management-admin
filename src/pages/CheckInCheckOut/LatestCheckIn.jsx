import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays, Search, FileSpreadsheet, Printer, File,
    Filter, X, Camera, ZoomIn
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../../utils/api";
import "./LatestCheckIn.css";

const LatestCheckIn = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedRole, setSelectedRole] = useState("SUPERVISOR");
    const [searchText, setSearchText] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [selectedCheckIn, setSelectedCheckIn] = useState(null);
    const [enlargedPhoto, setEnlargedPhoto] = useState(null);

    const fetchCheckIns = async (requestedPage = 1, overrides = {}) => {
        try {
            setLoading(true);
            setError("");
            const params = new URLSearchParams();
            const role = overrides.role !== undefined ? overrides.role : selectedRole;
            const from = overrides.from !== undefined ? overrides.from : fromDate;
            const to = overrides.to !== undefined ? overrides.to : toDate;
            const search = overrides.search !== undefined ? overrides.search : searchText;

            if (role && role !== "ALL") params.set("role", role);
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            if (search && search.trim()) params.set("search", search.trim());
            params.set("page", String(requestedPage));
            params.set("limit", "10");

            const response = await apiFetch(`/api/check-ins?${params.toString()}`, { method: "GET" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Failed to fetch check-in records");
            }

            const list = data?.data?.checkIns || data?.checkIns || [];
            const pg = data?.pagination || data?.data?.pagination || {
                page: requestedPage, limit: 10, total: list.length, totalPages: 1,
            };

            setCheckIns(Array.isArray(list) ? list : []);
            setPagination({
                page: pg.page || requestedPage,
                limit: pg.limit || 10,
                total: Number(pg.total) >= 0 ? Number(pg.total) : list.length,
                totalPages: pg.totalPages || 1,
            });
        } catch (err) {
            console.error("Fetch checkins error:", err);
            setError(err?.message || "Failed to fetch check-in records");
            setCheckIns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckIns(1);
    }, []);

    const formatDate = (val) => {
        if (!val) return "NA";
        const d = new Date(val);
        return isNaN(d.getTime()) ? "NA" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatTime = (val) => {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const calculateWorkingHours = (inAt, outAt) => {
        if (!inAt) return "NA";
        if (!outAt) return "Running";
        const start = new Date(inAt).getTime();
        const end = new Date(outAt).getTime();
        if (isNaN(start) || isNaN(end) || end < start) return "NA";
        const diff = Math.floor((end - start) / (1000 * 60));
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    const formatDistance = (val) => {
        if (val === null || val === undefined || val === "") return "0.00 KM";
        const n = Number(val);
        return isNaN(n) ? "0.00 KM" : `${n.toFixed(2)} KM`;
    };

    const tableData = useMemo(() => {
        return checkIns.map((item) => ({
            id: item.id,
            name: item.user?.name || "Unknown",
            phone: item.user?.phone || "",
            workingHours: calculateWorkingHours(item.checkInAt, item.checkOutAt),
            checkInDate: formatDate(item.checkInAt),
            checkInTime: formatTime(item.checkInAt),
            checkOutDate: item.checkOutAt ? formatDate(item.checkOutAt) : "NA",
            checkOutTime: item.checkOutAt ? formatTime(item.checkOutAt) : "",
            distance: formatDistance(item.distanceTravelled),
            role: item.user?.role || "SUPERVISOR",
            site: item.site?.name || "NA",
            siteAddress: item.site?.address ? `${item.site.address}, ${item.site.city || ""}` : "NA",
            email: item.user?.email || "NA",
            checkInAt: item.checkInAt,
            checkOutAt: item.checkOutAt,
            checkInLatitude: item.checkInLatitude,
            checkInLongitude: item.checkInLongitude,
            checkOutLatitude: item.checkOutLatitude,
            checkOutLongitude: item.checkOutLongitude,
            checkInPhotoUrl: item.checkInPhotoUrl || item.photoUrl || item.selfieUrl || null,
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

    const handleApplyFilter = () => {
        setPage(1);
        fetchCheckIns(1, { role: selectedRole, from: fromDate, to: toDate, search: searchText });
    };

    const handleResetFilter = () => {
        setFromDate("");
        setToDate("");
        setSelectedRole("SUPERVISOR");
        setSearchText("");
        setPage(1);
        fetchCheckIns(1, { role: "SUPERVISOR", from: "", to: "", search: "" });
    };

    const handleExportExcel = () => {
        if (!tableData.length) return;
        const rows = tableData.map((it) => ({
            Name: it.name,
            Phone: it.phone,
            "Working Hours": it.workingHours,
            "Check-In Date": it.checkInDate,
            "Check-In Time": it.checkInTime,
            "Check-Out Date": it.checkOutDate,
            "Check-Out Time": it.checkOutTime,
            "Distance Travelled": it.distance,
            Role: it.role,
            Site: it.site,
            Email: it.email,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CheckIn_Records");
        XLSX.writeFile(wb, "checkin-records.xlsx");
    };

    /* =========================================================
       PRINT CLEAN TABLE ONLY (NO SIDEBAR, NO TOPBAR)
       ========================================================= */
    const printTable = () => {
        if (!tableData.length) {
            alert("No check-in records available to print.");
            return;
        }

        const printWindow = window.open("", "_blank", "width=1100,height=850");
        if (!printWindow) {
            alert("Please allow popups in your browser to print the check-in report.");
            return;
        }

        const dateStr = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const timeStr = new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        const rowsHtml = tableData.map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
        <td>
          <strong>${item.name}</strong>
          ${item.phone ? `<br/><span style="color: #64748b; font-size: 11px;">${item.phone}</span>` : ""}
        </td>
        <td style="font-weight: 600; color: ${item.workingHours === 'Running' ? '#16a34a' : '#1e293b'};"><span class="badge-status">${item.workingHours}</span></td>
        <td>${item.checkInDate}</td>
        <td><strong>${item.checkInTime}</strong></td>
        <td>${item.checkOutDate}</td>
        <td><strong>${item.checkOutTime || "—"}</strong></td>
        <td style="font-weight: 600; color: #2563eb;">${item.distance}</td>
        <td><strong>${item.site}</strong></td>
      </tr>
    `).join("");

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supervisor Check-In & Attendance Report - ${dateStr}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .report-header {
            border-bottom: 2.5px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .report-header h1 {
            margin: 0;
            font-size: 20px;
            color: #1e3a8a;
            letter-spacing: 0.5px;
          }
          .report-header p {
            margin: 3px 0 0;
            color: #64748b;
            font-size: 12px;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .report-meta strong {
            color: #0f172a;
            font-size: 12px;
          }
          .summary-strip {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 14px;
            border-radius: 6px;
            margin-bottom: 14px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
          }
          th {
            background: #1e3a8a;
            color: #ffffff;
            padding: 9px 10px;
            text-align: left;
            border: 1px solid #1e3a8a;
            font-weight: 600;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .badge-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
          }
          .report-footer {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 14px;
            border-top: 1px solid #cbd5e1;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <h1>SUPERVISOR CHECK-IN & ATTENDANCE REPORT</h1>
            <p>Official Field Staff Attendance & Travel Records</p>
          </div>
          <div class="report-meta">
            <div>Printed On: <strong>${dateStr} at ${timeStr}</strong></div>
            <div>Role: <strong>${selectedRole}</strong></div>
          </div>
        </div>

        <div class="summary-strip">
          <div>Total Records: <strong>${pagination.total || tableData.length}</strong> | Page <strong>${pagination.page} of ${pagination.totalPages}</strong></div>
          <div>Filter Range: <strong>${fromDate ? `From ${fromDate}` : "All Dates"} ${toDate ? `To ${toDate}` : ""}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>Supervisor Name</th>
              <th>Working Hours</th>
              <th>Check-In Date</th>
              <th>Check-In Time</th>
              <th>Check-Out Date</th>
              <th>Check-Out Time</th>
              <th>Distance Travelled</th>
              <th>Site Name</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="report-footer">
          <div>Verified By: <strong>Super Admin Portal</strong></div>
          <div>Page 1 of 1</div>
        </div>
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
            checkOutDateTime: item.checkOutAt ? `${item.checkOutDate} ${item.checkOutTime}`.trim() : "NA",
            gpsCheckInAddress: inAddr,
            gpsCheckOutAddress: outAddr,
            distanceTravelled: item.distance,
            checkInPhotoUrl: photoUrl,
        });
    };

    return (
        <div className="latest-checkin-page">
            <div className="latest-checkin-card">
                {/* TOOLBAR CONTROLS (CLEAN FLEX ROW) */}
                <div className="table-controls">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            className={`filter-button ${showFilters ? "active" : ""}`}
                            onClick={() => setShowFilters((p) => !p)}
                            title="Toggle Filters"
                        >
                            <Filter size={18} />
                        </button>

                        <div className="table-search">
                            <input
                                type="text"
                                placeholder="Search supervisor or site..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                            />
                            <Search size={18} onClick={handleSearch} style={{ cursor: "pointer" }} />
                        </div>

                        <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            style={{
                                height: "36px",
                                padding: "0 12px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color)",
                                background: "var(--input-bg)",
                                color: "var(--text-primary)",
                                fontSize: "13px",
                                outline: "none",
                                cursor: "pointer",
                            }}
                        >
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="ADMIN">Admin</option>
                            <option value="ALL">All Roles</option>
                        </select>
                    </div>

                    <div className="export-buttons">
                        <button type="button" className="export-button" title="Export Excel" onClick={handleExportExcel}>
                            <FileSpreadsheet size={18} />
                        </button>
                        <button type="button" className="export-button" title="Print Table" onClick={printTable}>
                            <Printer size={18} />
                        </button>
                    </div>
                </div>

                {/* EXPANDABLE FILTER ROW */}
                {showFilters && (
                    <div className="checkin-filter-panel">
                        <div className="checkin-filter-field">
                            <label>From Date</label>
                            <div className="date-input-wrapper">
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                                <span className="date-icon"><CalendarDays size={18} /></span>
                            </div>
                        </div>

                        <div className="checkin-filter-field">
                            <label>To Date</label>
                            <div className="date-input-wrapper">
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                                <span className="date-icon"><CalendarDays size={18} /></span>
                            </div>
                        </div>

                        <button type="button" className="checkin-apply-button" onClick={handleApplyFilter}>
                            APPLY
                        </button>
                        <button type="button" className="checkin-reset-button" onClick={handleResetFilter}>
                            RESET
                        </button>
                    </div>
                )}

                {error && (
                    <div style={{ padding: "12px 16px", color: "#dc2626", background: "#fee2e2", borderRadius: "8px", margin: "10px 0", fontSize: "13px" }}>
                        {error}
                    </div>
                )}

                {/* TABLE */}
                <div className="checkin-table-wrapper">
                    <table className="checkin-table">
                        <thead>
                            <tr>
                                <th className="view-column">
                                    <span><File size={16} /> View</span>
                                </th>
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
                                <tr><td colSpan="8" className="empty-state">Loading check-in records...</td></tr>
                            ) : tableData.length > 0 ? (
                                tableData.map((item) => (
                                    <tr key={item.id}>
                                        <td className="view-column">
                                            <button
                                                type="button"
                                                className="view-button"
                                                title={`View ${item.name} Checkin Details`}
                                                onClick={() => handleView(item)}
                                            >
                                                <File size={16} />
                                            </button>
                                        </td>
                                        <td className="name-cell">{item.name}</td>
                                        <td>
                                            <span className={`status-pill ${item.workingHours === 'Running' ? 'running' : ''}`}>
                                                {item.workingHours}
                                            </span>
                                        </td>
                                        <td>{item.checkInDate}</td>
                                        <td>{item.checkInTime}</td>
                                        <td>{item.checkOutDate}</td>
                                        <td>{item.checkOutTime || "—"}</td>
                                        <td>{item.distance}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="empty-state">No check-in records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="checkin-pagination-footer">
                    <span>Showing {tableData.length} records. Total: {pagination.total}</span>
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
                        <button type="button" className="active">{pagination.page}</button>
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
                                <div className="detail-item full-width"><label>GPS Check In Address :</label><span>{selectedCheckIn.gpsCheckInAddress}</span></div>
                                <div className="detail-item full-width"><label>GPS Check Out Address :</label><span>{selectedCheckIn.gpsCheckOutAddress}</span></div>
                                <div className="detail-item full-width"><label>Distance Travelled :</label><span className="dist-highlight">{selectedCheckIn.distanceTravelled}</span></div>
                            </div>

                            {/* ONLY SUPERVISOR SELFIE - NO CHECKOUT CARD */}
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
                                                <img src={selectedCheckIn.checkInPhotoUrl} alt="Supervisor Selfie" />
                                                <div className="selfie-hover-hint"><ZoomIn size={16} /> Click to enlarge</div>
                                            </div>
                                        ) : (
                                            <div className="selfie-placeholder">
                                                <Camera size={36} color="#94a3b8" />
                                                <span>Supervisor Selfie Not Available</span>
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

            {/* ENLARGED PHOTO LIGHTBOX */}
            {enlargedPhoto && (
                <div className="checkin-modal-overlay lightbox-overlay" onClick={() => setEnlargedPhoto(null)}>
                    <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
                        <div className="lightbox-header">
                            <span>{enlargedPhoto.title || "Supervisor Selfie"}</span>
                            <button type="button" className="modal-close-btn" onClick={() => setEnlargedPhoto(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="lightbox-body">
                            <img src={enlargedPhoto.url} alt="Enlarged Selfie" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LatestCheckIn;
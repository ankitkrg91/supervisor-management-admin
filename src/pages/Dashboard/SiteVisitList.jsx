import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../../utils/api";
import "./SiteVisitList.css";

const PAGE_SIZE = 10;

const SiteVisitList = () => {
    const [searchParams] = useSearchParams();
    const queryString = searchParams.toString();
    const period = searchParams.get("period") === "last" ? "last" : "current";
    const status = searchParams.get("status") === "NOT-VISITED" ? "NOT-VISITED" : "VISITED";
    const periodLabel = period === "last" ? "Last Month" : "Current Month";

    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;

        const loadSites = async () => {
            setLoading(true);
            setError("");
            try {
                const endpoint = queryString
                    ? `/api/dashboard/site-visits?${queryString}`
                    : "/api/dashboard/site-visits";
                const response = await apiFetch(endpoint, { method: "GET" });
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result?.message || "Unable to load site list.");
                }

                if (active) {
                    setSites(Array.isArray(result?.data?.sites) ? result.data.sites : []);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError?.message || "Unable to load site list.");
                    setSites([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadSites();
        return () => { active = false; };
    }, [queryString, refreshKey]);

    const filteredSites = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return sites;
        return sites.filter((site) => [
            site.siteId,
            site.siteName,
            site.address,
            site.branch,
            site.state,
            site.clientName,
            site.siteOwner,
        ].some((value) => String(value ?? "").toLowerCase().includes(query)));
    }, [sites, searchText]);

    const totalPages = Math.max(1, Math.ceil(filteredSites.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleSites = filteredSites.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const exportExcel = () => {
        const rows = filteredSites.map((site, index) => ({
            "S. No.": index + 1,
            "Site ID": site.siteId,
            "Site name": site.siteName,
            Address: site.address,
            Branch: site.branch,
            State: site.state,
            "Client name": site.clientName,
            Siteowner: site.siteOwner,
        }));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Site Visits");
        XLSX.writeFile(
            workbook,
            `${status.replaceAll("-", "_")}_${period}_sites_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
    };

    return (
        <div className="site-visit-list-page">
            <section className="site-visit-list-card">
                <header className="site-visit-list-header">
                    <div>
                        <h1>{status}</h1>
                        <p>{periodLabel} site list · {sites.length} entries</p>
                    </div>
                    <button
                        type="button"
                        className="site-visit-refresh-button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        disabled={loading}
                    >
                        <RefreshCw size={15} className={loading ? "site-visit-spinning" : ""} />
                        Refresh
                    </button>
                </header>

                <div className="site-visit-toolbar">
                    <label className="site-visit-search" htmlFor="site-visit-search-input">
                        <span>Search:</span>
                        <span className="site-visit-search-input-wrap">
                            <Search size={15} />
                            <input
                                id="site-visit-search-input"
                                type="search"
                                placeholder="Search site, address, client, owner..."
                                value={searchText}
                                onChange={(event) => {
                                    setSearchText(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </span>
                    </label>
                    <button type="button" className="site-visit-export-button" onClick={exportExcel} disabled={loading || filteredSites.length === 0}>
                        <FileSpreadsheet size={15} /> EXCEL
                    </button>
                </div>

                {error && <div className="site-visit-error" role="alert">{error}</div>}

                <div className="site-visit-table-wrap">
                    <table className="site-visit-table">
                        <thead>
                            <tr>
                                <th className="site-visit-number-col">#</th>
                                <th>Site ID</th>
                                <th>Site name</th>
                                <th>Address</th>
                                <th>Branch</th>
                                <th>State</th>
                                <th>Client name</th>
                                <th>Siteowner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="site-visit-empty">Loading site records...</td></tr>
                            ) : visibleSites.length === 0 ? (
                                <tr><td colSpan={8} className="site-visit-empty">{error ? "Site records could not be loaded." : "No site records found."}</td></tr>
                            ) : visibleSites.map((site, index) => (
                                <tr key={site.id || site.siteId}>
                                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                                    <td>{site.siteId || "—"}</td>
                                    <td>{site.siteName || "—"}</td>
                                    <td>{site.address || "—"}</td>
                                    <td>{site.branch || "—"}</td>
                                    <td>{site.state || "—"}</td>
                                    <td>{site.clientName || "—"}</td>
                                    <td>{site.siteOwner || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="site-visit-table-footer">
                    <span>
                        Showing {filteredSites.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, filteredSites.length)} of {filteredSites.length} entries
                    </span>
                    <div className="site-visit-pagination">
                        <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </footer>
            </section>
        </div>
    );
};

export default SiteVisitList;

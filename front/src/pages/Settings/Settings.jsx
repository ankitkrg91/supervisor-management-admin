import { useEffect, useMemo, useState } from "react";
import {
    Users,
    Building2,
    Plus,
    Search,
    X,
    Edit3,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    UserRound,
    MapPin,
} from "lucide-react";

import * as XLSX from "xlsx";

import "./Settings.css";
import { apiFetch } from "../../utils/api";
const PAGE_SIZE_DEFAULT = 10;

const ROLE_OPTIONS = [
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "FIELD_STAFF", label: "Field Staff" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
];

// These are job designations, not new database access roles.
// Each designation receives the existing SUPER_ADMIN access role so login
// and current role-protected APIs continue to work without expanding UserRole.
const ADMIN_DESIGNATION_OPTIONS = [
    { value: "DESIGNATION_BH", label: "BH" },
    { value: "DESIGNATION_AO_AREA_OFFICER", label: "AO-AREA OFFICER" },
    { value: "DESIGNATION_AO_EXECUTIVE_MSF", label: "AO-EXECUTIVE-MSF" },
    { value: "DESIGNATION_AO_ASSIGNMENT_OFFICER", label: "AO-ASSIGNMENT OFFICER" },
    { value: "DESIGNATION_AO_ASST_MANAGER", label: "AO-ASST. MANAGER" },
    { value: "DESIGNATION_AO_EXECUTIVE_ATM", label: "AO-EXECUTIVE-ATM" },
    { value: "DESIGNATION_AO_EXECUTIVE_MFM", label: "AO-EXECUTIVE-MFM" },
    { value: "DESIGNATION_AO_OPERATION_MANAGER", label: "AO-OPERATION MANAGER" },
    { value: "DESIGNATION_AO_OPERATION_MANAGER_TRG", label: "AO-OPERATION MANAGER-TRG" },
    { value: "DESIGNATION_AO_TRAINING_OFFICER", label: "AO-TRAINING OFFICER" },
    { value: "DESIGNATION_AO_OPERATION_MANAGER_MFM", label: "AO-OPERATION MANAGER-MFM" },
    { value: "DESIGNATION_AO_ELECTRICIAN_MST", label: "AO-ELECTRICIAN-MST" },
    { value: "DESIGNATION_AO_SR_EXECUTIVE_MFM", label: "AO-SR. EXECUTIVE-MFM" },
    { value: "DESIGNATION_MFM", label: "MFM" },
    { value: "DESIGNATION_HR_EXECUTIVE", label: "HR-EXECUTIVE" },
];

const OTHER_DESIGNATION_VALUE = "OTHER_DESIGNATION";
const CUSTOM_DESIGNATION_PREFIX = "CUSTOM_DESIGNATION:";

const getDesignationOption = (value) =>
    ADMIN_DESIGNATION_OPTIONS.find((option) => option.value === value);

const getDesignationValue = (label) =>
    ADMIN_DESIGNATION_OPTIONS.find((option) => option.label === label)?.value || null;

const getEffectiveRole = (selectedValue) =>
    getDesignationOption(selectedValue) ||
        selectedValue === OTHER_DESIGNATION_VALUE ||
        String(selectedValue || "").startsWith(CUSTOM_DESIGNATION_PREFIX)
        ? "SUPER_ADMIN"
        : selectedValue;

const EMPTY_USER = {
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "SUPERVISOR",
    customDesignation: "",
    siteId: "",
    status: "ACTIVE",
};

const EMPTY_SITE = {
    name: "",
    siteCode: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    status: "ACTIVE",
};

const request = async (url, options = {}) => {
    const endpoint = url.startsWith("/api/")
        ? url
        : `/api${url}`;

    const response = await apiFetch(endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            body?.message ||
            body?.error ||
            `Request failed with status ${response.status}`
        );
    }

    return body;
};

const getArray = (body, key) => {
    const data = body?.data ?? body;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.[key])) {
        return data[key];
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.rows)) {
        return data.rows;
    }

    return [];
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const roleLabel = (role, designation) => {
    if (designation) return designation;
    const item = ROLE_OPTIONS.find((option) => option.value === role);
    return item?.label || role || "-";
};

const Settings = () => {
    const [activeTab, setActiveTab] = useState("users");

    const [users, setUsers] = useState([]);
    const [sites, setSites] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [searchText, setSearchText] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

    const [modalType, setModalType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const [userForm, setUserForm] = useState(EMPTY_USER);
    const [siteForm, setSiteForm] = useState(EMPTY_SITE);

    const [activeSites, setActiveSites] = useState([]);

    // Reuse custom designations already present on user records so a custom
    // title entered through "Other" remains available in this dropdown later.
    const customDesignationOptions = useMemo(() => {
        const predefinedLabels = new Set(
            ADMIN_DESIGNATION_OPTIONS.map((option) => option.label.toLowerCase())
        );
        const seen = new Set();

        return users
            .map((user) => String(user?.designation || "").trim())
            .filter((label) => {
                if (!label || predefinedLabels.has(label.toLowerCase())) return false;
                const key = label.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map((label) => ({
                value: `${CUSTOM_DESIGNATION_PREFIX}${label}`,
                label,
            }));
    }, [users]);

    const getSelectedDesignation = (selectedValue) => {
        const fixedOption = getDesignationOption(selectedValue);
        if (fixedOption) return fixedOption;

        const dynamicOption = customDesignationOptions.find(
            (option) => option.value === selectedValue
        );
        if (dynamicOption) return dynamicOption;

        if (selectedValue === OTHER_DESIGNATION_VALUE) {
            const customLabel = String(userForm.customDesignation || "").trim();
            return customLabel ? { value: OTHER_DESIGNATION_VALUE, label: customLabel } : null;
        }

        return null;
    };

    const showError = (message) => {
        setError(message);
        setSuccess("");
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError("");

        setTimeout(() => {
            setSuccess("");
        }, 3000);
    };

    const loadUsers = async () => {
        const body = await request("/users?status=ALL");
        setUsers(getArray(body, "users"));
    };

    const loadSites = async () => {
        const body = await request("/sites?status=ALL");
        const siteList = getArray(body, "sites");

        setSites(siteList);
        setActiveSites(
            siteList.filter(
                (site) =>
                    String(site?.status || "").toUpperCase() === "ACTIVE"
            )
        );
    };

    const loadAll = async () => {
        try {
            setLoading(true);
            setError("");

            await Promise.all([loadUsers(), loadSites()]);
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [activeTab, searchText, statusFilter, pageSize]);

    const currentData = activeTab === "users" ? users : sites;

    const filteredData = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return currentData.filter((item) => {
            const statusMatch =
                statusFilter === "ALL" || item.status === statusFilter;

            if (!statusMatch) {
                return false;
            }

            if (!query) {
                return true;
            }

            if (activeTab === "users") {
                const values = [
                    item.name,
                    item.email,
                    item.phone,
                    item.role,
                    item.site?.name,
                    item.site?.siteCode,
                    item.site?.city,
                    item.site?.state,
                ];

                return values.some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(query)
                );
            }

            const values = [
                item.name,
                item.siteCode,
                item.clientName,
                item.clientPhone,
                item.clientEmail,
                item.address,
                item.city,
                item.state,
                item.pincode,
            ];

            return values.some((value) =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [activeTab, currentData, searchText, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredData.length / pageSize)
    );

    const safePage = Math.min(page, totalPages);

    const paginatedData = useMemo(() => {
        const start = (safePage - 1) * pageSize;

        return filteredData.slice(start, start + pageSize);
    }, [filteredData, safePage, pageSize]);

    const firstEntry =
        filteredData.length === 0
            ? 0
            : (safePage - 1) * pageSize + 1;

    const lastEntry =
        filteredData.length === 0
            ? 0
            : Math.min(safePage * pageSize, filteredData.length);

    const resetSearch = () => {
        setSearchInput("");
        setSearchText("");
        setStatusFilter("ALL");
        setPage(1);
    };

    const handleSearch = () => {
        setSearchText(searchInput);
        setPage(1);
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    const closeModal = () => {
        if (saving) return;

        setModalType(null);
        setEditingItem(null);
        setUserForm(EMPTY_USER);
        setSiteForm(EMPTY_SITE);
    };

    const openAddUser = async () => {
        setEditingItem(null);
        setUserForm({ ...EMPTY_USER });
        setError("");
        setSuccess("");
        setModalType("user");

        // Refresh sites/users when the modal opens so newly created
        // records are immediately available.
        try {
            await Promise.all([
                loadSites(),
                loadUsers(),
            ]);
        } catch (err) {
            showError(
                err?.message ||
                "Failed to load user form data."
            );
        }
    };

    const openEditUser = (user) => {
        setEditingItem(user);

        const fixedDesignationValue = getDesignationValue(user.designation);
        const customSavedDesignationValue = user.designation && !fixedDesignationValue
            ? `${CUSTOM_DESIGNATION_PREFIX}${String(user.designation).trim()}`
            : null;

        setUserForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            phone: user.phone || "",
            role: fixedDesignationValue || customSavedDesignationValue || user.role || "SUPERVISOR",
            customDesignation: "",
            siteId: user.siteId || user.site?.id || "",
            status: user.status || "ACTIVE",
        });

        setModalType("user");
    };

    const openAddSite = () => {
        setEditingItem(null);
        setSiteForm(EMPTY_SITE);
        setModalType("site");
    };

    const openEditSite = (site) => {
        setEditingItem(site);

        setSiteForm({
            name: site.name || "",
            siteCode: site.siteCode || "",
            clientName: site.clientName || "",
            clientPhone: site.clientPhone || "",
            clientEmail: site.clientEmail || "",
            address: site.address || "",
            city: site.city || "",
            state: site.state || "",
            pincode: site.pincode || "",
            latitude:
                site.latitude !== null && site.latitude !== undefined
                    ? String(site.latitude)
                    : "",
            longitude:
                site.longitude !== null && site.longitude !== undefined
                    ? String(site.longitude)
                    : "",
            status: site.status || "ACTIVE",
        });

        setModalType("site");
    };

    const handleUserSubmit = async (event) => {
        event.preventDefault();

        const selectedDesignation = getSelectedDesignation(userForm.role);
        const effectiveRole = getEffectiveRole(userForm.role);
        const designation = selectedDesignation?.label || null;

        if (userForm.role === OTHER_DESIGNATION_VALUE && !designation) {
            showError("Please enter the custom designation name.");
            return;
        }

        if (designation && designation.length > 80) {
            showError("Designation must be 80 characters or fewer.");
            return;
        }

        if (designation && /[\u0000-\u001F\u007F]/.test(designation)) {
            showError("Designation cannot contain line breaks or control characters.");
            return;
        }

        if (!userForm.name.trim()) {
            showError("User name is required.");
            return;
        }

        if (!userForm.email.trim()) {
            showError("Email is required.");
            return;
        }

        // Password is required only for Supervisor and Super Admin.
        // Field Staff does not need a password.
        if (
            !editingItem &&
            effectiveRole !== "FIELD_STAFF" &&
            !userForm.password.trim()
        ) {
            showError("Password is required for login-enabled roles and admin designations.");
            return;
        }

        if (
            !editingItem &&
            effectiveRole !== "FIELD_STAFF" &&
            userForm.password.trim().length < 6
        ) {
            showError("Password must be at least 6 characters.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                name: userForm.name.trim(),
                email: userForm.email.trim(),
                phone: userForm.phone.trim() || null,
                // Designations are stored separately; the actual access role
                // remains SUPER_ADMIN for each new admin-designation account.
                role: effectiveRole,
                designation,
                // Super Admin and admin-designation users have no site assignment.
                siteId:
                    effectiveRole === "SUPER_ADMIN"
                        ? null
                        : userForm.siteId || null,
            };

            if (editingItem) {
                payload.status = userForm.status;

                await request(`/users/${editingItem.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });

                showSuccess("User updated successfully.");
            } else {
                // Only login-capable roles receive a password from the UI.
                if (effectiveRole !== "FIELD_STAFF") {
                    payload.password = userForm.password;
                }

                await request("/users", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                showSuccess("User created successfully.");
            }

            await loadUsers();
            closeModal();
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSiteSubmit = async (event) => {
        event.preventDefault();

        if (!siteForm.name.trim()) {
            showError("Site name is required.");
            return;
        }

        if (!siteForm.siteCode.trim()) {
            showError("Site code is required.");
            return;
        }

        const latitude =
            siteForm.latitude.trim() === ""
                ? null
                : Number(siteForm.latitude);

        const longitude =
            siteForm.longitude.trim() === ""
                ? null
                : Number(siteForm.longitude);

        if (
            latitude !== null &&
            (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
        ) {
            showError("Latitude must be between -90 and 90.");
            return;
        }

        if (
            longitude !== null &&
            (Number.isNaN(longitude) ||
                longitude < -180 ||
                longitude > 180)
        ) {
            showError("Longitude must be between -180 and 180.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                name: siteForm.name.trim(),
                siteCode: siteForm.siteCode.trim().toUpperCase(),
                clientName: siteForm.clientName.trim() || null,
                clientPhone: siteForm.clientPhone.trim() || null,
                clientEmail: siteForm.clientEmail.trim() || null,
                address: siteForm.address.trim() || null,
                city: siteForm.city.trim() || null,
                state: siteForm.state.trim() || null,
                pincode: siteForm.pincode.trim() || null,
                latitude,
                longitude,
            };

            if (editingItem) {
                payload.status = siteForm.status;

                await request(`/sites/${editingItem.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });

                showSuccess("Site updated successfully.");
            } else {
                await request("/sites", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                showSuccess("Site created successfully.");
            }

            await loadSites();
            await loadUsers();

            closeModal();
        } catch (err) {
            showError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // EXCEL EXPORT
    // =========================================================

    const exportCurrentData = () => {
        try {
            setError("");

            const workbook = XLSX.utils.book_new();

            if (activeTab === "users") {
                const rows = filteredData.map((user) => ({
                    Name: user.name || "",
                    Email: user.email || "",
                    Phone: user.phone || "",
                    Role: roleLabel(user.role, user.designation),
                    Site: user.site?.name || "Not assigned",
                    SiteCode: user.site?.siteCode || "",
                    City: user.site?.city || "",
                    State: user.site?.state || "",
                    Status: user.status || "",
                    Created: formatDate(user.createdAt),
                }));

                const worksheet = XLSX.utils.json_to_sheet(
                    rows.length
                        ? rows
                        : [{
                            Name: "",
                            Email: "",
                            Phone: "",
                            Role: "",
                            Site: "",
                            SiteCode: "",
                            City: "",
                            State: "",
                            Status: "",
                            Created: "",
                        }]
                );

                worksheet["!cols"] = [
                    { wch: 24 },
                    { wch: 34 },
                    { wch: 16 },
                    { wch: 18 },
                    { wch: 28 },
                    { wch: 16 },
                    { wch: 18 },
                    { wch: 20 },
                    { wch: 14 },
                    { wch: 18 },
                ];

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "Users"
                );

                XLSX.writeFile(
                    workbook,
                    "users.xlsx"
                );

                showSuccess(
                    rows.length
                        ? `${rows.length} user(s) exported to Excel.`
                        : "No users found. Empty Excel file downloaded."
                );

                return;
            }

            const rows = filteredData.map((site) => ({
                Name: site.name || "",
                SiteCode: site.siteCode || "",
                ClientName: site.clientName || "",
                ClientMobile: site.clientPhone || "",
                ClientEmail: site.clientEmail || "",
                Address: site.address || "",
                City: site.city || "",
                State: site.state || "",
                Pincode: site.pincode || "",
                Latitude: site.latitude ?? "",
                Longitude: site.longitude ?? "",
                Status: site.status || "",
                Created: formatDate(site.createdAt),
            }));

            const worksheet = XLSX.utils.json_to_sheet(
                rows.length
                    ? rows
                    : [{
                        Name: "",
                        SiteCode: "",
                        ClientName: "",
                        ClientMobile: "",
                        ClientEmail: "",
                        Address: "",
                        City: "",
                        State: "",
                        Pincode: "",
                        Latitude: "",
                        Longitude: "",
                        Status: "",
                        Created: "",
                    }]
            );

            worksheet["!cols"] = [
                { wch: 28 },
                { wch: 16 },
                { wch: 24 },
                { wch: 18 },
                { wch: 32 },
                { wch: 42 },
                { wch: 20 },
                { wch: 20 },
                { wch: 12 },
                { wch: 14 },
                { wch: 14 },
                { wch: 18 },
            ];

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Sites"
            );

            XLSX.writeFile(
                workbook,
                "sites.xlsx"
            );

            showSuccess(
                rows.length
                    ? `${rows.length} site(s) exported to Excel.`
                    : "No sites found. Empty Excel file downloaded."
            );
        } catch (err) {
            console.error("Excel export error:", err);
            showError(
                err?.message ||
                "Excel export failed. Please make sure the xlsx package is installed."
            );
        }
    };

    const printCurrent = () => {
        window.print();
    };

    const exportPdf = () => {
        window.print();
    };

    const renderPaginationButtons = () => {
        const buttons = [];

        const maxButtons = 5;

        let start = Math.max(1, safePage - 2);
        let end = Math.min(totalPages, start + maxButtons - 1);

        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }

        for (let index = start; index <= end; index += 1) {
            buttons.push(
                <button
                    key={index}
                    type="button"
                    className={safePage === index ? "active" : ""}
                    onClick={() => setPage(index)}
                >
                    {index}
                </button>
            );
        }

        return buttons;
    };

    return (
        <div className="settings-page">
            <div className="settings-card">
                <div className="settings-tabs">
                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "users" ? "active" : ""
                            }`}
                        onClick={() => setActiveTab("users")}
                    >
                        <Users size={16} />
                        Users
                    </button>

                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "sites" ? "active" : ""
                            }`}
                        onClick={() => setActiveTab("sites")}
                    >
                        <Building2 size={16} />
                        Sites
                    </button>
                </div>

                {error && (
                    <div className="settings-message error">
                        {error}
                        <button
                            type="button"
                            onClick={() => setError("")}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="settings-message success">
                        {success}
                    </div>
                )}

                <div className="settings-add-row">
                    <button
                        type="button"
                        className="settings-add-button"
                        onClick={
                            activeTab === "users"
                                ? openAddUser
                                : openAddSite
                        }
                    >
                        <Plus size={17} />
                        {activeTab === "users"
                            ? "Add User"
                            : "Add Site"}
                    </button>
                </div>

                <div className="settings-search-area">
                    <div className="settings-search-group">
                        <div className="settings-search-input">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                onKeyDown={handleSearchKeyDown}
                                placeholder={
                                    activeTab === "users"
                                        ? "Search user..."
                                        : "Search site..."
                                }
                            />
                        </div>

                        <button
                            type="button"
                            className="settings-search-button"
                            onClick={handleSearch}
                        >
                            <Search size={15} />
                            Search
                        </button>

                        <button
                            type="button"
                            className="settings-clear-button"
                            onClick={resetSearch}
                        >
                            Clear
                        </button>
                    </div>

                    <select
                        className="settings-filter-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                <div className="settings-toolbar">
                    <div className="settings-result-count">
                        Showing <strong>{firstEntry}</strong> to{" "}
                        <strong>{lastEntry}</strong> of{" "}
                        <strong>{filteredData.length}</strong>{" "}
                        {activeTab}
                    </div>

                    <div className="settings-export-buttons">
                        <button
                            type="button"
                            title="Export Excel"
                            onClick={exportCurrentData}
                        >
                            <FileSpreadsheet size={17} />
                        </button>

                        <button
                            type="button"
                            title="Print / Save as PDF"
                            onClick={exportPdf}
                        >
                            <FileText size={17} />
                        </button>

                        <button
                            type="button"
                            title="Print"
                            onClick={printCurrent}
                        >
                            <Printer size={17} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="settings-loading">
                        Loading settings data...
                    </div>
                ) : activeTab === "users" ? (
                    <div className="settings-table-wrapper">
                        <table className="settings-table users-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>EMAIL</th>
                                    <th>PHONE</th>
                                    <th>ROLE</th>
                                    <th>SITE</th>
                                    <th>CITY</th>
                                    <th>STATUS</th>
                                    <th>CREATED</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="settings-empty"
                                        >
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="settings-name">
                                                    {user.name}
                                                </div>
                                            </td>

                                            <td>{user.email}</td>

                                            <td>
                                                {user.phone || "-"}
                                            </td>

                                            <td>
                                                {roleLabel(user.role, user.designation)}
                                            </td>

                                            <td>
                                                {user.site?.name || (
                                                    <span className="settings-muted">
                                                        Not assigned
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {user.site?.city || "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`settings-status ${user.status ===
                                                        "ACTIVE"
                                                        ? "active"
                                                        : "inactive"
                                                        }`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    user.createdAt
                                                )}
                                            </td>

                                            <td>
                                                <div className="settings-row-actions">
                                                    <button
                                                        type="button"
                                                        className="settings-action-button"
                                                        title="Edit user"
                                                        onClick={() =>
                                                            openEditUser(
                                                                user
                                                            )
                                                        }
                                                    >
                                                        <Edit3
                                                            size={15}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="settings-table-wrapper">
                        <table className="settings-table sites-table">
                            <thead>
                                <tr>
                                    <th>SITE NAME</th>
                                    <th>SITE CODE</th>
                                    <th>CLIENT NAME</th>
                                    <th>CLIENT MOBILE</th>
                                    <th>CLIENT EMAIL</th>
                                    <th>ADDRESS</th>
                                    <th>CITY</th>
                                    <th>STATE</th>
                                    <th>PINCODE</th>
                                    <th>STATUS</th>
                                    <th>CREATED</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="12"
                                            className="settings-empty"
                                        >
                                            No sites found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((site) => (
                                        <tr key={site.id}>
                                            <td>
                                                <div className="settings-name">
                                                    {site.name}
                                                </div>
                                            </td>

                                            <td>{site.siteCode}</td>

                                            <td>{site.clientName || "-"}</td>

                                            <td>{site.clientPhone || "-"}</td>

                                            <td>{site.clientEmail || "-"}</td>

                                            <td className="site-address">
                                                {site.address || "-"}
                                            </td>

                                            <td>{site.city || "-"}</td>

                                            <td>{site.state || "-"}</td>

                                            <td>{site.pincode || "-"}</td>

                                            <td>
                                                <span
                                                    className={`settings-status ${site.status ===
                                                        "ACTIVE"
                                                        ? "active"
                                                        : "inactive"
                                                        }`}
                                                >
                                                    {site.status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    site.createdAt
                                                )}
                                            </td>

                                            <td>
                                                <div className="settings-row-actions">
                                                    <button
                                                        type="button"
                                                        className="settings-action-button"
                                                        title="Edit site"
                                                        onClick={() =>
                                                            openEditSite(
                                                                site
                                                            )
                                                        }
                                                    >
                                                        <Edit3
                                                            size={15}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="settings-footer">
                    <div className="settings-footer-left">
                        Showing <strong>{firstEntry}</strong> to{" "}
                        <strong>{lastEntry}</strong> of{" "}
                        <strong>{filteredData.length}</strong>
                    </div>

                    <div className="settings-show-entries">
                        <span>Show</span>

                        <select
                            value={pageSize}
                            onChange={(event) =>
                                setPageSize(
                                    Number(event.target.value)
                                )
                            }
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>

                        <span>entries</span>
                    </div>

                    <div className="settings-pagination">
                        <button
                            type="button"
                            disabled={safePage === 1}
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(1, current - 1)
                                )
                            }
                        >
                            <ChevronLeft size={15} />
                        </button>

                        {renderPaginationButtons()}

                        <button
                            type="button"
                            disabled={safePage === totalPages}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(
                                        totalPages,
                                        current + 1
                                    )
                                )
                            }
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {modalType === "user" && (
                <div className="settings-modal-backdrop">
                    <div className="settings-modal">
                        <div className="settings-modal-header">
                            <div>
                                <h3>
                                    {editingItem
                                        ? "Edit User"
                                        : "Add User"}
                                </h3>

                                <p>
                                    Manage user account and site
                                    assignment.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="settings-modal-close"
                                onClick={closeModal}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit}>
                            <div className="settings-form-grid">
                                <div className="settings-form-field">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={userForm.name}
                                        onChange={(event) =>
                                            setUserForm({
                                                ...userForm,
                                                name: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(event) =>
                                            setUserForm({
                                                ...userForm,
                                                email: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={userForm.phone}
                                        onChange={(event) =>
                                            setUserForm({
                                                ...userForm,
                                                phone: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                {(!editingItem ||
                                    userForm.role !==
                                    "FIELD_STAFF") && (
                                        <div className="settings-form-field">
                                            <label>
                                                Password
                                                {!editingItem &&
                                                    userForm.role !==
                                                    "FIELD_STAFF"
                                                    ? " *"
                                                    : ""}
                                            </label>
                                            {!editingItem ? (
                                                <input
                                                    type="password"
                                                    value={
                                                        userForm.password
                                                    }
                                                    onChange={(event) =>
                                                        setUserForm({
                                                            ...userForm,
                                                            password:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    }
                                                    placeholder="Minimum 6 characters"
                                                />
                                            ) : (
                                                <input
                                                    type="password"
                                                    value=""
                                                    disabled
                                                    placeholder="Use reset password to change"
                                                />
                                            )}
                                        </div>
                                    )}

                                <div className="settings-form-field">
                                    <label>Role / Designation *</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(event) => {
                                            const nextRole = event.target.value;

                                            setUserForm((current) => ({
                                                ...current,
                                                role: nextRole,
                                                customDesignation:
                                                    nextRole === OTHER_DESIGNATION_VALUE
                                                        ? current.customDesignation
                                                        : "",
                                                // Admin designations use the existing Super Admin
                                                // access role and are not assigned to a site.
                                                siteId:
                                                    getEffectiveRole(nextRole) === "SUPER_ADMIN"
                                                        ? ""
                                                        : current.siteId,
                                                password:
                                                    nextRole === "FIELD_STAFF"
                                                        ? ""
                                                        : current.password,
                                            }));
                                        }}
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                        {ADMIN_DESIGNATION_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                        {customDesignationOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value={OTHER_DESIGNATION_VALUE}>Other</option>
                                    </select>
                                </div>

                                {userForm.role === OTHER_DESIGNATION_VALUE && (
                                    <div className="settings-form-field">
                                        <label>Enter designation name *</label>
                                        <input
                                            type="text"
                                            value={userForm.customDesignation}
                                            maxLength={80}
                                            onChange={(event) =>
                                                setUserForm((current) => ({
                                                    ...current,
                                                    customDesignation: event.target.value,
                                                }))
                                            }
                                            placeholder="Enter designation name"
                                            required
                                        />
                                        <small className="settings-muted">
                                            This designation will be saved and available in this list for future users.
                                        </small>
                                    </div>
                                )}

                                {getEffectiveRole(userForm.role) !== "SUPER_ADMIN" && (
                                    <div className="settings-form-field">
                                        <label>Site (Optional)</label>
                                        <select
                                            value={userForm.siteId}
                                            onChange={(event) =>
                                                setUserForm({
                                                    ...userForm,
                                                    siteId:
                                                        event.target
                                                            .value,
                                                })
                                            }
                                        >
                                            <option value="">
                                                {activeSites.length
                                                    ? "Select Site"
                                                    : "No active sites found"}
                                            </option>

                                            {activeSites.map(
                                                (site) => (
                                                    <option
                                                        key={
                                                            site.id
                                                        }
                                                        value={
                                                            site.id
                                                        }
                                                    >
                                                        {site.name} (
                                                        {
                                                            site.siteCode
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                )}

                                {editingItem && (
                                    <div className="settings-form-field">
                                        <label>Status</label>
                                        <select
                                            value={
                                                userForm.status
                                            }
                                            onChange={(event) =>
                                                setUserForm({
                                                    ...userForm,
                                                    status:
                                                        event.target
                                                            .value,
                                                })
                                            }
                                        >
                                            <option value="ACTIVE">
                                                Active
                                            </option>
                                            <option value="INACTIVE">
                                                Inactive
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="settings-modal-footer">
                                <button
                                    type="button"
                                    className="settings-secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="settings-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update User"
                                            : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalType === "site" && (
                <div className="settings-modal-backdrop">
                    <div className="settings-modal">
                        <div className="settings-modal-header">
                            <div>
                                <h3>
                                    {editingItem
                                        ? "Edit Site"
                                        : "Add Site"}
                                </h3>

                                <p>
                                    Manage site details and
                                    activation status.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="settings-modal-close"
                                onClick={closeModal}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSiteSubmit}>
                            <div className="settings-form-grid">
                                <div className="settings-form-field">
                                    <label>Site Name *</label>
                                    <input
                                        type="text"
                                        value={siteForm.name}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                name: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Site Code *</label>
                                    <input
                                        type="text"
                                        value={siteForm.siteCode}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                siteCode:
                                                    event.target.value.toUpperCase(),
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Client Name</label>
                                    <input
                                        type="text"
                                        value={siteForm.clientName}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                clientName: event.target.value,
                                            })
                                        }
                                        placeholder="Client / company name"
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Client Mobile</label>
                                    <input
                                        type="tel"
                                        value={siteForm.clientPhone}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                clientPhone: event.target.value,
                                            })
                                        }
                                        placeholder="Client mobile number"
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Client Email</label>
                                    <input
                                        type="email"
                                        value={siteForm.clientEmail}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                clientEmail: event.target.value,
                                            })
                                        }
                                        placeholder="client@example.com"
                                    />
                                </div>

                                <div className="settings-form-field full">
                                    <label>Address</label>
                                    <textarea
                                        value={siteForm.address}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                address:
                                                    event.target.value,
                                            })
                                        }
                                        rows="3"
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        value={siteForm.city}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                city: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        value={siteForm.state}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                state:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        value={siteForm.pincode}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                pincode:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={siteForm.latitude}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                latitude:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="settings-form-field">
                                    <label>Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={siteForm.longitude}
                                        onChange={(event) =>
                                            setSiteForm({
                                                ...siteForm,
                                                longitude:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                {editingItem && (
                                    <div className="settings-form-field">
                                        <label>Status</label>
                                        <select
                                            value={
                                                siteForm.status
                                            }
                                            onChange={(event) =>
                                                setSiteForm({
                                                    ...siteForm,
                                                    status:
                                                        event.target
                                                            .value,
                                                })
                                            }
                                        >
                                            <option value="ACTIVE">
                                                Active
                                            </option>
                                            <option value="INACTIVE">
                                                Inactive
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="settings-modal-footer">
                                <button
                                    type="button"
                                    className="settings-secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="settings-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Site"
                                            : "Create Site"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
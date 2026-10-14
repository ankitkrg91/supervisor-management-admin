import { useEffect, useState } from "react";

import {

    Plus,

    X,

    CalendarDays,

    CheckCircle,

    AlertCircle,

    Search,

    MapPin,

    User,

} from "lucide-react";

import {

    MapContainer,

    TileLayer,

    Marker,

    Popup,

} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import { apiFetch } from "../../utils/api";

import "./ScheduleTask.css";

const defaultPosition = [31.634, 74.8723];

const markerIcon = new L.Icon({

    iconUrl:

        "https\://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:

        "https\://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:

        "https\://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],

    iconAnchor: [12, 41],

    popupAnchor: [1, -34],

    shadowSize: [41, 41],

});

const ScheduleTask = () => {

    const [client, setClient] =

        useState("");

    const [clientPhone, setClientPhone] =

        useState("");

    const [clientEmail, setClientEmail] =

        useState("");

    const [site, setSite] =

        useState("");

    const [selectedSite, setSelectedSite] =

        useState(null);

    const [address, setAddress] =

        useState("");

    const [taskCategory, setTaskCategory] =

        useState("");

    const [taskType, setTaskType] =

        useState("");

    const [task, setTask] =

        useState("");

    const [priority, setPriority] =

        useState("MEDIUM");

    const [wholeDay, setWholeDay] =

        useState(true);

    const [scheduleFrom, setScheduleFrom] =

        useState(

            new Date()

                .toISOString()

                .split("T")[0]

        );

    const [scheduleTill, setScheduleTill] =

        useState(

            new Date()

                .toISOString()

                .split("T")[0]

        );

    const [showInAdvance, setShowInAdvance] =

        useState(true);

    const [showAfterMissed, setShowAfterMissed] =

        useState(true);

    const [assignedTo, setAssignedTo] =

        useState("");

    const [selectedSupervisor, setSelectedSupervisor] =

        useState(null);

    const [remark, setRemark] =

        useState("");

    const [sites, setSites] =

        useState([]);

    const [supervisors, setSupervisors] =

        useState([]);

    const [loadingSites, setLoadingSites] =

        useState(false);

    const [loadingSupervisors, setLoadingSupervisors] =

        useState(false);

    const [showSiteSelector, setShowSiteSelector] =

        useState(false);

    const [siteSearch, setSiteSearch] =

        useState("");

    const [showAddSiteModal, setShowAddSiteModal] =

        useState(false);

    const [newSiteCode, setNewSiteCode] =

        useState("");

    const [newSiteName, setNewSiteName] =

        useState("");

    const [newSiteAddress, setNewSiteAddress] =

        useState("");

    const [newSiteCity, setNewSiteCity] =

        useState("");

    const [newSiteState, setNewSiteState] =

        useState("");

    const [newSitePincode, setNewSitePincode] =

        useState("");

    const [newSiteLatitude, setNewSiteLatitude] =

        useState("");

    const [newSiteLongitude, setNewSiteLongitude] =

        useState("");

    const [addingSite, setAddingSite] =

        useState(false);

    const [showSupervisorSelector, setShowSupervisorSelector] =

        useState(false);

    const [supervisorSearch, setSupervisorSearch] =

        useState("");

    const [showAddUserModal, setShowAddUserModal] =

        useState(false);

    const [newUserName, setNewUserName] =

        useState("");

    const [newUserEmail, setNewUserEmail] =

        useState("");

    const [newUserPhone, setNewUserPhone] =

        useState("");

    const [newUserPassword, setNewUserPassword] =

        useState("");

    const [addingUser, setAddingUser] =

        useState(false);

    const [newUserSiteId, setNewUserSiteId] =

        useState("");

    const [userModalMessage, setUserModalMessage] =

        useState("");

    const [userModalMessageType, setUserModalMessageType] =

        useState("");

    const [loading, setLoading] =

        useState(false);

    const [message, setMessage] =

        useState("");

    const [messageType, setMessageType] =

        useState("");

    const fetchSites = async () => {

        try {

            setLoadingSites(true);

            const response =

                await apiFetch(

                    "/api/sites?status=ACTIVE"

                );

            const data =

                await response.json();

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    "Failed to load sites"

                );

            }

            const siteList =

                data?.data?.sites ||

                data?.sites ||

                [];

            setSites(siteList);

        } catch (error) {

            console.error(

                "Failed to load sites:",

                error

            );

            setMessage(

                error?.message ||

                "Failed to load sites"

            );

            setMessageType("error");

        } finally {

            setLoadingSites(false);

        }

    };

    const fetchSupervisors = async () => {

        try {

            setLoadingSupervisors(true);

            const response = await apiFetch(

                "/api/users?status=ACTIVE&role=SUPERVISOR"

            );

            const contentType =

                response.headers.get("content-type") || "";

            const data = contentType.includes("application/json")

                ? await response.json()

                : {};

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    data?.error ||

                    `Failed to load supervisors (${response.status})`

                );

            }

            const users =

                data?.data?.users ||

                data?.data?.items ||

                data?.data ||

                data?.users ||

                data?.items ||

                [];

            const activeSupervisors = Array.isArray(users)

                ? users.filter(

                    (user) =>

                        String(user?.role || "").toUpperCase() === "SUPERVISOR" &&

                        String(user?.status || "").toUpperCase() === "ACTIVE"

                )

                : [];

            console.log(

                "ScheduleTask - active supervisors:",

                activeSupervisors

            );

            setSupervisors(activeSupervisors);

        } catch (error) {

            console.error(

                "Failed to load supervisors:",

                error

            );

            setSupervisors([]);

            setMessage(

                error?.message ||

                "Failed to load supervisors"

            );

            setMessageType("error");

        } finally {

            setLoadingSupervisors(false);

        }

    };

    useEffect(() => {

        fetchSites();

        fetchSupervisors();

    }, []);

    const handleSelectSite = (siteItem) => {

        setSelectedSite(siteItem);

        setSite(siteItem.id);

        setAddress(

            siteItem.address || ""

        );

        setShowSiteSelector(false);

        setSiteSearch("");

        setMessage("");

        setMessageType("");

    };

    const handleClearSite = () => {

        setSelectedSite(null);

        setSite("");

        setAddress("");

        setSelectedSupervisor(null);

        setAssignedTo("");

    };

    const handleAddSite = () => {

        setShowSiteSelector(false);

        setNewSiteCode("");

        setNewSiteName("");

        setNewSiteAddress("");

        setNewSiteCity("");

        setNewSiteState("");

        setNewSitePincode("");

        setNewSiteLatitude("");

        setNewSiteLongitude("");

        setMessage("");

        setMessageType("");

        setShowAddSiteModal(true);

    };

    const handleCreateSite = async (e) => {

        e.preventDefault();

        setMessage("");

        setMessageType("");

        if (!newSiteCode.trim()) {

            setMessage(

                "Please enter Site ID / Code."

            );

            setMessageType("error");

            return;

        }

        if (!newSiteName.trim()) {

            setMessage(

                "Please enter Site Name."

            );

            setMessageType("error");

            return;

        }

        const latitudeValue =

            newSiteLatitude.trim() === ""

                ? null

                : Number(

                    newSiteLatitude

                );

        const longitudeValue =

            newSiteLongitude.trim() === ""

                ? null

                : Number(

                    newSiteLongitude

                );

        if (

            latitudeValue !== null &&

            Number.isNaN(latitudeValue)

        ) {

            setMessage(

                "Latitude must be a valid number."

            );

            setMessageType("error");

            return;

        }

        if (

            longitudeValue !== null &&

            Number.isNaN(longitudeValue)

        ) {

            setMessage(

                "Longitude must be a valid number."

            );

            setMessageType("error");

            return;

        }

        try {

            setAddingSite(true);

            const payload = {

                name:

                    newSiteName.trim(),

                siteCode:

                    newSiteCode

                        .trim()

                        .toUpperCase(),

                address:

                    newSiteAddress.trim() ||

                    undefined,

                city:

                    newSiteCity.trim() ||

                    undefined,

                state:

                    newSiteState.trim() ||

                    undefined,

                pincode:

                    newSitePincode.trim() ||

                    undefined,

                latitude:

                    latitudeValue,

                longitude:

                    longitudeValue,

            };

            const response =

                await apiFetch(

                    "/api/sites",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":

                                "application/json",

                        },

                        body:

                            JSON.stringify(

                                payload

                            ),

                    }

                );

            const data =

                await response.json();

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    "Failed to create site"

                );

            }

            const createdSite =

                data?.data?.site ||

                data?.site;

            if (createdSite) {

                setSites(

                    (current) => {

                        const alreadyExists =

                            current.some(

                                (item) =>

                                    item.id ===

                                    createdSite.id

                            );

                        if (

                            alreadyExists

                        ) {

                            return current;

                        }

                        return [

                            createdSite,

                            ...current,

                        ];

                    }

                );

                setSelectedSite(

                    createdSite

                );

                setSite(

                    createdSite.id

                );

                setAddress(

                    createdSite.address ||

                    newSiteAddress.trim()

                );

            } else {

                await fetchSites();

            }

            setShowAddSiteModal(false);

            setMessage(

                "Site added successfully."

            );

            setMessageType("success");

        } catch (error) {

            console.error(

                "Create site error:",

                error

            );

            setMessage(

                error?.message ||

                "Failed to create site"

            );

            setMessageType("error");

        } finally {

            setAddingSite(false);

        }

    };

    const handleOpenSupervisorSelector = async () => {

        setSupervisorSearch("");

        setShowAddUserModal(false);

        setShowSupervisorSelector(true);

        setMessage("");

        setMessageType("");

        await fetchSupervisors();

    };

    const handleSelectSupervisor = (user) => {

        setSelectedSupervisor(user);

        setAssignedTo(user.id);

        setShowSupervisorSelector(false);

        setSupervisorSearch("");

        setMessage("");

        setMessageType("");

    };

    const handleClearSupervisor = () => {

        setSelectedSupervisor(null);

        setAssignedTo("");

    };

    const handleAddNonSystemUsers = (event) => {

        event?.preventDefault();

        event?.stopPropagation();

        setNewUserName("");

        setNewUserEmail("");

        setNewUserPhone("");

        setNewUserPassword("");

        setNewUserSiteId(selectedSite?.id || "");

        setUserModalMessage("");

        setUserModalMessageType("");

        setShowSupervisorSelector(false);

        setShowAddUserModal(true);

    };

    const handleCreateNonSystemUser = async (e) => {

        e.preventDefault();

        e.stopPropagation();

        setUserModalMessage("");

        setUserModalMessageType("");

        const selectedUserSite =

            sites.find((item) => item.id === newUserSiteId) ||

            selectedSite ||

            null;

        if (!selectedUserSite?.id) {

            setUserModalMessage("Please select a site.");

            setUserModalMessageType("error");

            return;

        }

        if (!newUserName.trim()) {

            setUserModalMessage("Please enter user name.");

            setUserModalMessageType("error");

            return;

        }

        if (!newUserEmail.trim()) {

            setUserModalMessage("Please enter email.");

            setUserModalMessageType("error");

            return;

        }

        if (!newUserPassword.trim()) {

            setUserModalMessage("Please enter a temporary password.");

            setUserModalMessageType("error");

            return;

        }

        if (newUserPassword.length < 6) {

            setUserModalMessage("Password must be at least 6 characters.");

            setUserModalMessageType("error");

            return;

        }

        try {

            setAddingUser(true);

            const payload = {

                name: newUserName.trim(),

                email: newUserEmail.trim().toLowerCase(),

                password: newUserPassword,

                phone: newUserPhone.trim() || undefined,

                role: "SUPERVISOR",

                siteId: selectedUserSite.id,

            };

            const response = await apiFetch(

                "/api/users",

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json",

                    },

                    body: JSON.stringify(payload),

                }

            );

            const contentType =

                response.headers.get("content-type") || "";

            const data = contentType.includes("application/json")

                ? await response.json()

                : { message: await response.text() };

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    data?.error ||

                    `Failed to create Supervisor user (${response.status})`

                );

            }

            const createdUser =

                data?.data?.user ||

                data?.user ||

                null;

            const userForUi = createdUser?.id

                ? {

                    ...createdUser,

                    role: createdUser.role || "SUPERVISOR",

                    status: createdUser.status || "ACTIVE",

                    siteId: createdUser.siteId || selectedUserSite.id,

                    site: createdUser.site || {

                        id: selectedUserSite.id,

                        name: selectedUserSite.name,

                        siteCode: selectedUserSite.siteCode,

                    },

                }

                : null;

            await fetchSupervisors();

            if (userForUi) {

                setSupervisors((current) => [

                    userForUi,

                    ...current.filter(

                        (user) => user.id !== userForUi.id

                    ),

                ]);

                setSelectedSupervisor(userForUi);

                setAssignedTo(userForUi.id);

            } else {

                const refreshedResponse = await apiFetch(

                    "/api/users"

                );

                const refreshedContentType =

                    refreshedResponse.headers.get("content-type") || "";

                const refreshedData = refreshedContentType.includes("application/json")

                    ? await refreshedResponse.json()

                    : { data: {} };

                const refreshedUsers =

                    refreshedData?.data?.users ||

                    refreshedData?.users ||

                    [];

                const matchingUser = refreshedUsers.find(

                    (user) =>

                        user?.email?.toLowerCase() ===

                        newUserEmail.trim().toLowerCase()

                );

                if (matchingUser?.id) {

                    setSelectedSupervisor(matchingUser);

                    setAssignedTo(matchingUser.id);

                }

            }

            setSelectedSite(selectedUserSite);

            setSite(selectedUserSite.id);

            setAddress(selectedUserSite.address || "");

            setShowAddUserModal(false);

            setUserModalMessage(

                "Supervisor user added successfully."

            );

            setUserModalMessageType("success");

            setMessage(

                "Supervisor user added successfully."

            );

            setMessageType("success");

        } catch (error) {

            console.error(

                "Create Supervisor user error:",

                error

            );

            setUserModalMessage(

                error?.message ||

                "Failed to create Supervisor user"

            );

            setUserModalMessageType("error");

        } finally {

            setAddingUser(false);

        }

    };

    const buildTaskTitle = () => {

        if (task.trim()) {

            return task.trim();

        }

        if (taskType.trim()) {

            return taskType.trim();

        }

        if (taskCategory.trim()) {

            return taskCategory.trim();

        }

        return "";

    };

    const buildDescription = () => {

        const parts = [];

        if (client.trim()) {

            parts.push(

                `Client: ${client.trim()}`

            );

        }

        if (clientPhone.trim()) {

            parts.push(

                `Client Mobile: ${clientPhone.trim()}`

            );

        }

        if (clientEmail.trim()) {

            parts.push(

                `Client Email: ${clientEmail.trim()}`

            );

        }

        if (address.trim()) {

            parts.push(

                `Address: ${address.trim()}`

            );

        }

        if (selectedSite) {

            parts.push(

                `Site: ${selectedSite.siteCode} - ${selectedSite.name}`

            );

        }

        if (taskCategory.trim()) {

            parts.push(

                `Category: ${taskCategory.trim()}`

            );

        }

        if (taskType.trim()) {

            parts.push(

                `Type: ${taskType.trim()}`

            );

        }

        if (remark.trim()) {

            parts.push(

                `Remark: ${remark.trim()}`

            );

        }

        if (wholeDay) {

            parts.push(

                "Scheduled for whole day."

            );

        }

        if (

            scheduleFrom &&

            scheduleTill &&

            scheduleFrom !==

            scheduleTill

        ) {

            parts.push(

                `Schedule range: ${scheduleFrom} to ${scheduleTill}`

            );

        }

        return parts.join("\n");

    };

    const handleSchedule = async (

        e

    ) => {

        e.preventDefault();

        setMessage("");

        setMessageType("");

        const title =

            buildTaskTitle();

        const normalizedClientEmail =

            clientEmail.trim();

        if (normalizedClientEmail) {

            const emailRegex =

                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(normalizedClientEmail)) {

                setMessage(

                    "Please enter a valid Client Email."

                );

                setMessageType("error");

                return;

            }

        }

        if (!title) {

            setMessage(

                "Please select or enter a Task."

            );

            setMessageType("error");

            return;

        }

        if (

            !selectedSite ||

            !site

        ) {

            setMessage(

                "Please select a Site."

            );

            setMessageType("error");

            return;

        }

        if (

            !selectedSupervisor ||

            !assignedTo

        ) {

            setMessage(

                "Please select Supervisor in Assigned To."

            );

            setMessageType("error");

            return;

        }

        if (!scheduleFrom) {

            setMessage(

                "Please select Schedule From."

            );

            setMessageType("error");

            return;

        }

        if (!scheduleTill) {

            setMessage(

                "Please select Schedule Till."

            );

            setMessageType("error");

            return;

        }

        if (

            new Date(

                scheduleTill

            ) <

            new Date(

                scheduleFrom

            )

        ) {

            setMessage(

                "Schedule Till cannot be before Schedule From."

            );

            setMessageType("error");

            return;

        }

        const scheduledAt =

            `${scheduleFrom}T09:00:00.000Z`;

        const payload = {

            title,

            description:

                buildDescription() || null,

            clientEmail:

                normalizedClientEmail || null,

            priority:

                priority === "HIGH"

                    ? "HIGH"

                    : priority === "LOW"

                        ? "LOW"

                        : "MEDIUM",

            scheduledAt,

            showInAdvance:

                Boolean(showInAdvance),

            showAfterMissed:

                Boolean(showAfterMissed),

            wholeDay:

                Boolean(wholeDay),

            assignedToId:

                assignedTo,

            siteId:

                site,

        };

        try {

            setLoading(true);

            const response =

                await apiFetch(

                    "/api/tasks",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":

                                "application/json",

                        },

                        body:

                            JSON.stringify(

                                payload

                            ),

                    }

                );

            const data =

                await response.json();

            if (!response.ok) {

                throw new Error(

                    data?.message ||

                    "Failed to schedule task"

                );

            }

            setMessage(

                "Task scheduled successfully."

            );

            setMessageType("success");

            setClient("");

            setClientPhone("");

            setClientEmail("");

            setTask("");

            setTaskCategory("");

            setTaskType("");

            setPriority("MEDIUM");

            setRemark("");

        } catch (error) {

            console.error(

                "Schedule task error:",

                error

            );

            setMessage(

                error?.message ||

                "Failed to schedule task"

            );

            setMessageType("error");

        } finally {

            setLoading(false);

        }

    };

    const filteredSites =

        sites.filter(

            (siteItem) => {

                const search =

                    siteSearch

                        .trim()

                        .toLowerCase();

                if (!search) {

                    return true;

                }

                return (

                    siteItem?.siteCode

                        ?.toLowerCase()

                        .includes(search) ||

                    siteItem?.name

                        ?.toLowerCase()

                        .includes(search) ||

                    siteItem?.city

                        ?.toLowerCase()

                        .includes(search) ||

                    siteItem?.state

                        ?.toLowerCase()

                        .includes(search)

                );

            }

        );

    const filteredSupervisors =

        supervisors.filter(

            (user) => {

                const search =

                    supervisorSearch

                        .trim()

                        .toLowerCase();

                if (!search) {

                    return true;

                }

                return (

                    user?.name

                        ?.toLowerCase()

                        .includes(search) ||

                    user?.email

                        ?.toLowerCase()

                        .includes(search) ||

                    user?.phone

                        ?.toLowerCase()

                        .includes(search)

                );

            }

        );

    const selectedLatitude =

        selectedSite?.latitude;

    const selectedLongitude =

        selectedSite?.longitude;

    const hasSelectedCoordinates =

        selectedLatitude !==

        null &&

        selectedLatitude !==

        undefined &&

        selectedLongitude !==

        null &&

        selectedLongitude !==

        undefined;

    const mapPosition =

        hasSelectedCoordinates

            ? [

                Number(

                    selectedLatitude

                ),

                Number(

                    selectedLongitude

                ),

            ]

            : defaultPosition;

    const overlayStyle = {

        position: "fixed",

        inset: 0,

        background:

            "rgba(0, 0, 0, 0.45)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 9999,

        padding: "20px",

    };

    const modalStyle = {

        width: "100%",

        maxWidth: "620px",

        maxHeight: "90vh",

        overflowY: "auto",

        background:

            "var(--card-bg, #ffffff)",

        borderRadius: "14px",

        boxShadow:

            "0 20px 60px rgba(0,0,0,0.25)",

        padding: "24px",

    };

    const modalHeaderStyle = {

        display: "flex",

        alignItems: "center",

        justifyContent:

            "space-between",

        marginBottom: "18px",

    };

    const modalTitleStyle = {

        margin: 0,

        fontSize: "20px",

        fontWeight: 700,

    };

    const modalCloseStyle = {

        border: "none",

        background:

            "transparent",

        cursor: "pointer",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "5px",

    };

    const modalInputStyle = {

        width: "100%",

        boxSizing: "border-box",

        padding: "11px 13px",

        border: "1px solid #d1d5db",

        borderRadius: "8px",

        fontSize: "14px",

        outline: "none",

        background:

            "var(--input-bg, #ffffff)",

        color:

            "var(--text-color, #111827)",

    };

    const modalLabelStyle = {

        display: "block",

        marginBottom: "7px",

        fontSize: "13px",

        fontWeight: 600,

    };

    const modalFieldStyle = {

        marginBottom: "14px",

    };

    const modalActionsStyle = {

        display: "flex",

        justifyContent:

            "flex-end",

        gap: "10px",

        marginTop: "20px",

    };

    const cancelButtonStyle = {

        border:

            "1px solid #d1d5db",

        background:

            "transparent",

        borderRadius: "8px",

        padding:

            "10px 18px",

        fontWeight: 600,

        cursor:

            "pointer",

    };

    const primaryButtonStyle = {

        border: "none",

        background:

            "#2563eb",

        color: "#ffffff",

        borderRadius: "8px",

        padding:

            "10px 18px",

        fontWeight: 600,

        cursor: "pointer",

    };

    return (

        <div className="schedule-task-page">

            <div className="schedule-task-card">

                { }

                <form

                    className="schedule-task-form"

                    onSubmit={

                        handleSchedule

                    }

                >

                    { }

                    {message && (

                        <div

                            style={{

                                display: "flex",

                                alignItems:

                                    "center",

                                gap: "8px",

                                padding:

                                    "12px 14px",

                                marginBottom:

                                    "15px",

                                borderRadius:

                                    "8px",

                                background:

                                    messageType ===

                                        "success"

                                        ? "rgba(22, 163, 74, 0.12)"

                                        : "rgba(220, 38, 38, 0.12)",

                                color:

                                    messageType ===

                                        "success"

                                        ? "#16a34a"

                                        : "#dc2626",

                                fontSize:

                                    "14px",

                            }}

                        >

                            {messageType ===

                                "success" ? (

                                <CheckCircle

                                    size={18}

                                />

                            ) : (

                                <AlertCircle

                                    size={18}

                                />

                            )}

                            <span>

                                {message}

                            </span>

                        </div>

                    )}

                    { }

                    <div className="schedule-field">

                        <label>

                            Client

                        </label>

                        <div className="schedule-input-with-action">

                            <input

                                type="text"

                                value={

                                    client

                                }

                                onChange={(

                                    e

                                ) =>

                                    setClient(

                                        e

                                            .target

                                            .value

                                    )

                                }

                                placeholder="Client name"

                            />

                            <button

                                type="button"

                                className="schedule-remove-button"

                                onClick={() =>

                                    setClient(

                                        ""

                                    )

                                }

                                title="Clear"

                            >

                                <X

                                    size={

                                        19

                                    }

                                />

                            </button>

                        </div>

                    </div>

                    { }

                    {/* CLIENT MOBILE */}
                    <div className="schedule-field">
                        <label>
                            Client Mobile
                        </label>
                        <div className="schedule-input-with-action">
                            <input
                                type="tel"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="Client mobile number (e.g. 9876543210)"
                            />
                            {clientPhone && (
                                <button
                                    type="button"
                                    className="schedule-remove-button"
                                    onClick={() => setClientPhone("")}
                                    title="Clear"
                                >
                                    <X size={19} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="schedule-field">

                        <label>

                            Client Email

                        </label>

                        <input

                            type="email"

                            value={

                                clientEmail

                            }

                            onChange={(

                                e

                            ) =>

                                setClientEmail(

                                    e.target.value

                                )

                            }

                            placeholder="Client email address"

                        />

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Site ID / Site Name

                        </label>

                        <div className="schedule-site-row">

                            <button

                                type="button"

                                className="schedule-site-select"

                                onClick={() =>

                                    setShowSiteSelector(

                                        true

                                    )

                                }

                                style={{

                                    flex: 1,

                                    minWidth: 0,

                                    textAlign:

                                        "left",

                                    padding:

                                        "11px 13px",

                                    border:

                                        "1px solid #d1d5db",

                                    borderRadius:

                                        "8px",

                                    background:

                                        "var(--input-bg, #ffffff)",

                                    color:

                                        selectedSite

                                            ? "inherit"

                                            : "#9ca3af",

                                    cursor:

                                        "pointer",

                                    fontSize:

                                        "14px",

                                    overflow:

                                        "hidden",

                                    textOverflow:

                                        "ellipsis",

                                    whiteSpace:

                                        "nowrap",

                                }}

                            >

                                {selectedSite

                                    ? `${selectedSite.siteCode} - ${selectedSite.name}`

                                    : "Select Site..."}

                            </button>

                            <button

                                type="button"

                                className="schedule-blue-button"

                                onClick={

                                    handleAddSite

                                }

                            >

                                <Plus

                                    size={

                                        17

                                    }

                                />

                                ADD SITE

                            </button>

                            {selectedSite && (

                                <button

                                    type="button"

                                    className="schedule-remove-button"

                                    onClick={

                                        handleClearSite

                                    }

                                    title="Clear site"

                                >

                                    <X

                                        size={

                                            19

                                        }

                                    />

                                </button>

                            )}

                        </div>

                        {selectedSite && (

                            <div

                                style={{

                                    marginTop:

                                        "7px",

                                    fontSize:

                                        "12px",

                                    color:

                                        "#6b7280",

                                }}

                            >

                                Site Code:{" "}

                                <strong>

                                    {

                                        selectedSite.siteCode

                                    }

                                </strong>

                            </div>

                        )}

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Address

                        </label>

                        <input

                            type="text"

                            value={

                                address

                            }

                            onChange={(

                                e

                            ) =>

                                setAddress(

                                    e

                                        .target

                                        .value

                                )

                            }

                            placeholder="Site address"

                        />

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Task Category

                        </label>

                        <select

                            value={

                                taskCategory

                            }

                            onChange={(

                                e

                            ) =>

                                setTaskCategory(

                                    e

                                        .target

                                        .value

                                )

                            }

                        >

                            <option value="">

                                Select

                            </option>

                            <option value="MSF">

                                MSF

                            </option>

                            <option value="MFM">

                                MFM

                            </option>

                            <option value="OTHER VISIT">

                                OTHER VISIT

                            </option>

                            <option value="NIGHT VISIT">

                                NIGHT VISIT

                            </option>

                        </select>

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Task Type

                        </label>

                        <select

                            value={

                                taskType

                            }

                            onChange={(

                                e

                            ) =>

                                setTaskType(

                                    e

                                        .target

                                        .value

                                )

                            }

                        >

                            <option value="">

                                Select

                            </option>

                            <option value="Inspection">

                                Inspection

                            </option>

                            <option value="Audit">

                                Audit

                            </option>

                            <option value="Visit">

                                Visit

                            </option>

                            <option value="Verification">

                                Verification

                            </option>

                        </select>

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Task

                        </label>

                        <select

                            value={

                                task

                            }

                            onChange={(

                                e

                            ) =>

                                setTask(

                                    e

                                        .target

                                        .value

                                )

                            }

                        >

                            <option value="">

                                Select

                            </option>

                            <option value="Site Inspection">

                                Site Inspection

                            </option>

                            <option value="Guard Audit">

                                Guard Audit

                            </option>

                            <option value="Night Visit">

                                Night Visit

                            </option>

                            <option value="Security Verification">

                                Security Verification

                            </option>

                        </select>

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Task Priority

                        </label>

                        <select

                            value={

                                priority

                            }

                            onChange={(

                                e

                            ) =>

                                setPriority(

                                    e

                                        .target

                                        .value

                                )

                            }

                        >

                            <option value="MEDIUM">

                                Medium

                            </option>

                            <option value="HIGH">

                                High

                            </option>

                            <option value="LOW">

                                Low

                            </option>

                        </select>

                    </div>

                    { }

                    <div className="schedule-checkbox-field">

                        <label>

                            For Whole Day

                        </label>

                        <input

                            type="checkbox"

                            checked={

                                wholeDay

                            }

                            onChange={(

                                e

                            ) =>

                                setWholeDay(

                                    e

                                        .target

                                        .checked

                                )

                            }

                        />

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Schedule From

                        </label>

                        <div className="schedule-date-wrapper">

                            <input

                                type="date"

                                value={

                                    scheduleFrom

                                }

                                onChange={(

                                    e

                                ) =>

                                    setScheduleFrom(

                                        e

                                            .target

                                            .value

                                    )

                                }

                            />

                            <CalendarDays

                                size={

                                    19

                                }

                            />

                        </div>

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Schedule Till

                        </label>

                        <div className="schedule-date-wrapper">

                            <input

                                type="date"

                                value={

                                    scheduleTill

                                }

                                onChange={(

                                    e

                                ) =>

                                    setScheduleTill(

                                        e

                                            .target

                                            .value

                                    )

                                }

                            />

                            <CalendarDays

                                size={

                                    19

                                }

                            />

                        </div>

                    </div>

                    { }

                    <div className="schedule-checkbox-field">

                        <label>

                            Show in Advance

                        </label>

                        <div className="schedule-checkbox-content">

                            <span>

                                Always Show

                            </span>

                            <input

                                type="checkbox"

                                checked={

                                    showInAdvance

                                }

                                onChange={(

                                    e

                                ) =>

                                    setShowInAdvance(

                                        e

                                            .target

                                            .checked

                                    )

                                }

                            />

                        </div>

                    </div>

                    { }

                    <div className="schedule-checkbox-field">

                        <label>

                            Show After Missed

                        </label>

                        <div className="schedule-checkbox-content">

                            <span>

                                Always Show

                            </span>

                            <input

                                type="checkbox"

                                checked={

                                    showAfterMissed

                                }

                                onChange={(

                                    e

                                ) =>

                                    setShowAfterMissed(

                                        e

                                            .target

                                            .checked

                                    )

                                }

                            />

                        </div>

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Assigned To

                        </label>

                        <div className="schedule-assigned-row">

                            <button

                                type="button"

                                onClick={

                                    handleOpenSupervisorSelector

                                }

                                style={{

                                    flex: 1,

                                    minWidth: 0,

                                    textAlign:

                                        "left",

                                    padding:

                                        "11px 13px",

                                    border:

                                        "1px solid #d1d5db",

                                    borderRadius:

                                        "8px",

                                    background:

                                        "var(--input-bg, #ffffff)",

                                    color:

                                        selectedSupervisor

                                            ? "inherit"

                                            : "#9ca3af",

                                    cursor:

                                        "pointer",

                                    fontSize:

                                        "14px",

                                    overflow:

                                        "hidden",

                                    textOverflow:

                                        "ellipsis",

                                    whiteSpace:

                                        "nowrap",

                                }}

                            >

                                {selectedSupervisor

                                    ? selectedSupervisor.name

                                    : "Select Supervisor..."}

                            </button>

                            {selectedSupervisor && (

                                <button

                                    type="button"

                                    className="schedule-remove-button"

                                    onClick={

                                        handleClearSupervisor

                                    }

                                    title="Clear Supervisor"

                                >

                                    <X

                                        size={

                                            19

                                        }

                                    />

                                </button>

                            )}

                            <button

                                type="button"

                                className="schedule-blue-button non-system-button"

                                onClick={(event) =>

                                    handleAddNonSystemUsers(event)

                                }

                            >

                                <Plus

                                    size={

                                        17

                                    }

                                />

                                ADD NON SYSTEM

                                <br />

                                USERS

                            </button>

                        </div>

                        {selectedSupervisor && (

                            <div

                                style={{

                                    marginTop:

                                        "7px",

                                    display:

                                        "flex",

                                    alignItems:

                                        "center",

                                    gap: "7px",

                                    fontSize:

                                        "12px",

                                    color:

                                        "#6b7280",

                                }}

                            >

                                <User

                                    size={

                                        14

                                    }

                                />

                                <span>

                                    {

                                        selectedSupervisor.email

                                    }

                                </span>

                            </div>

                        )}

                    </div>

                    { }

                    <div className="schedule-field">

                        <label>

                            Remark

                        </label>

                        <input

                            type="text"

                            value={

                                remark

                            }

                            onChange={(

                                e

                            ) =>

                                setRemark(

                                    e

                                        .target

                                        .value

                                )

                            }

                            placeholder="Optional remark"

                        />

                    </div>

                    { }

                    <button

                        type="submit"

                        className="schedule-submit-button"

                        disabled={

                            loading

                        }

                    >

                        {loading

                            ? "SCHEDULING..."

                            : "SCHEDULE"}

                    </button>

                </form>

                { }

                <div className="schedule-map-container">
                    <MapContainer
                        key={`${mapPosition[0]}-${mapPosition[1]}`}
                        center={mapPosition}
                        zoom={
                            selectedSite && hasSelectedCoordinates
                                ? 14
                                : 11
                        }
                        scrollWheelZoom={true}
                        className="schedule-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                            position={mapPosition}
                            icon={markerIcon}
                        >
                            <Popup>
                                {selectedSite ? (
                                    <div>
                                        <strong>
                                            {selectedSite.siteCode}
                                        </strong>

                                        <br />

                                        {selectedSite.name}

                                        {selectedSite.city && (
                                            <>
                                                <br />
                                                {selectedSite.city}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    "Supervisor Management site map"
                                )}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

            </div>

            { }

            {showSiteSelector && (

                <div

                    style={overlayStyle}

                    onMouseDown={(e) => {

                        if (e.target === e.currentTarget) {

                            setShowSiteSelector(false);

                        }

                    }}

                >

                    <div

                        style={{

                            ...modalStyle,

                            maxHeight: "min(90vh, 620px)",

                            overflow: "hidden",

                            display: "flex",

                            flexDirection: "column",

                        }}

                    >

                        <div style={modalHeaderStyle}>

                            <h2 style={modalTitleStyle}>

                                Select Site

                            </h2>

                            <button

                                type="button"

                                style={modalCloseStyle}

                                onClick={() =>

                                    setShowSiteSelector(false)

                                }

                            >

                                <X size={21} />

                            </button>

                        </div>

                        <div

                            style={{

                                flexShrink: 0,

                                position: "relative",

                                marginBottom: "12px",

                            }}

                        >

                            <Search

                                size={17}

                                style={{

                                    position: "absolute",

                                    left: "12px",

                                    top: "50%",

                                    transform: "translateY(-50%)",

                                    color: "#9ca3af",

                                    pointerEvents: "none",

                                }}

                            />

                            <input

                                type="text"

                                value={siteSearch}

                                onChange={(e) =>

                                    setSiteSearch(e.target.value)

                                }

                                placeholder="Search by Site ID, name, city..."

                                style={{

                                    ...modalInputStyle,

                                    paddingLeft: "38px",

                                }}

                            />

                        </div>

                        <div

                            style={{

                                flex: 1,

                                minHeight: 0,

                                overflowY: "auto",

                                paddingRight: "4px",

                            }}

                        >

                            {loadingSites ? (

                                <div

                                    style={{

                                        padding: "25px",

                                        textAlign: "center",

                                        color: "#6b7280",

                                    }}

                                >

                                    Loading sites...

                                </div>

                            ) : filteredSites.length === 0 ? (

                                <div

                                    style={{

                                        padding: "25px",

                                        textAlign: "center",

                                        color: "#6b7280",

                                    }}

                                >

                                    No active sites found.

                                </div>

                            ) : (

                                <div

                                    style={{

                                        display: "flex",

                                        flexDirection: "column",

                                        gap: "8px",

                                    }}

                                >

                                    {filteredSites.map((siteItem) => (

                                        <button

                                            key={siteItem.id}

                                            type="button"

                                            onClick={() =>

                                                handleSelectSite(siteItem)

                                            }

                                            style={{

                                                width: "100%",

                                                border: "1px solid #e5e7eb",

                                                background: "transparent",

                                                borderRadius: "10px",

                                                padding: "13px 14px",

                                                cursor: "pointer",

                                                textAlign: "left",

                                            }}

                                        >

                                            <div

                                                style={{

                                                    display: "flex",

                                                    alignItems: "center",

                                                    gap: "10px",

                                                }}

                                            >

                                                <MapPin

                                                    size={18}

                                                    style={{

                                                        flexShrink: 0,

                                                    }}

                                                />

                                                <div

                                                    style={{

                                                        minWidth: 0,

                                                    }}

                                                >

                                                    <div

                                                        style={{

                                                            fontWeight: 700,

                                                            fontSize: "14px",

                                                        }}

                                                    >

                                                        {siteItem.siteCode}

                                                    </div>

                                                    <div

                                                        style={{

                                                            marginTop: "3px",

                                                            fontSize: "13px",

                                                        }}

                                                    >

                                                        {siteItem.name}

                                                    </div>

                                                    {(siteItem.city ||

                                                        siteItem.state) && (

                                                            <div

                                                                style={{

                                                                    marginTop: "3px",

                                                                    fontSize: "12px",

                                                                    color: "#6b7280",

                                                                }}

                                                            >

                                                                {siteItem.city || ""}

                                                                {siteItem.city &&

                                                                    siteItem.state

                                                                    ? ", "

                                                                    : ""}

                                                                {siteItem.state || ""}

                                                            </div>

                                                        )}

                                                </div>

                                            </div>

                                        </button>

                                    ))}

                                </div>

                            )}

                        </div>

                        <div

                            style={{

                                flexShrink: 0,

                                paddingTop: "12px",

                                marginTop: "12px",

                                borderTop: "1px solid #e5e7eb",

                            }}

                        >

                            <button

                                type="button"

                                className="schedule-blue-button"

                                style={{

                                    width: "100%",

                                    justifyContent: "center",

                                }}

                                onClick={handleAddSite}

                            >

                                <Plus size={17} />

                                ADD NEW SITE

                            </button>

                        </div>

                    </div>

                </div>

            )}

            { }

            {showAddSiteModal && (

                <div

                    style={

                        overlayStyle

                    }

                    onMouseDown={(

                        e

                    ) => {

                        if (

                            e.target ===

                            e.currentTarget

                        ) {

                            setShowAddSiteModal(

                                false

                            );

                        }

                    }}

                >

                    <div

                        style={

                            modalStyle

                        }

                    >

                        <div

                            style={

                                modalHeaderStyle

                            }

                        >

                            <h2

                                style={

                                    modalTitleStyle

                                }

                            >

                                Add New Site

                            </h2>

                            <button

                                type="button"

                                style={

                                    modalCloseStyle

                                }

                                onClick={() =>

                                    setShowAddSiteModal(

                                        false

                                    )

                                }

                            >

                                <X

                                    size={

                                        21

                                    }

                                />

                            </button>

                        </div>

                        <form

                            onSubmit={

                                handleCreateSite

                            }

                        >

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    Site ID / Code *

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSiteCode

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSiteCode(

                                            e

                                                .target

                                                .value

                                                .toUpperCase()

                                        )

                                    }

                                    placeholder="Example: AMR-001"

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    Site Name *

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSiteName

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSiteName(

                                            e

                                                .target

                                                .value

                                        )

                                    }

                                    placeholder="Example: Amritsar Main Site"

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    Address

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSiteAddress

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSiteAddress(

                                            e

                                                .target

                                                .value

                                        )

                                    }

                                    placeholder="Site address"

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    City

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSiteCity

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSiteCity(

                                            e

                                                .target

                                                .value

                                        )

                                    }

                                    placeholder="Example: Amritsar"

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    State

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSiteState

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSiteState(

                                            e

                                                .target

                                                .value

                                        )

                                    }

                                    placeholder="Example: Punjab"

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={

                                    modalFieldStyle

                                }

                            >

                                <label

                                    style={

                                        modalLabelStyle

                                    }

                                >

                                    Pincode

                                </label>

                                <input

                                    type="text"

                                    value={

                                        newSitePincode

                                    }

                                    onChange={(

                                        e

                                    ) =>

                                        setNewSitePincode(

                                            e

                                                .target

                                                .value

                                                .replace(

                                                    /\D/g,

                                                    ""

                                                )

                                        )

                                    }

                                    placeholder="Example: 143001"

                                    maxLength={

                                        6

                                    }

                                    style={

                                        modalInputStyle

                                    }

                                />

                            </div>

                            { }

                            <div

                                style={{

                                    display:

                                        "grid",

                                    gridTemplateColumns:

                                        "1fr 1fr",

                                    gap:

                                        "12px",

                                }}

                            >

                                <div

                                    style={

                                        modalFieldStyle

                                    }

                                >

                                    <label

                                        style={

                                            modalLabelStyle

                                        }

                                    >

                                        Latitude

                                    </label>

                                    <input

                                        type="text"

                                        value={

                                            newSiteLatitude

                                        }

                                        onChange={(

                                            e

                                        ) =>

                                            setNewSiteLatitude(

                                                e

                                                    .target

                                                    .value

                                            )

                                        }

                                        placeholder="Example: 31.634"

                                        style={

                                            modalInputStyle

                                        }

                                    />

                                </div>

                                <div

                                    style={

                                        modalFieldStyle

                                    }

                                >

                                    <label

                                        style={

                                            modalLabelStyle

                                        }

                                    >

                                        Longitude

                                    </label>

                                    <input

                                        type="text"

                                        value={

                                            newSiteLongitude

                                        }

                                        onChange={(

                                            e

                                        ) =>

                                            setNewSiteLongitude(

                                                e

                                                    .target

                                                    .value

                                            )

                                        }

                                        placeholder="Example: 74.8723"

                                        style={

                                            modalInputStyle

                                        }

                                    />

                                </div>

                            </div>

                            { }

                            <div

                                style={

                                    modalActionsStyle

                                }

                            >

                                <button

                                    type="button"

                                    style={

                                        cancelButtonStyle

                                    }

                                    onClick={() =>

                                        setShowAddSiteModal(

                                            false

                                        )

                                    }

                                    disabled={

                                        addingSite

                                    }

                                >

                                    CANCEL

                                </button>

                                <button

                                    type="submit"

                                    style={

                                        primaryButtonStyle

                                    }

                                    disabled={

                                        addingSite

                                    }

                                >

                                    {addingSite

                                        ? "ADDING..."

                                        : "ADD SITE"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            { }

            {showAddUserModal && (

                <div

                    style={overlayStyle}

                    onMouseDown={(e) => {

                        if (e.target === e.currentTarget) {

                            setShowAddUserModal(false);

                        }

                    }}

                >

                    <div style={modalStyle}>

                        <div style={modalHeaderStyle}>

                            <h2 style={modalTitleStyle}>

                                Add Non System User

                            </h2>

                            <button

                                type="button"

                                style={modalCloseStyle}

                                onClick={() =>

                                    setShowAddUserModal(false)

                                }

                            >

                                <X size={21} />

                            </button>

                        </div>

                        <div style={modalFieldStyle}>

                            <label style={modalLabelStyle}>

                                Site *

                            </label>

                            <select

                                value={newUserSiteId}

                                onChange={(e) => {

                                    const nextSiteId = e.target.value;

                                    const nextSite = sites.find(

                                        (item) => item.id === nextSiteId

                                    );

                                    setNewUserSiteId(nextSiteId);

                                    if (nextSite) {

                                        setSelectedSite(nextSite);

                                        setSite(nextSite.id);

                                        setAddress(nextSite.address || "");

                                        setSelectedSupervisor(null);

                                        setAssignedTo("");

                                    }

                                    setUserModalMessage("");

                                    setUserModalMessageType("");

                                }}

                                style={modalInputStyle}

                            >

                                <option value="">

                                    Select site...

                                </option>

                                {sites.map((siteItem) => (

                                    <option

                                        key={siteItem.id}

                                        value={siteItem.id}

                                    >

                                        {siteItem.siteCode} - {siteItem.name}

                                    </option>

                                ))}

                            </select>

                        </div>

                        {userModalMessage && (

                            <div

                                style={{

                                    marginBottom: "14px",

                                    padding: "10px 12px",

                                    borderRadius: "8px",

                                    background:

                                        userModalMessageType === "success"

                                            ? "rgba(22, 163, 74, 0.12)"

                                            : "rgba(220, 38, 38, 0.12)",

                                    color:

                                        userModalMessageType === "success"

                                            ? "#16a34a"

                                            : "#dc2626",

                                    fontSize: "13px",

                                }}

                            >

                                {userModalMessage}

                            </div>

                        )}

                        <form onSubmit={handleCreateNonSystemUser}>

                            <div style={modalFieldStyle}>

                                <label style={modalLabelStyle}>

                                    Full Name *

                                </label>

                                <input

                                    type="text"

                                    value={newUserName}

                                    onChange={(e) =>

                                        setNewUserName(

                                            e.target.value

                                        )

                                    }

                                    placeholder="Enter full name"

                                    style={modalInputStyle}

                                    autoFocus

                                />

                            </div>

                            <div style={modalFieldStyle}>

                                <label style={modalLabelStyle}>

                                    Email *

                                </label>

                                <input

                                    type="email"

                                    value={newUserEmail}

                                    onChange={(e) =>

                                        setNewUserEmail(

                                            e.target.value

                                        )

                                    }

                                    placeholder="user@example.com"

                                    style={modalInputStyle}

                                />

                            </div>

                            <div style={modalFieldStyle}>

                                <label style={modalLabelStyle}>

                                    Phone

                                </label>

                                <input

                                    type="text"

                                    value={newUserPhone}

                                    onChange={(e) =>

                                        setNewUserPhone(

                                            e.target.value

                                        )

                                    }

                                    placeholder="Phone number"

                                    style={modalInputStyle}

                                />

                            </div>

                            <div style={modalFieldStyle}>

                                <label style={modalLabelStyle}>

                                    Temporary Password *

                                </label>

                                <div

                                    style={{

                                        marginBottom: "7px",

                                        fontSize: "12px",

                                        color: "#6b7280",

                                    }}

                                >

                                    This password will be used by the Supervisor to sign in.

                                </div>

                                <input

                                    type="password"

                                    value={newUserPassword}

                                    onChange={(e) =>

                                        setNewUserPassword(

                                            e.target.value

                                        )

                                    }

                                    placeholder="Minimum 6 characters"

                                    style={modalInputStyle}

                                />

                            </div>

                            <div style={modalActionsStyle}>

                                <button

                                    type="button"

                                    style={cancelButtonStyle}

                                    onClick={() =>

                                        setShowAddUserModal(false)

                                    }

                                    disabled={addingUser}

                                >

                                    CANCEL

                                </button>

                                <button

                                    type="submit"

                                    style={primaryButtonStyle}

                                    disabled={addingUser}

                                >

                                    {addingUser

                                        ? "ADDING..."

                                        : "ADD USER"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            { }

            {showSupervisorSelector && (

                <div

                    style={

                        overlayStyle

                    }

                    onMouseDown={(

                        e

                    ) => {

                        if (

                            e.target ===

                            e.currentTarget

                        ) {

                            setShowSupervisorSelector(

                                false

                            );

                        }

                    }}

                >

                    <div

                        style={{

                            ...modalStyle,

                            height: "min(90vh, 620px)",

                            maxHeight: "min(90vh, 620px)",

                            boxSizing: "border-box",

                            overflow: "hidden",

                            display: "flex",

                            flexDirection: "column",

                        }}

                    >

                        <div

                            style={{

                                ...modalHeaderStyle,

                                flexShrink: 0,

                            }}

                        >

                            <h2

                                style={

                                    modalTitleStyle

                                }

                            >

                                Select Supervisor

                            </h2>

                            <button

                                type="button"

                                style={

                                    modalCloseStyle

                                }

                                onClick={() =>

                                    setShowSupervisorSelector(

                                        false

                                    )

                                }

                            >

                                <X

                                    size={

                                        21

                                    }

                                />

                            </button>

                        </div>

                        { }

                        {selectedSite && (

                            <div

                                style={{

                                    marginBottom:

                                        "12px",

                                    padding:

                                        "10px 12px",

                                    borderRadius:

                                        "8px",

                                    background:

                                        "rgba(37, 99, 235, 0.08)",

                                    fontSize:

                                        "13px",

                                    flexShrink:

                                        0,

                                }}

                            >

                                Active Supervisors available:

                                <strong

                                    style={{

                                        marginLeft:

                                            "4px",

                                    }}

                                >

                                    {

                                        selectedSite.siteCode

                                    }

                                </strong>

                            </div>

                        )}

                        { }

                        <div

                            style={{

                                position:

                                    "relative",

                                flexShrink:

                                    0,

                                marginBottom:

                                    "15px",

                            }}

                        >

                            <Search

                                size={

                                    17

                                }

                                style={{

                                    position:

                                        "absolute",

                                    left:

                                        "12px",

                                    top:

                                        "50%",

                                    transform:

                                        "translateY(-50%)",

                                    color:

                                        "#9ca3af",

                                }}

                            />

                            <input

                                type="text"

                                value={

                                    supervisorSearch

                                }

                                onChange={(

                                    e

                                ) =>

                                    setSupervisorSearch(

                                        e

                                            .target

                                            .value

                                    )

                                }

                                placeholder="Search supervisor by name..."

                                style={{

                                    ...modalInputStyle,

                                    paddingLeft:

                                        "38px",

                                }}

                            />

                        </div>

                        { }

                        <div

                            style={{

                                flex: 1,

                                minHeight: 0,

                                overflowY: "auto",

                                overflowX: "hidden",

                                paddingRight: "4px",

                            }}

                        >

                            {loadingSupervisors ? (

                                <div

                                    style={{

                                        padding:

                                            "25px",

                                        textAlign:

                                            "center",

                                        color:

                                            "#6b7280",

                                    }}

                                >

                                    Loading supervisor...

                                </div>

                            ) : filteredSupervisors.length ===

                                0 ? (

                                <div

                                    style={{

                                        padding:

                                            "25px",

                                        textAlign:

                                            "center",

                                        color:

                                            "#6b7280",

                                    }}

                                >

                                    No active Supervisor found.

                                </div>

                            ) : (

                                <div

                                    style={{

                                        display: "flex",

                                        flexDirection: "column",

                                        gap: "8px",

                                        width: "100%",

                                    }}

                                >

                                    {filteredSupervisors.map(

                                        (

                                            user

                                        ) => (

                                            <button

                                                key={

                                                    user.id

                                                }

                                                type="button"

                                                onClick={() =>

                                                    handleSelectSupervisor(

                                                        user

                                                    )

                                                }

                                                style={{

                                                    width:

                                                        "100%",

                                                    border:

                                                        "1px solid #e5e7eb",

                                                    background:

                                                        "transparent",

                                                    borderRadius:

                                                        "10px",

                                                    padding:

                                                        "13px 14px",

                                                    cursor:

                                                        "pointer",

                                                    textAlign:

                                                        "left",

                                                }}

                                            >

                                                <div

                                                    style={{

                                                        display:

                                                            "flex",

                                                        alignItems:

                                                            "center",

                                                        gap:

                                                            "10px",

                                                    }}

                                                >

                                                    <div

                                                        style={{

                                                            width:

                                                                "36px",

                                                            height:

                                                                "36px",

                                                            borderRadius:

                                                                "50%",

                                                            display:

                                                                "flex",

                                                            alignItems:

                                                                "center",

                                                            justifyContent:

                                                                "center",

                                                            background:

                                                                "rgba(37, 99, 235, 0.10)",

                                                            flexShrink:

                                                                0,

                                                        }}

                                                    >

                                                        <User

                                                            size={

                                                                18

                                                            }

                                                        />

                                                    </div>

                                                    <div

                                                        style={{

                                                            minWidth:

                                                                0,

                                                        }}

                                                    >

                                                        <div

                                                            style={{

                                                                fontWeight:

                                                                    700,

                                                                fontSize:

                                                                    "14px",

                                                            }}

                                                        >

                                                            {

                                                                user.name

                                                            }

                                                        </div>

                                                        {user.email && (

                                                            <div

                                                                style={{

                                                                    marginTop:

                                                                        "3px",

                                                                    fontSize:

                                                                        "12px",

                                                                    color:

                                                                        "#6b7280",

                                                                }}

                                                            >

                                                                {

                                                                    user.email

                                                                }

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </button>

                                        )

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default ScheduleTask;
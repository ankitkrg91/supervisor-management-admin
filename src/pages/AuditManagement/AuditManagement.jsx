import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Edit3,
    Eye,
    Plus,
    RefreshCw,
    Trash2,
    XCircle,
} from "lucide-react";

import { apiFetch } from "../../utils/api";

import "./AuditManagement.css";


const EMPTY_FORM = {
    questionNo: "",
    question: "",
    isRequired: true,
};


const AuditManagement = () => {

    // =====================================================
    // EXISTING CHECKLIST STATE
    // =====================================================

    const [questions, setQuestions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);


    // =====================================================
    // EXISTING ALERT STATE
    // =====================================================

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // =====================================================
    // EXISTING QUESTION MODAL STATE
    // =====================================================

    const [showModal, setShowModal] = useState(false);

    const [editingQuestion, setEditingQuestion] =
        useState(null);

    const [form, setForm] =
        useState(EMPTY_FORM);


    // =====================================================
    // NEW AUDIT REGISTER STATE
    // =====================================================

    const [activeSection, setActiveSection] =
        useState("checklist");

    const [submittedAudits, setSubmittedAudits] =
        useState([]);

    const [auditLoading, setAuditLoading] =
        useState(false);

    const [auditStatusFilter, setAuditStatusFilter] =
        useState("ALL");


    // =====================================================
    // NEW AUDIT DETAIL MODAL
    // =====================================================

    const [selectedAudit, setSelectedAudit] =
        useState(null);

    const [auditDetails, setAuditDetails] =
        useState(null);

    const [auditDetailLoading, setAuditDetailLoading] =
        useState(false);

    const [auditActionLoading, setAuditActionLoading] =
        useState(false);


    // =====================================================
    // SHOW ERROR
    // =====================================================

    const showError = (message) => {

        setError(
            message ||
            "Something went wrong."
        );

        setSuccess("");
    };


    // =====================================================
    // SHOW SUCCESS
    // =====================================================

    const showSuccess = (message) => {

        setSuccess(
            message ||
            "Operation completed."
        );

        setError("");

        window.setTimeout(() => {

            setSuccess("");

        }, 3000);
    };


    // =====================================================
    // COMMON RESPONSE HANDLER
    // =====================================================

    const handleResponse = async (response) => {

        const body =
            await response
                .json()
                .catch(() => ({}));


        if (response.status === 401) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/login";

            return null;
        }


        if (!response.ok) {

            throw new Error(
                body?.message ||
                body?.error ||
                `Request failed with status ${response.status}`
            );
        }


        return body;
    };


    // =====================================================
    // LOAD AUDIT QUESTIONS
    // =====================================================

    const loadQuestions = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await apiFetch(
                    "/api/audit/checklist"
                );


            const body =
                await handleResponse(
                    response
                );


            if (!body) {
                return;
            }


            const checklist =
                body?.data?.checklist ||
                body?.checklist ||
                null;


            const questionList =
                checklist?.questions ||
                [];


            setQuestions(
                [...questionList].sort(
                    (a, b) =>
                        Number(
                            a.questionNo || 0
                        ) -
                        Number(
                            b.questionNo || 0
                        )
                )
            );

        } catch (err) {

            console.error(
                "Load audit questions error:",
                err
            );


            showError(
                err?.message ||
                "Failed to load audit questions."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // LOAD SUBMITTED AUDITS
    //
    // IMPORTANT:
    // The Audit Register uses the existing Visit API.
    //
    // Every Visit having auditSubmission is treated
    // as one submitted audit.
    // =====================================================

    const loadSubmittedAudits = async () => {
        try {
            setAuditLoading(true);
            setError("");

            const query =
                auditStatusFilter !== "ALL"
                    ? `?status=${encodeURIComponent(
                        auditStatusFilter
                    )}&page=1&limit=100`
                    : "?page=1&limit=100";

            const response =
                await apiFetch(
                    `/api/audit/submissions${query}`,
                    {
                        method: "GET",
                    }
                );

            const body =
                await handleResponse(
                    response
                );

            if (!body) {
                return;
            }

            setSubmittedAudits(
                body?.data?.audits || []
            );

        } catch (err) {

            console.error(
                "Load submitted audits error:",
                err
            );

            showError(
                err?.message ||
                "Failed to load submitted audits."
            );

        } finally {

            setAuditLoading(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadQuestions();
    }, []);


    useEffect(() => {
        if (
            activeSection === "register"
        ) {
            loadSubmittedAudits();
        }
    }, [
        auditStatusFilter,
        activeSection,
    ]);


    // =====================================================
    // REFRESH CURRENT SECTION
    // =====================================================

    const refreshCurrentSection = async () => {

        if (
            activeSection ===
            "checklist"
        ) {

            await loadQuestions();

            return;
        }


        await loadSubmittedAudits();
    };


    // =====================================================
    // OPEN ADD QUESTION
    // =====================================================

    const openAddQuestion = () => {

        const activeQuestions =
            questions.filter(
                (item) =>
                    item.isActive !==
                    false
            );


        const nextQuestionNo =
            activeQuestions.length > 0
                ? Math.max(
                    ...activeQuestions.map(
                        (item) =>
                            Number(
                                item.questionNo
                            ) || 0
                    )
                ) + 1
                : 1;


        setEditingQuestion(
            null
        );


        setForm({
            questionNo:
                String(
                    nextQuestionNo
                ),

            question: "",

            isRequired: true,
        });


        setShowModal(true);
    };


    // =====================================================
    // OPEN EDIT QUESTION
    // =====================================================

    const openEditQuestion = (
        question
    ) => {

        setEditingQuestion(
            question
        );


        setForm({

            questionNo:
                String(
                    question?.questionNo ||
                    ""
                ),

            question:
                question?.question ||
                "",

            isRequired:
                question?.isRequired !==
                false,
        });


        setShowModal(true);
    };


    // =====================================================
    // CLOSE QUESTION MODAL
    // =====================================================

    const closeModal = () => {

        if (saving) {
            return;
        }


        setShowModal(false);

        setEditingQuestion(
            null
        );

        setForm(
            EMPTY_FORM
        );
    };


    // =====================================================
    // SAVE QUESTION
    // =====================================================

    const saveQuestion = async (
        event
    ) => {

        event.preventDefault();


        const questionNo =
            Number(
                form.questionNo
            );


        const question =
            form.question.trim();


        if (
            !Number.isInteger(
                questionNo
            ) ||
            questionNo <= 0
        ) {

            showError(
                "Question number must be a positive integer."
            );

            return;
        }


        if (!question) {

            showError(
                "Question text is required."
            );

            return;
        }


        try {

            setSaving(true);

            setError("");


            const isEdit =
                Boolean(
                    editingQuestion?.id
                );


            const url =
                isEdit
                    ? `/api/audit/checklist/questions/${editingQuestion.id}`
                    : "/api/audit/checklist/questions";


            const response =
                await apiFetch(
                    url,
                    {
                        method:
                            isEdit
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify({
                                questionNo,

                                question,

                                type:
                                    "YES_NO",

                                isRequired:
                                    Boolean(
                                        form.isRequired
                                    ),
                            }),
                    }
                );


            const body =
                await handleResponse(
                    response
                );


            if (!body) {
                return;
            }


            showSuccess(
                isEdit
                    ? "Audit question updated successfully."
                    : "Audit question created successfully."
            );


            closeModal();


            await loadQuestions();

        } catch (err) {

            console.error(
                "Save audit question error:",
                err
            );


            showError(
                err?.message ||
                "Failed to save audit question."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // DELETE QUESTION
    // =====================================================

    const deleteQuestion = async (
        question
    ) => {

        if (!question?.id) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete question ${question.questionNo}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setSaving(true);

            setError("");


            const response =
                await apiFetch(
                    `/api/audit/checklist/questions/${question.id}`,
                    {
                        method:
                            "DELETE",
                    }
                );


            const body =
                await handleResponse(
                    response
                );


            if (!body) {
                return;
            }


            showSuccess(
                `Question ${question.questionNo} deleted successfully.`
            );


            await loadQuestions();

        } catch (err) {

            console.error(
                "Delete audit question error:",
                err
            );


            showError(
                err?.message ||
                "Failed to delete audit question."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // RESTORE QUESTION
    // =====================================================

    const restoreQuestion = async (
        question
    ) => {

        if (!question?.id) {
            return;
        }


        try {

            setSaving(true);

            setError("");


            const response =
                await apiFetch(
                    `/api/audit/checklist/questions/${question.id}`,
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify({
                                questionNo:
                                    Number(
                                        question.questionNo
                                    ),

                                question:
                                    question.question,

                                type:
                                    "YES_NO",

                                isRequired:
                                    question.isRequired !==
                                    false,

                                isActive:
                                    true,
                            }),
                    }
                );


            const body =
                await handleResponse(
                    response
                );


            if (!body) {
                return;
            }


            showSuccess(
                `Question ${question.questionNo} restored.`
            );


            await loadQuestions();

        } catch (err) {

            console.error(
                "Restore audit question error:",
                err
            );


            showError(
                err?.message ||
                "Failed to restore question."
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // OPEN AUDIT DETAILS
    // =====================================================

    const openAuditDetails = async (
        audit
    ) => {
        if (!audit?.id) {
            return;
        }

        try {
            setSelectedAudit(audit);

            setAuditDetails(null);

            setAuditDetailLoading(true);

            setError("");

            const response =
                await apiFetch(
                    `/api/audit/submissions/${audit.id}`,
                    {
                        method: "GET",
                    }
                );

            const body =
                await handleResponse(
                    response
                );

            if (!body) {
                return;
            }

            const auditData =
                body?.data?.audit ||
                null;

            setAuditDetails(
                auditData
            );

        } catch (err) {

            console.error(
                "Open audit details error:",
                err
            );

            showError(
                err?.message ||
                "Failed to load audit details."
            );

            setSelectedAudit(null);

        } finally {

            setAuditDetailLoading(false);
        }
    };

    // =====================================================
    // CLOSE AUDIT DETAILS
    // =====================================================

    const closeAuditDetails = () => {

        if (
            auditActionLoading
        ) {
            return;
        }


        setSelectedAudit(
            null
        );

        setAuditDetails(
            null
        );

        setAuditDetailLoading(
            false
        );
    };


    // =====================================================
    // UPDATE AUDIT STATUS
    //
    // EXISTING VISIT STATUS API:
    //
    // VERIFIED
    // REJECTED
    //
    // This keeps audit verification tied to the same
    // audit/visit record.
    // =====================================================

    const updateAuditStatus = async (
        nextStatus
    ) => {

        const auditId =
            auditDetails?.id ||
            selectedAudit?.id;


        if (!auditId) {
            return;
        }


        const normalizedStatus =
            String(
                nextStatus || ""
            )
                .trim()
                .toUpperCase();


        if (
            ![
                "VERIFIED",
                "REJECTED",
            ].includes(
                normalizedStatus
            )
        ) {

            showError(
                "Invalid audit status."
            );

            return;
        }


        const statusLabel =
            normalizedStatus ===
                "VERIFIED"
                ? "verify"
                : "reject";


        const confirmed =
            window.confirm(
                `Are you sure you want to ${statusLabel} this audit?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setAuditActionLoading(
                true
            );

            setError("");


            /*
             * IMPORTANT:
             * Content-Type is required because
             * the backend expects JSON in req.body.
             */

            const response =
                await apiFetch(
                    `/api/audit/submissions/${auditId}/status`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                status:
                                    normalizedStatus,
                            }),
                    }
                );


            const body =
                await handleResponse(
                    response
                );


            if (!body) {
                return;
            }


            /*
             * ----------------------------------------------------
             * SUCCESS MESSAGE
             * ----------------------------------------------------
             */

            showSuccess(
                normalizedStatus ===
                    "VERIFIED"

                    ? "Audit verified successfully."

                    : "Audit rejected successfully."
            );


            /*
             * ----------------------------------------------------
             * UPDATE MODAL IMMEDIATELY
             * ----------------------------------------------------
             */

            setAuditDetails(
                (current) => {

                    if (!current) {
                        return current;
                    }


                    return {

                        ...current,

                        status:
                            normalizedStatus,


                        visit: {

                            ...current.visit,

                            status:
                                normalizedStatus,

                        },

                    };

                }
            );


            /*
             * ----------------------------------------------------
             * UPDATE SELECTED AUDIT
             * ----------------------------------------------------
             */

            setSelectedAudit(
                (current) => {

                    if (!current) {
                        return current;
                    }


                    return {

                        ...current,

                        status:
                            normalizedStatus,


                        visit: {

                            ...current.visit,

                            status:
                                normalizedStatus,

                        },

                    };

                }
            );


            /*
             * ----------------------------------------------------
             * REFRESH REGISTER
             * ----------------------------------------------------
             */

            await loadSubmittedAudits();


        } catch (err) {

            console.error(
                "Update audit status error:",
                err
            );


            showError(
                err?.message ||
                "Failed to update audit verification status."
            );


        } finally {

            setAuditActionLoading(
                false
            );

        }

    };

    // =====================================================
    // AUDIT STATUS
    // =====================================================

    const getAuditStatus = (
        audit
    ) => {

        return (
            audit?.status ||
            "PENDING"
        )
            .toString()
            .toUpperCase();
    };


    // =====================================================
    // STATUS FILTER
    // =====================================================

    const filteredAudits =
        useMemo(
            () => {

                if (
                    auditStatusFilter ===
                    "ALL"
                ) {
                    return submittedAudits;
                }


                return submittedAudits.filter(
                    (audit) =>
                        getAuditStatus(
                            audit
                        ) ===
                        auditStatusFilter
                );

            },
            [
                submittedAudits,
                auditStatusFilter,
            ]
        );


    // =====================================================
    // AUDIT COUNTS
    // =====================================================

    const auditCounts =
        useMemo(
            () => {

                let pending = 0;

                let verified = 0;

                let rejected = 0;


                submittedAudits.forEach(
                    (audit) => {

                        const status =
                            getAuditStatus(
                                audit
                            );


                        if (
                            status ===
                            "VERIFIED"
                        ) {
                            verified += 1;
                        }


                        if (
                            status ===
                            "REJECTED"
                        ) {
                            rejected += 1;
                        }


                        if (
                            status ===
                            "PENDING"
                        ) {
                            pending += 1;
                        }
                    }
                );


                return {

                    total:
                        submittedAudits.length,

                    pending,

                    verified,

                    rejected,
                };

            },
            [
                submittedAudits,
            ]
        );


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value
    ) => {

        if (!value) {
            return "NA";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "NA";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };


    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (
        value
    ) => {

        if (!value) {
            return "NA";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "NA";
        }


        return date.toLocaleTimeString(
            "en-IN",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    true,
            }
        );
    };


    // =====================================================
    // ANSWER DISPLAY
    // =====================================================

    const getAnswerText = (
        answer
    ) => {

        if (
            typeof answer?.booleanValue ===
            "boolean"
        ) {

            return answer.booleanValue
                ? "YES"
                : "NO";
        }


        if (
            answer?.textValue !==
            null &&
            answer?.textValue !==
            undefined &&
            String(
                answer.textValue
            ).trim()
        ) {

            return String(
                answer.textValue
            );
        }


        return "NOT ANSWERED";
    };


    // =====================================================
    // STATUS BADGE
    // =====================================================

    const getStatusBadgeStyle = (
        status
    ) => {

        const normalized =
            (
                status ||
                "PENDING"
            )
                .toString()
                .toUpperCase();


        if (
            normalized ===
            "VERIFIED"
        ) {

            return {
                background:
                    "#DCFCE7",

                color:
                    "#166534",

                border:
                    "1px solid #86EFAC",
            };
        }


        if (
            normalized ===
            "REJECTED"
        ) {

            return {
                background:
                    "#FEE2E2",

                color:
                    "#991B1B",

                border:
                    "1px solid #FCA5A5",
            };
        }


        return {

            background:
                "#FEF3C7",

            color:
                "#92400E",

            border:
                "1px solid #FCD34D",
        };
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="audit-management-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <section className="audit-page-header">

                <div className="audit-page-title">

                    <div className="audit-page-icon">
                        <ClipboardCheck size={24} />
                    </div>


                    <div>

                        <h1>
                            Audit Management
                        </h1>


                        <p>
                            Manage audit checklist questions
                            and review submitted audits.
                        </p>

                    </div>

                </div>


                <div className="audit-header-actions">

                    <button
                        type="button"
                        className="audit-secondary-btn"
                        onClick={
                            refreshCurrentSection
                        }
                        disabled={
                            loading ||
                            auditLoading ||
                            saving
                        }
                    >

                        <RefreshCw
                            size={16}
                        />

                        Refresh

                    </button>


                    {activeSection ===
                        "checklist" && (

                            <button
                                type="button"
                                className="audit-primary-btn"
                                onClick={
                                    openAddQuestion
                                }
                                disabled={
                                    saving
                                }
                            >

                                <Plus
                                    size={17}
                                />

                                Add Question

                            </button>
                        )}

                </div>

            </section>


            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (

                <div className="audit-alert audit-alert-error">

                    {error}

                </div>
            )}


            {success && (

                <div className="audit-alert audit-alert-success">

                    {success}

                </div>
            )}


            {/* =================================================
                NEW SECTION TABS
            ================================================= */}

            <div
                style={{
                    display:
                        "flex",

                    gap:
                        "8px",

                    marginBottom:
                        "18px",

                    flexWrap:
                        "wrap",
                }}
            >

                <button
                    type="button"
                    onClick={() =>
                        setActiveSection(
                            "checklist"
                        )
                    }
                    style={{
                        display:
                            "inline-flex",

                        alignItems:
                            "center",

                        gap:
                            "8px",

                        padding:
                            "10px 16px",

                        borderRadius:
                            "8px",

                        border:
                            activeSection ===
                                "checklist"
                                ? "1px solid #2563eb"
                                : "1px solid #d1d5db",

                        background:
                            activeSection ===
                                "checklist"
                                ? "#2563eb"
                                : "#ffffff",

                        color:
                            activeSection ===
                                "checklist"
                                ? "#ffffff"
                                : "#374151",

                        fontWeight:
                            600,

                        cursor:
                            "pointer",
                    }}
                >

                    <ClipboardCheck
                        size={17}
                    />

                    Checklist Questions

                </button>


                <button
                    type="button"
                    onClick={() => {

                        setActiveSection(
                            "register"
                        );

                        loadSubmittedAudits();

                    }}
                    style={{
                        display:
                            "inline-flex",

                        alignItems:
                            "center",

                        gap:
                            "8px",

                        padding:
                            "10px 16px",

                        borderRadius:
                            "8px",

                        border:
                            activeSection ===
                                "register"
                                ? "1px solid #2563eb"
                                : "1px solid #d1d5db",

                        background:
                            activeSection ===
                                "register"
                                ? "#2563eb"
                                : "#ffffff",

                        color:
                            activeSection ===
                                "register"
                                ? "#ffffff"
                                : "#374151",

                        fontWeight:
                            600,

                        cursor:
                            "pointer",
                    }}
                >

                    <Eye
                        size={17}
                    />

                    Audit Register

                    <span
                        style={{
                            minWidth:
                                "22px",

                            height:
                                "22px",

                            padding:
                                "0 6px",

                            borderRadius:
                                "999px",

                            display:
                                "inline-flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            fontSize:
                                "12px",

                            background:
                                activeSection ===
                                    "register"
                                    ? "rgba(255,255,255,0.2)"
                                    : "#EEF2FF",

                            color:
                                activeSection ===
                                    "register"
                                    ? "#ffffff"
                                    : "#3730A3",
                        }}
                    >
                        {
                            auditCounts.total
                        }
                    </span>

                </button>

            </div>


            {/* =================================================
                CHECKLIST SECTION
            ================================================= */}

            {activeSection ===
                "checklist" && (

                    <section className="audit-checklist-card">

                        <div className="audit-card-header">

                            <div>

                                <h2>
                                    Audit Checklist
                                </h2>


                                <span>

                                    {
                                        questions.filter(
                                            (item) =>
                                                item.isActive !==
                                                false
                                        ).length
                                    }{" "}

                                    active questions

                                </span>

                            </div>

                        </div>


                        <div className="audit-info-box">

                            <ClipboardCheck
                                size={18}
                            />


                            <div>

                                <strong>
                                    Yes / No Audit
                                </strong>


                                <p>
                                    These questions are shown
                                    to supervisors during the audit.
                                </p>

                            </div>

                        </div>


                        <div className="audit-question-table-wrap">

                            <table className="audit-question-table">

                                <thead>

                                    <tr>

                                        <th>
                                            #
                                        </th>

                                        <th>
                                            Question
                                        </th>

                                        <th>
                                            Answer Type
                                        </th>

                                        <th>
                                            Required
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {loading ? (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                className="audit-empty-cell"
                                            >
                                                Loading audit questions...
                                            </td>

                                        </tr>

                                    ) : questions.length ===
                                        0 ? (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                className="audit-empty-cell"
                                            >
                                                No audit questions
                                                created yet.
                                            </td>

                                        </tr>

                                    ) : (

                                        questions.map(
                                            (
                                                question
                                            ) => (

                                                <tr
                                                    key={
                                                        question.id
                                                    }
                                                    className={
                                                        question.isActive ===
                                                            false
                                                            ? "question-inactive"
                                                            : ""
                                                    }
                                                >

                                                    <td>

                                                        <strong>
                                                            {
                                                                question.questionNo
                                                            }
                                                        </strong>

                                                    </td>


                                                    <td className="audit-question-text">

                                                        {
                                                            question.question
                                                        }

                                                    </td>


                                                    <td>

                                                        <span className="audit-type-badge">

                                                            YES / NO

                                                        </span>

                                                    </td>


                                                    <td>

                                                        {
                                                            question.isRequired
                                                                ? "Yes"
                                                                : "No"
                                                        }

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`audit-status ${question.isActive ===
                                                                    false
                                                                    ? "inactive"
                                                                    : "active"
                                                                }`}
                                                        >

                                                            {
                                                                question.isActive ===
                                                                    false
                                                                    ? "DELETED"
                                                                    : "ACTIVE"
                                                            }

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="audit-action-buttons">

                                                            {question.isActive !==
                                                                false ? (

                                                                <>

                                                                    <button
                                                                        type="button"
                                                                        className="audit-icon-btn"
                                                                        title="Edit question"
                                                                        onClick={() =>
                                                                            openEditQuestion(
                                                                                question
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                    >

                                                                        <Edit3
                                                                            size={
                                                                                15
                                                                            }
                                                                        />

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="audit-icon-btn danger"
                                                                        title="Delete question"
                                                                        onClick={() =>
                                                                            deleteQuestion(
                                                                                question
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                    >

                                                                        <Trash2
                                                                            size={
                                                                                15
                                                                            }
                                                                        />

                                                                    </button>

                                                                </>

                                                            ) : (

                                                                <button
                                                                    type="button"
                                                                    className="audit-restore-btn"
                                                                    onClick={() =>
                                                                        restoreQuestion(
                                                                            question
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                >
                                                                    Restore
                                                                </button>

                                                            )}

                                                        </div>

                                                    </td>

                                                </tr>
                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </section>
                )}


            {/* =================================================
                AUDIT REGISTER SECTION
            ================================================= */}

            {activeSection ===
                "register" && (

                    <section className="audit-checklist-card">

                        <div
                            className="audit-card-header"
                            style={{
                                display:
                                    "flex",

                                justifyContent:
                                    "space-between",

                                alignItems:
                                    "center",

                                gap:
                                    "15px",

                                flexWrap:
                                    "wrap",
                            }}
                        >

                            <div>

                                <h2>
                                    Audit Register
                                </h2>


                                <span>
                                    All submitted audits
                                    are shown here.
                                </span>

                            </div>


                            <div
                                style={{
                                    display:
                                        "flex",

                                    gap:
                                        "8px",

                                    flexWrap:
                                        "wrap",
                                }}
                            >

                                <span
                                    style={{
                                        padding:
                                            "6px 10px",

                                        borderRadius:
                                            "999px",

                                        background:
                                            "#FEF3C7",

                                        color:
                                            "#92400E",

                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Pending:{" "}
                                    {
                                        auditCounts.pending
                                    }
                                </span>


                                <span
                                    style={{
                                        padding:
                                            "6px 10px",

                                        borderRadius:
                                            "999px",

                                        background:
                                            "#DCFCE7",

                                        color:
                                            "#166534",

                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Verified:{" "}
                                    {
                                        auditCounts.verified
                                    }
                                </span>


                                <span
                                    style={{
                                        padding:
                                            "6px 10px",

                                        borderRadius:
                                            "999px",

                                        background:
                                            "#FEE2E2",

                                        color:
                                            "#991B1B",

                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    Rejected:{" "}
                                    {
                                        auditCounts.rejected
                                    }
                                </span>

                            </div>

                        </div>


                        {/* =========================================
                        STATUS FILTER
                    ========================================= */}

                        <div
                            style={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    "10px",

                                margin:
                                    "16px 0",

                                flexWrap:
                                    "wrap",
                            }}
                        >

                            <label
                                htmlFor="audit-status-filter"
                                style={{
                                    fontWeight:
                                        600,

                                    fontSize:
                                        "14px",
                                }}
                            >
                                Status:
                            </label>


                            <select
                                id="audit-status-filter"
                                value={
                                    auditStatusFilter
                                }
                                onChange={(event) =>
                                    setAuditStatusFilter(
                                        event.target.value
                                    )
                                }
                                style={{
                                    minWidth:
                                        "180px",

                                    padding:
                                        "9px 12px",

                                    border:
                                        "1px solid #D1D5DB",

                                    borderRadius:
                                        "7px",

                                    background:
                                        "#ffffff",

                                    outline:
                                        "none",
                                }}
                            >

                                <option value="ALL">
                                    All Audits (
                                    {
                                        auditCounts.total
                                    }
                                    )
                                </option>

                                <option value="PENDING">
                                    Pending Verification (
                                    {
                                        auditCounts.pending
                                    }
                                    )
                                </option>

                                <option value="VERIFIED">
                                    Verified (
                                    {
                                        auditCounts.verified
                                    }
                                    )
                                </option>

                                <option value="REJECTED">
                                    Rejected (
                                    {
                                        auditCounts.rejected
                                    }
                                    )
                                </option>

                                <option value="UNVERIFIED">
                                    Unverified
                                </option>

                            </select>

                        </div>


                        {/* =========================================
                        REGISTER TABLE
                    ========================================= */}

                        <div className="audit-question-table-wrap">

                            <table className="audit-question-table">

                                <thead>

                                    <tr>

                                        <th>
                                            #
                                        </th>

                                        <th>
                                            Supervisor
                                        </th>

                                        <th>
                                            Site
                                        </th>

                                        <th>
                                            Audit Date
                                        </th>

                                        <th>
                                            Audit Time
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {auditLoading ? (

                                        <tr>

                                            <td
                                                colSpan="7"
                                                className="audit-empty-cell"
                                            >
                                                Loading submitted audits...
                                            </td>

                                        </tr>

                                    ) : filteredAudits.length ===
                                        0 ? (

                                        <tr>

                                            <td
                                                colSpan="7"
                                                className="audit-empty-cell"
                                            >
                                                No submitted audits
                                                found for this filter.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredAudits.map(
                                            (
                                                audit,
                                                index
                                            ) => {

                                                const status =
                                                    getAuditStatus(
                                                        audit
                                                    );


                                                return (

                                                    <tr
                                                        key={
                                                            audit.id
                                                        }
                                                    >

                                                        <td>

                                                            {
                                                                index +
                                                                1
                                                            }

                                                        </td>


                                                        <td>

                                                            <strong>

                                                                {
                                                                    audit
                                                                        ?.user
                                                                        ?.name ||
                                                                    "NA"
                                                                }

                                                            </strong>


                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",

                                                                    color:
                                                                        "#6B7280",

                                                                    marginTop:
                                                                        "3px",
                                                                }}
                                                            >

                                                                {
                                                                    audit
                                                                        ?.user
                                                                        ?.email ||
                                                                    ""
                                                                }

                                                            </div>

                                                        </td>


                                                        <td>

                                                            <strong>

                                                                {
                                                                    audit
                                                                        ?.site
                                                                        ?.name ||
                                                                    "NA"
                                                                }

                                                            </strong>


                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",

                                                                    color:
                                                                        "#6B7280",

                                                                    marginTop:
                                                                        "3px",
                                                                }}
                                                            >

                                                                {
                                                                    audit
                                                                        ?.site
                                                                        ?.siteCode ||
                                                                    "NA"
                                                                }

                                                            </div>

                                                        </td>


                                                        <td>

                                                            {
                                                                formatDate(
                                                                    audit
                                                                        ?.auditSubmission
                                                                        ?.submittedAt ||
                                                                    audit?.visitAt
                                                                )
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatTime(
                                                                    audit
                                                                        ?.auditSubmission
                                                                        ?.submittedAt ||
                                                                    audit?.visitAt
                                                                )
                                                            }

                                                        </td>


                                                        <td>

                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-flex",

                                                                    alignItems:
                                                                        "center",

                                                                    gap:
                                                                        "5px",

                                                                    padding:
                                                                        "5px 9px",

                                                                    borderRadius:
                                                                        "999px",

                                                                    fontSize:
                                                                        "12px",

                                                                    fontWeight:
                                                                        700,

                                                                    ...getStatusBadgeStyle(
                                                                        status
                                                                    ),
                                                                }}
                                                            >

                                                                {status ===
                                                                    "VERIFIED" && (
                                                                        <CheckCircle2
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    )}


                                                                {status ===
                                                                    "REJECTED" && (
                                                                        <XCircle
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    )}


                                                                {status !==
                                                                    "VERIFIED" &&
                                                                    status !==
                                                                    "REJECTED" && (
                                                                        <AlertCircle
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    )}


                                                                {
                                                                    status
                                                                }

                                                            </span>

                                                        </td>


                                                        <td>

                                                            <button
                                                                type="button"
                                                                className="audit-secondary-btn"
                                                                onClick={() =>
                                                                    openAuditDetails(
                                                                        audit
                                                                    )
                                                                }
                                                                style={{
                                                                    display:
                                                                        "inline-flex",

                                                                    alignItems:
                                                                        "center",

                                                                    gap:
                                                                        "6px",
                                                                }}
                                                            >

                                                                <Eye
                                                                    size={
                                                                        15
                                                                    }
                                                                />

                                                                View

                                                            </button>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </section>
                )}


            {/* =================================================
                ADD / EDIT QUESTION MODAL
            ================================================= */}

            {showModal && (

                <div className="audit-modal-backdrop">

                    <div className="audit-modal">

                        <div className="audit-modal-header">

                            <div>

                                <h2>

                                    {editingQuestion
                                        ? "Edit Audit Question"
                                        : "Add Audit Question"}

                                </h2>


                                <p>
                                    Only Yes / No answers are
                                    used in the audit.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="audit-modal-close"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="audit-form"
                            onSubmit={
                                saveQuestion
                            }
                        >

                            <div className="audit-form-grid">

                                <div className="audit-form-field">

                                    <label>
                                        Question No.
                                    </label>


                                    <input
                                        type="number"
                                        min="1"
                                        value={
                                            form.questionNo
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    questionNo:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                    />

                                </div>


                                <div className="audit-form-field">

                                    <label>
                                        Answer Type
                                    </label>


                                    <input
                                        type="text"
                                        value="YES / NO"
                                        disabled
                                    />

                                </div>

                            </div>


                            <div className="audit-form-field">

                                <label>
                                    Question
                                </label>


                                <textarea
                                    rows="4"
                                    value={
                                        form.question
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                question:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Enter audit question..."
                                    autoFocus
                                />

                            </div>


                            <label className="audit-checkbox-row">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.isRequired
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,

                                                isRequired:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />


                                <span>
                                    Required question
                                </span>

                            </label>


                            <div className="audit-modal-footer">

                                <button
                                    type="button"
                                    className="audit-secondary-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="audit-primary-btn"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving
                                        ? "Saving..."
                                        : editingQuestion
                                            ? "Update Question"
                                            : "Create Question"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* =================================================
                AUDIT DETAILS / VERIFY MODAL
            ================================================= */}

            {selectedAudit && (

                <div
                    className="audit-modal-backdrop"
                    onClick={closeAuditDetails}
                >

                    <div
                        className="audit-modal"
                        style={{
                            maxWidth:
                                "1050px",

                            width:
                                "95%",

                            maxHeight:
                                "90vh",

                            overflowY:
                                "auto",
                        }}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="audit-modal-header">

                            <div>

                                <h2>
                                    Audit Review
                                </h2>


                                <p>
                                    Review submitted answers
                                    before verification.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="audit-modal-close"
                                onClick={
                                    closeAuditDetails
                                }
                                disabled={
                                    auditActionLoading
                                }
                            >
                                ×
                            </button>

                        </div>


                        {auditDetailLoading ? (

                            <div
                                style={{
                                    padding:
                                        "40px",

                                    textAlign:
                                        "center",

                                    color:
                                        "#6B7280",
                                }}
                            >

                                Loading audit details...

                            </div>

                        ) : auditDetails ? (

                            <div
                                style={{
                                    padding:
                                        "0 4px 10px",
                                }}
                            >

                                {/* ==================================
                                    AUDIT INFORMATION
                                ================================== */}

                                <div
                                    style={{
                                        display:
                                            "grid",

                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(220px, 1fr))",

                                        gap:
                                            "12px",

                                        marginBottom:
                                            "18px",
                                    }}
                                >

                                    <div
                                        style={{
                                            padding:
                                                "12px",

                                            border:
                                                "1px solid #E5E7EB",

                                            borderRadius:
                                                "8px",

                                            background:
                                                "#F9FAFB",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginBottom:
                                                    "4px",
                                            }}
                                        >
                                            Supervisor
                                        </div>


                                        <strong>

                                            {
                                                auditDetails
                                                    ?.visit
                                                    ?.user
                                                    ?.name ||
                                                "NA"
                                            }

                                        </strong>


                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginTop:
                                                    "3px",
                                            }}
                                        >

                                            {
                                                auditDetails
                                                    ?.visit
                                                    ?.user
                                                    ?.email ||
                                                ""
                                            }

                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            padding:
                                                "12px",

                                            border:
                                                "1px solid #E5E7EB",

                                            borderRadius:
                                                "8px",

                                            background:
                                                "#F9FAFB",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginBottom:
                                                    "4px",
                                            }}
                                        >
                                            Site
                                        </div>


                                        <strong>

                                            {
                                                auditDetails
                                                    ?.visit
                                                    ?.site
                                                    ?.name ||
                                                "NA"
                                            }

                                        </strong>


                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginTop:
                                                    "3px",
                                            }}
                                        >

                                            {
                                                auditDetails
                                                    ?.visit
                                                    ?.site
                                                    ?.siteCode ||
                                                "NA"
                                            }

                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            padding:
                                                "12px",

                                            border:
                                                "1px solid #E5E7EB",

                                            borderRadius:
                                                "8px",

                                            background:
                                                "#F9FAFB",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginBottom:
                                                    "4px",
                                            }}
                                        >
                                            Submitted
                                        </div>


                                        <strong>

                                            {
                                                formatDate(
                                                    auditDetails?.submittedAt
                                                )
                                            }

                                        </strong>


                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginTop:
                                                    "3px",
                                            }}
                                        >

                                            {
                                                formatTime(
                                                    auditDetails?.submittedAt
                                                )
                                            }

                                        </div>

                                    </div>


                                    <div
                                        style={{
                                            padding:
                                                "12px",

                                            border:
                                                "1px solid #E5E7EB",

                                            borderRadius:
                                                "8px",

                                            background:
                                                "#F9FAFB",
                                        }}
                                    >

                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",

                                                color:
                                                    "#6B7280",

                                                marginBottom:
                                                    "4px",
                                            }}
                                        >
                                            Status
                                        </div>


                                        <span
                                            style={{
                                                display:
                                                    "inline-flex",

                                                alignItems:
                                                    "center",

                                                gap:
                                                    "5px",

                                                padding:
                                                    "5px 9px",

                                                borderRadius:
                                                    "999px",

                                                fontSize:
                                                    "12px",

                                                fontWeight:
                                                    700,

                                                ...getStatusBadgeStyle(
                                                    auditDetails
                                                        ?.visit
                                                        ?.status
                                                ),
                                            }}
                                        >

                                            {
                                                getAuditStatus(
                                                    auditDetails
                                                        ?.visit
                                                )
                                            }

                                        </span>

                                    </div>

                                </div>


                                {/* ==================================
                                    ANSWERS
                                ================================== */}

                                <div
                                    style={{
                                        border:
                                            "1px solid #E5E7EB",

                                        borderRadius:
                                            "8px",

                                        overflow:
                                            "hidden",
                                    }}
                                >

                                    <div
                                        style={{
                                            padding:
                                                "12px 14px",

                                            background:
                                                "#F9FAFB",

                                            borderBottom:
                                                "1px solid #E5E7EB",

                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        Audit Answers
                                    </div>


                                    <div
                                        style={{
                                            overflowX:
                                                "auto",
                                        }}
                                    >

                                        <table
                                            className="audit-question-table"
                                            style={{
                                                margin:
                                                    0,
                                            }}
                                        >

                                            <thead>

                                                <tr>

                                                    <th>
                                                        #
                                                    </th>

                                                    <th>
                                                        Question
                                                    </th>

                                                    <th>
                                                        Answer
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    (
                                                        auditDetails
                                                            ?.answers ||
                                                        []
                                                    ).map(
                                                        (
                                                            answer
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    answer.id
                                                                }
                                                            >

                                                                <td>

                                                                    <strong>

                                                                        {
                                                                            answer.questionNo
                                                                        }

                                                                    </strong>

                                                                </td>


                                                                <td>

                                                                    {
                                                                        answer.questionText ||
                                                                        "NA"
                                                                    }

                                                                </td>


                                                                <td>

                                                                    <span
                                                                        style={{
                                                                            display:
                                                                                "inline-flex",

                                                                            alignItems:
                                                                                "center",

                                                                            justifyContent:
                                                                                "center",

                                                                            minWidth:
                                                                                "70px",

                                                                            padding:
                                                                                "5px 10px",

                                                                            borderRadius:
                                                                                "999px",

                                                                            background:
                                                                                answer.booleanValue ===
                                                                                    true
                                                                                    ? "#DCFCE7"
                                                                                    : answer.booleanValue ===
                                                                                        false
                                                                                        ? "#FEE2E2"
                                                                                        : "#F3F4F6",

                                                                            color:
                                                                                answer.booleanValue ===
                                                                                    true
                                                                                    ? "#166534"
                                                                                    : answer.booleanValue ===
                                                                                        false
                                                                                        ? "#991B1B"
                                                                                        : "#4B5563",

                                                                            fontWeight:
                                                                                700,

                                                                            fontSize:
                                                                                "12px",
                                                                        }}
                                                                    >

                                                                        {
                                                                            getAnswerText(
                                                                                answer
                                                                            )
                                                                        }

                                                                    </span>

                                                                </td>

                                                            </tr>
                                                        )
                                                    )
                                                }


                                                {(
                                                    auditDetails
                                                        ?.answers ||
                                                    []
                                                ).length ===
                                                    0 && (

                                                        <tr>

                                                            <td
                                                                colSpan="3"
                                                                className="audit-empty-cell"
                                                            >
                                                                No audit answers found.
                                                            </td>

                                                        </tr>

                                                    )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>


                                {/* ==================================
                                    ACTION BUTTONS
                                ================================== */}

                                <div
                                    style={{
                                        display:
                                            "flex",

                                        justifyContent:
                                            "space-between",

                                        alignItems:
                                            "center",

                                        gap:
                                            "12px",

                                        marginTop:
                                            "18px",

                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    <button
                                        type="button"
                                        className="audit-secondary-btn"
                                        onClick={
                                            closeAuditDetails
                                        }
                                        disabled={
                                            auditActionLoading
                                        }
                                    >
                                        Close
                                    </button>


                                    <div
                                        style={{
                                            display:
                                                "flex",

                                            gap:
                                                "10px",

                                            flexWrap:
                                                "wrap",
                                        }}
                                    >

                                        {getAuditStatus(
                                            auditDetails?.visit
                                        ) !==
                                            "VERIFIED" && (

                                                <button
                                                    type="button"
                                                    className="audit-primary-btn"
                                                    onClick={() =>
                                                        updateAuditStatus(
                                                            "VERIFIED"
                                                        )
                                                    }
                                                    disabled={
                                                        auditActionLoading
                                                    }
                                                    style={{
                                                        display:
                                                            "inline-flex",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            "6px",

                                                        background:
                                                            "#16A34A",

                                                        borderColor:
                                                            "#16A34A",
                                                    }}
                                                >

                                                    <CheckCircle2
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    {
                                                        auditActionLoading
                                                            ? "Updating..."
                                                            : "Verify Audit"
                                                    }

                                                </button>
                                            )}


                                        {getAuditStatus(
                                            auditDetails?.visit
                                        ) !==
                                            "REJECTED" && (

                                                <button
                                                    type="button"
                                                    className="audit-primary-btn"
                                                    onClick={() =>
                                                        updateAuditStatus(
                                                            "REJECTED"
                                                        )
                                                    }
                                                    disabled={
                                                        auditActionLoading
                                                    }
                                                    style={{
                                                        display:
                                                            "inline-flex",

                                                        alignItems:
                                                            "center",

                                                        gap:
                                                            "6px",

                                                        background:
                                                            "#DC2626",

                                                        borderColor:
                                                            "#DC2626",
                                                    }}
                                                >

                                                    <XCircle
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    {
                                                        auditActionLoading
                                                            ? "Updating..."
                                                            : "Reject Audit"
                                                    }

                                                </button>
                                            )}

                                    </div>

                                </div>

                            </div>

                        ) : (

                            <div
                                style={{
                                    padding:
                                        "40px",

                                    textAlign:
                                        "center",

                                    color:
                                        "#6B7280",
                                }}
                            >
                                Audit details could not be loaded.
                            </div>

                        )}

                    </div>

                </div>
            )}

        </div>
    );
};


export default AuditManagement;
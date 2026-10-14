import { useEffect, useMemo, useState } from "react";
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
    Camera,
    Zap,
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import "./AuditManagement.css";

// 45 HDFC / MSF Audit Questions from aud.pdf
export const HDFC_45_QUESTIONS = [
    { questionNo: 1, question: "NUMBER OF EMPLOYEES", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 2, question: "ENTER GUARD DETAILS", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 3, question: "GROOMING & TURNOUT", type: "YES_NO", score: "3/ 3", photo: true, photoCount: 2, photoLabel: "Guard uniform & turnout photos", isRequired: true },
    { questionNo: 4, question: "ESS APP LOGIN STATUS", type: "YES_NO", score: "3/ 3", photo: true, photoCount: 1, photoLabel: "ESS App login screen photo", isRequired: true },
    { questionNo: 5, question: "UAN/ PF STATUS", type: "TEXT", score: "5/ 5", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 6, question: "ESIC", type: "TEXT", score: "5/ 5", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 7, question: "LAST MONTH SALARY RECEIVED", type: "YES_NO", score: "3/ 3", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 8, question: "KIT RECEIVED", type: "YES_NO", score: "2/ 2", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 9, question: "RENEWAL KIT RECEIVED", type: "YES_NO", score: "2/ 2", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 10, question: "SITE HOUSEKEEPING QUALITY", type: "YES_NO", score: "5/ 5", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 11, question: "LOBBY AREA", type: "YES_NO", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Lobby area photo", isRequired: true },
    { questionNo: 12, question: "MEETING ROOM", type: "YES_NO", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Meeting room photo", isRequired: true },
    { questionNo: 13, question: "PANTRY", type: "YES_NO", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Pantry photo", isRequired: true },
    { questionNo: 14, question: "WASH ROOM", type: "YES_NO", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Wash room photo", isRequired: true },
    { questionNo: 15, question: "CABINS", type: "YES_NO", score: "5/ 5", photo: true, photoCount: 1, photoLabel: "Cabins photo", isRequired: true },
    { questionNo: 16, question: "WORK STATIONS", type: "YES_NO", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Work stations photo", isRequired: true },
    { questionNo: 17, question: "COMMON AREA", type: "YES_NO", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Common area photo", isRequired: true },
    { questionNo: 18, question: "STORE ROOM", type: "YES_NO", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "Store room photo", isRequired: true },
    { questionNo: 19, question: "ATTENDANCE REGISTER", type: "YES_NO", score: "3/ 3", photo: true, photoCount: 1, photoLabel: "Attendance register page photo", isRequired: true },
    { questionNo: 20, question: "HK WASHROOM CHECKLIST", type: "YES_NO", score: "4/ 4", photo: true, photoCount: 1, photoLabel: "HK washroom checklist photo", isRequired: true },
    { questionNo: 21, question: "HK KYC DOCUMENT", type: "YES_NO", score: "2/ 2", photo: true, photoCount: 1, photoLabel: "HK KYC document photo", isRequired: true },
    { questionNo: 22, question: "OTHER", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 23, question: "KNOWLEDGE OF DUTY POST", type: "YES_NO", score: "2/ 2", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 24, question: "KNOWLEDGE OF DOCUMENTATION", type: "YES_NO", score: "2/ 2", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 25, question: "KNOWLEDGE OF FIRE SAFETY AND EMERGENCY SITUATION", type: "YES_NO", score: "5/ 5", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 26, question: "OTHER TRAINING", type: "YES_NO", score: "0/ 0", photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 27, question: "TRAINING TOPICS", type: "YES_NO", score: "10/ 10", photo: true, photoCount: 2, photoLabel: "Training session photos", isRequired: true },
    { questionNo: 28, question: "POST ORDER", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 29, question: "FED", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 30, question: "MEDICAL EMERGENCY", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 31, question: "FIRST AID AND CPR", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 32, question: "HANDING/TAKING OVER", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 33, question: "POSH", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 34, question: "OPEN SESSION", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 35, question: "DAILY USE EQUIPMENTS / CLEANING CHEMICAL", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 36, question: "PPE TRAINING", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 37, question: "DEEP CLEANING", type: "YES_NO", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 38, question: "CLIENT MET", type: "YES_NO", score: "3/ 3", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 39, question: "NAME", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 40, question: "DESIGNATION", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 41, question: "CLIENT FEEDBACK", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 42, question: "OBSERVATIONS", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 43, question: "ANY R & M WORK REQUIRED", type: "YES_NO", score: "3/ 3", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
    { questionNo: 44, question: "ANY OTHER OBSERVATIONS", type: "TEXT", score: null, photo: false, photoCount: 0, photoLabel: "", isRequired: false },
    { questionNo: 45, question: "INCIDENT RESPONSE", type: "YES_NO", score: "2/ 2", photo: false, photoCount: 0, photoLabel: "", isRequired: true },
];

const STORAGE_KEY = "audit_custom_questions_v6";
const DELETED_EXTRAS_KEY = "audit_deleted_extra_questions_v6";
const DELETED_STANDARDS_KEY = "audit_deleted_standard_questions_v6";

// Auto-renumber questions sequentially 1, 2, 3...
const renumberList = (list) => {
    return list.map((item, index) => ({
        ...item,
        questionNo: index + 1,
    }));
};

const saveToStorage = (list) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
};

const getFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading localStorage", e);
    }
    return null;
};

const saveDeletedExtras = (list) => {
    try {
        localStorage.setItem(DELETED_EXTRAS_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Error saving deleted extras", e);
    }
};

const getDeletedExtras = () => {
    try {
        const raw = localStorage.getItem(DELETED_EXTRAS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading deleted extras", e);
    }
    return [];
};

const saveDeletedStandards = (list) => {
    try {
        localStorage.setItem(DELETED_STANDARDS_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Error saving deleted standards", e);
    }
};

const getDeletedStandards = () => {
    try {
        const raw = localStorage.getItem(DELETED_STANDARDS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading deleted standards", e);
    }
    return [];
};

const EMPTY_FORM = {
    questionNo: "",
    question: "",
    type: "YES_NO",
    score: "",
    requiresPhoto: false,
    photoCount: 1,
    photoLabel: "",
    isRequired: true,
};

const AuditManagement = () => {
    // Initialize questions from local storage or HDFC defaults, always ensuring sequential numbering
    const [questions, setQuestions] = useState(() => {
        const deletedStandards = getDeletedStandards();
        const deletedExtras = getDeletedExtras();
        const localSaved = getFromStorage();

        if (Array.isArray(localSaved) && localSaved.length > 0) {
            const filtered = localSaved.filter((q) => {
                const no = Number(q.originalNo || q.questionNo);
                if (no <= 45 && deletedStandards.includes(no)) return false;
                if (no > 45 && deletedExtras.includes(no)) return false;
                return true;
            });
            return renumberList(filtered);
        }

        const base = HDFC_45_QUESTIONS
            .filter((q) => !deletedStandards.includes(q.questionNo))
            .map((q) => ({
                ...q,
                originalNo: q.questionNo,
                requiresPhoto: q.photo,
                isActive: true,
                isStandard: true,
                inDb: false,
            }));
        return renumberList(base);
    });

    const [templateId, setTemplateId] = useState(() => {
        return localStorage.getItem("audit_template_id") || null;
    });

    // Delete choice modal state
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Alerts
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const showError = (message) => {
        setError(message || "Something went wrong.");
        setSuccess("");
    };

    const showSuccess = (message) => {
        setSuccess(message || "Action successful.");
        setError("");
    };

    const clearAlerts = () => {
        setError("");
        setSuccess("");
    };

    // Helper to get active template ID
    const getOrFetchTemplateId = async () => {
        if (templateId) return templateId;
        const cached = localStorage.getItem("audit_template_id");
        if (cached) {
            setTemplateId(cached);
            return cached;
        }
        try {
            const res = await apiFetch("/api/audit/checklist");
            if (res.ok) {
                const b = await res.json();
                const tid = b?.data?.checklist?.id;
                if (tid) {
                    setTemplateId(tid);
                    localStorage.setItem("audit_template_id", tid);
                    return tid;
                }
            }
        } catch (e) {
            console.warn("Failed to get template id", e);
        }
        return null;
    };

    // Load Audit Checklist Questions from backend without dropping extra questions
    const loadQuestions = async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/api/audit/checklist");
            let serverQuestions = [];

            if (response.ok) {
                const body = await response.json();
                const tId = body?.data?.checklist?.id;
                if (tId) {
                    setTemplateId(tId);
                    localStorage.setItem("audit_template_id", tId);
                }
                serverQuestions = body?.data?.checklist?.questions || [];
            }

            const serverMap = {};
            serverQuestions.forEach((q) => {
                serverMap[Number(q.questionNo)] = q;
            });

            const deletedStandards = getDeletedStandards();
            const deletedExtras = getDeletedExtras();
            const localSaved = getFromStorage();

            let allQuestions = [];

            if (Array.isArray(localSaved) && localSaved.length > 0) {
                allQuestions = localSaved
                    .filter((q) => {
                        const origNo = Number(q.originalNo || q.questionNo);
                        if (origNo <= 45 && deletedStandards.includes(origNo)) return false;
                        if (origNo > 45 && deletedExtras.includes(origNo)) return false;
                        return true;
                    })
                    .map((q) => {
                        const origNo = Number(q.originalNo || q.questionNo);
                        const sQ = serverMap[origNo];
                        return {
                            ...q,
                            originalNo: origNo,
                            id: sQ?.id || q.id || (origNo <= 45 ? `hdfc-${origNo}` : `custom-${origNo}`),
                            inDb: Boolean(sQ?.id),
                        };
                    });
            } else {
                allQuestions = HDFC_45_QUESTIONS
                    .filter((base) => !deletedStandards.includes(base.questionNo))
                    .map((base) => {
                        const sQ = serverMap[base.questionNo];
                        return {
                            ...base,
                            originalNo: base.questionNo,
                            id: sQ?.id || `hdfc-${base.questionNo}`,
                            requiresPhoto: base.photo,
                            isActive: true,
                            isStandard: true,
                            inDb: Boolean(sQ?.id),
                        };
                    });
            }

            // Also capture server questions with questionNo > 45
            serverQuestions.forEach((sQ) => {
                const no = Number(sQ.questionNo);
                if (no > 45 && !deletedExtras.includes(no) && !allQuestions.some((q) => Number(q.originalNo || q.questionNo) === no)) {
                    allQuestions.push({
                        id: sQ.id,
                        originalNo: no,
                        questionNo: no,
                        question: sQ.question,
                        type: sQ.type || "YES_NO",
                        score: null,
                        requiresPhoto: false,
                        photo: false,
                        photoCount: 0,
                        photoLabel: "",
                        isRequired: sQ.isRequired !== false,
                        isActive: sQ.isActive !== false,
                        isStandard: false,
                        inDb: true,
                    });
                }
            });

            // Ensure sequential numbering without gaps (e.g. 1, 2, 3, 4...)
            const renumbered = renumberList(allQuestions);
            setQuestions(renumbered);
            saveToStorage(renumbered);
        } catch (err) {
            console.error("Load questions error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Restore ONLY the 45 standard questions to default; deleted extra questions are NOT restored
    const handleSync45 = async () => {
        const confirmed = window.confirm(
            "⚡ RESTORE 45 STANDARD QUESTIONS:\n\nKya aap sabhi 45 Standard HDFC questions ko unke default roop me restore/sync karna chahte hain?\n\n• Standard 1 se 45 questions unke default form me restore ho jayenge (1 se 45 numbering ke sath).\n• Extra questions jo aapne delete kiye the wo KABHI restore nahi honge.\n• Active extra questions safe rahenge."
        );
        if (!confirmed) return;

        try {
            setSaving(true);
            clearAlerts();

            // Clear deleted standards list so all 1..45 come back to default
            saveDeletedStandards([]);

            const activeTemplateId = await getOrFetchTemplateId();

            // Keep any currently active extra questions that have not been deleted
            const deletedExtras = getDeletedExtras();
            const currentActiveExtras = questions.filter(
                (q) => Number(q.originalNo || q.questionNo) > 45 && !deletedExtras.includes(Number(q.originalNo || q.questionNo))
            );

            // Reconstruct the 45 clean default questions
            const default45 = HDFC_45_QUESTIONS.map((base) => ({
                ...base,
                originalNo: base.questionNo,
                id: `hdfc-${base.questionNo}`,
                requiresPhoto: base.photo,
                isActive: true,
                isStandard: true,
                inDb: false,
            }));

            // Consolidated list: 45 standard defaults + any active extra questions
            const combined = [...default45, ...currentActiveExtras];
            const renumbered = renumberList(combined);

            // Update UI & LocalStorage immediately
            setQuestions(renumbered);
            saveToStorage(renumbered);

            // Sync 45 standard questions to backend database
            let existingMap = {};
            try {
                const res = await apiFetch("/api/audit/checklist");
                if (res.ok) {
                    const b = await res.json();
                    const sQuestions = b?.data?.checklist?.questions || [];
                    sQuestions.forEach((sq) => {
                        existingMap[Number(sq.questionNo)] = sq;
                    });
                }
            } catch (e) {
                console.warn(e);
            }

            let syncedCount = 0;
            for (const item of HDFC_45_QUESTIONS) {
                const existing = existingMap[item.questionNo];
                const payload = {
                    questionNo: item.questionNo,
                    question: item.question,
                    type: item.type,
                    isRequired: item.isRequired,
                    isActive: true,
                };

                if (existing && existing.id) {
                    let upRes = null;
                    if (activeTemplateId) {
                        try {
                            upRes = await apiFetch(`/api/audit/${activeTemplateId}/questions/${existing.id}`, {
                                method: "PUT",
                                body: JSON.stringify(payload),
                            });
                        } catch (e) { }
                    }
                    if (!upRes || !upRes.ok) {
                        await apiFetch(`/api/audit/checklist/questions/${existing.id}`, {
                            method: "PUT",
                            body: JSON.stringify(payload),
                        });
                    }
                    syncedCount++;
                } else {
                    let createRes = null;
                    if (activeTemplateId) {
                        try {
                            createRes = await apiFetch(`/api/audit/${activeTemplateId}/questions`, {
                                method: "POST",
                                body: JSON.stringify(payload),
                            });
                        } catch (e) { }
                    }
                    if (!createRes || !createRes.ok) {
                        await apiFetch("/api/audit/checklist/questions", {
                            method: "POST",
                            body: JSON.stringify(payload),
                        });
                    }
                    syncedCount++;
                }
            }

            showSuccess("🎉 Saare 45 Standard Questions default form me restore ho gaye! (Deleted extra questions restore nahi hue).");
            await loadQuestions();
        } catch (err) {
            console.error("Sync error:", err);
            showError("Failed to sync audit questions to server.");
        } finally {
            setSaving(false);
        }
    };


    // Top Refresh Button with user feedback
    const refreshCurrentSection = async () => {
        clearAlerts();
        await loadQuestions();
        showSuccess("Checklist refreshed successfully from server.");
    };

    // TOGGLE QUESTION STATUS (Active / Inactive) DIRECTLY FROM STATUS BADGE
    const toggleQuestionStatus = async (question) => {
        clearAlerts();
        const currentActive = question.isActive !== false;
        const newActive = !currentActive;

        // 1. Immediately update in UI state & localStorage
        setQuestions((prev) => {
            const next = prev.map((q) =>
                q.questionNo === question.questionNo || q.id === question.id
                    ? { ...q, isActive: newActive }
                    : q
            );
            saveToStorage(next);
            return next;
        });

        showSuccess(`Question #${question.questionNo} status changed to ${newActive ? "ACTIVE" : "INACTIVE"}.`);

        // 2. Sync to backend asynchronously
        if (question.id && !String(question.id).startsWith("local-") && !String(question.id).startsWith("hdfc-") && !String(question.id).startsWith("custom-")) {
            try {
                const activeTemplateId = await getOrFetchTemplateId();
                const payload = {
                    questionNo: question.questionNo,
                    question: question.question,
                    type: question.type,
                    isRequired: question.isRequired,
                    isActive: newActive,
                };
                if (activeTemplateId) {
                    await apiFetch(`/api/audit/${activeTemplateId}/questions/${question.id}`, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    });
                }
            } catch (e) {
                console.warn("Backend status update error:", e);
            }
        }
    };

    // Open Delete Choice Modal
    const openDeleteChoiceModal = (question) => {
        clearAlerts();
        setDeleteTarget(question);
    };

    // ACTION 1 FROM MODAL: SET INACTIVE
    const handleSetInactive = async (question) => {
        clearAlerts();
        setDeleteTarget(null);

        setQuestions((prev) => {
            const next = prev.map((q) =>
                q.questionNo === question.questionNo || q.id === question.id
                    ? { ...q, isActive: false }
                    : q
            );
            saveToStorage(next);
            return next;
        });

        showSuccess(`Question #${question.questionNo} is now set to INACTIVE.`);

        if (question.id && !String(question.id).startsWith("local-") && !String(question.id).startsWith("hdfc-") && !String(question.id).startsWith("custom-")) {
            try {
                const activeTemplateId = await getOrFetchTemplateId();
                if (activeTemplateId) {
                    await apiFetch(`/api/audit/${activeTemplateId}/questions/${question.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            questionNo: question.questionNo,
                            question: question.question,
                            type: question.type,
                            isRequired: question.isRequired,
                            isActive: false,
                        }),
                    });
                }
            } catch (e) {
                console.warn("Backend inactive error:", e);
            }
        }
    };

    // ACTION 2 FROM MODAL: PERMANENT DELETE (REMOVES & AUTO-RENUMBERS REMAINING QUESTIONS)
    const handlePermanentDelete = async (question) => {
        clearAlerts();
        setDeleteTarget(null);
        const origNo = Number(question.originalNo || question.questionNo);
        const isStd = origNo <= 45;

        // 1. Remove from list and AUTOMATICALLY RENUMBER all remaining questions sequentially (e.g. 2 becomes 1)
        setQuestions((prev) => {
            const filtered = prev.filter((q) => q.id !== question.id && Number(q.questionNo) !== Number(question.questionNo));
            const renumbered = renumberList(filtered);
            saveToStorage(renumbered);
            return renumbered;
        });

        // 2. Track deletion: standard vs extra
        if (isStd) {
            const delStd = getDeletedStandards();
            if (!delStd.includes(origNo)) {
                delStd.push(origNo);
                saveDeletedStandards(delStd);
            }
        } else {
            const delExt = getDeletedExtras();
            if (!delExt.includes(origNo)) {
                delExt.push(origNo);
                saveDeletedExtras(delExt);
            }
        }

        showSuccess(`Question #${question.questionNo} permanently deleted & remaining questions automatically renumbered!`);

        // 3. Call backend delete if has valid DB id
        if (question.id && !String(question.id).startsWith("local-") && !String(question.id).startsWith("hdfc-") && !String(question.id).startsWith("custom-")) {
            try {
                const activeTemplateId = await getOrFetchTemplateId();
                if (activeTemplateId) {
                    await apiFetch(`/api/audit/${activeTemplateId}/questions/${question.id}`, {
                        method: "DELETE",
                    });
                }
            } catch (err) {
                console.warn("Backend delete notice:", err);
            }
        }
    };

    // Open Add Modal
    const openAddQuestion = () => {
        clearAlerts();
        // Next sequential number
        const nextQuestionNo = questions.length + 1;

        setEditingQuestion(null);
        setForm({
            questionNo: String(nextQuestionNo),
            question: "",
            type: "YES_NO",
            score: "",
            requiresPhoto: false,
            photoCount: 1,
            photoLabel: "",
            isRequired: true,
        });
        setShowModal(true);
    };

    // Open Edit Modal
    const openEditQuestion = (question) => {
        clearAlerts();
        setEditingQuestion(question);

        setForm({
            questionNo: String(question.questionNo || ""),
            question: question.question || "",
            type: question.type || "YES_NO",
            score: question.score || "",
            requiresPhoto: Boolean(question.requiresPhoto || question.photo),
            photoCount: question.photoCount || 1,
            photoLabel: question.photoLabel || "",
            isRequired: question.isRequired !== false,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditingQuestion(null);
        setForm(EMPTY_FORM);
    };

    // Save Question (Create or Edit)
    const saveQuestion = async (event) => {
        event.preventDefault();
        clearAlerts();

        const trimmedQuestion = form.question.trim();
        const numericQuestionNo = Number(form.questionNo);

        if (!numericQuestionNo || numericQuestionNo <= 0) {
            showError("Question number must be a valid positive integer.");
            return;
        }

        if (!trimmedQuestion) {
            showError("Question text cannot be empty.");
            return;
        }

        const isEdit = Boolean(editingQuestion);
        const targetId = editingQuestion?.id;

        const updatedItem = {
            id: targetId || `custom-${Date.now()}`,
            originalNo: editingQuestion?.originalNo || (numericQuestionNo > 45 ? numericQuestionNo : Date.now()),
            questionNo: numericQuestionNo,
            question: trimmedQuestion,
            type: form.type,
            score: form.score ? form.score.trim() : null,
            requiresPhoto: Boolean(form.requiresPhoto),
            photo: Boolean(form.requiresPhoto),
            photoCount: form.requiresPhoto ? Number(form.photoCount) || 1 : 0,
            photoLabel: form.requiresPhoto ? (form.photoLabel || "").trim() : "",
            isRequired: Boolean(form.isRequired),
            isActive: true,
            isStandard: editingQuestion?.isStandard !== undefined ? editingQuestion.isStandard : (numericQuestionNo <= 45),
            inDb: editingQuestion?.inDb || false,
        };

        // 1. INSTANTLY update state & localStorage in frontend
        setQuestions((prevQuestions) => {
            let nextList;
            if (isEdit) {
                nextList = prevQuestions.map((q) =>
                    q.questionNo === editingQuestion.questionNo || q.id === targetId
                        ? { ...q, ...updatedItem }
                        : q
                );
            } else {
                nextList = [...prevQuestions.filter((q) => q.questionNo !== numericQuestionNo), updatedItem];
            }
            nextList.sort((a, b) => a.questionNo - b.questionNo);
            saveToStorage(nextList);
            return nextList;
        });

        showSuccess(isEdit ? `Question #${numericQuestionNo} updated successfully!` : `Question #${numericQuestionNo} added successfully!`);
        closeModal();

        // 2. Sync to backend asynchronously
        try {
            setSaving(true);
            const activeTemplateId = await getOrFetchTemplateId();
            const backendPayload = {
                questionNo: numericQuestionNo,
                question: trimmedQuestion,
                type: form.type,
                isRequired: form.isRequired,
            };

            let response = null;
            if (isEdit && targetId && !String(targetId).startsWith("local-") && !String(targetId).startsWith("hdfc-") && !String(targetId).startsWith("custom-")) {
                if (activeTemplateId) {
                    try {
                        response = await apiFetch(`/api/audit/${activeTemplateId}/questions/${targetId}`, {
                            method: "PUT",
                            body: JSON.stringify(backendPayload),
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }
                if (!response || !response.ok) {
                    try {
                        response = await apiFetch(`/api/audit/checklist/questions/${targetId}`, {
                            method: "PUT",
                            body: JSON.stringify(backendPayload),
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }
            } else {
                if (activeTemplateId) {
                    try {
                        response = await apiFetch(`/api/audit/${activeTemplateId}/questions`, {
                            method: "POST",
                            body: JSON.stringify(backendPayload),
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }
                if (!response || !response.ok) {
                    try {
                        response = await apiFetch("/api/audit/checklist/questions", {
                            method: "POST",
                            body: JSON.stringify(backendPayload),
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }

            if (response && response.ok) {
                const body = await response.json();
                const serverQ = body?.data?.question;
                if (serverQ?.id) {
                    setQuestions((prev) => {
                        const updated = prev.map((q) =>
                            q.questionNo === numericQuestionNo ? { ...q, id: serverQ.id, inDb: true } : q
                        );
                        saveToStorage(updated);
                        return updated;
                    });
                }
            }
        } catch (err) {
            console.warn("Backend save notice:", err);
        } finally {
            setSaving(false);
        }
    };

    // Open Audit Details Modal
    const openAuditDetails = async (audit) => {
        clearAlerts();
        setSelectedAudit(audit);
        setAuditDetails(null);

        try {
            setAuditDetailLoading(true);
            const response = await apiFetch(`/api/audit/submissions/${audit.id}`);
            if (!response.ok) return;

            const body = await response.json();
            setAuditDetails(body?.data?.submission || body?.data?.audit || audit);
        } catch (err) {
            console.error("Open audit details error:", err);
            showError("Failed to fetch audit details.");
        } finally {
            setAuditDetailLoading(false);
        }
    };

    const closeAuditDetails = () => {
        setSelectedAudit(null);
        setAuditDetails(null);
    };

    // Verify / Reject Audit
    const updateAuditStatus = async (auditId, status) => {
        clearAlerts();
        try {
            setAuditActionLoading(true);
            const response = await apiFetch(`/api/audit/submissions/${auditId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            if (!response.ok) return;

            showSuccess(`Audit status updated to ${status}.`);
            closeAuditDetails();
            await loadSubmittedAudits();
        } catch (err) {
            console.error("Update audit status error:", err);
            showError("Failed to update audit status.");
        } finally {
            setAuditActionLoading(false);
        }
    };

    return (
        <div className="audit-management-page">
            {/* Header */}
            <section className="audit-page-header">
                <div className="audit-page-title">
                    <div className="audit-page-icon">
                        <ClipboardCheck size={24} />
                    </div>
                    <div>
                        <h1>Audit Management</h1>
                        <p>Manage site audit checklist questions & review submitted supervisor audits</p>
                    </div>
                </div>

                <div className="audit-header-actions">
                    <button
                        type="button"
                        className="audit-secondary-btn"
                        onClick={refreshCurrentSection}
                        disabled={loading || saving}
                        title="Reload questions from server"
                    >
                        <RefreshCw size={16} />
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>

                    <button
                        type="button"
                        className="audit-primary-btn"
                        style={{ background: "#15803D", borderColor: "#15803D" }}
                        onClick={handleSync45}
                        disabled={saving || loading}
                        title="Reset 45 standard HDFC Questions to default (extra deleted questions will NOT be restored)"
                    >
                        <Zap size={16} />
                        {saving ? "Restoring..." : "⚡ Sync / Reset 45 Questions"}
                    </button>

                    <button
                        type="button"
                        className="audit-primary-btn"
                        onClick={openAddQuestion}
                        disabled={saving}
                    >
                        <Plus size={17} /> Add Question
                    </button>
                </div>
            </section>

            {/* Alerts */}
            {error && <div className="audit-alert audit-alert-error">{error}</div>}
            {success && <div className="audit-alert audit-alert-success">{success}</div>}
            {/* CHECKLIST SECTION */}

            <section className="audit-checklist-card">
                <div className="audit-card-header">
                    <div>
                        <h2>Audit Questions Checklist</h2>
                        <span>{questions.length} questions in checklist (Sequential 1 to {questions.length})</span>
                    </div>
                </div>

                <div className="audit-info-box">
                    <ClipboardCheck size={18} />
                    <div>
                        <strong>Questions shown to supervisors during site audits</strong>
                        <p>
                            <strong>Status Toggle:</strong> Kisi bhi question ka <code>ACTIVE / INACTIVE</code> status badalne ke liye Status badge par click karein.<br />
                            <strong>Auto-Renumbering:</strong> Kisi question ko permanent delete karne par baaki questions automatically renumber (jaise 2 banega 1) ho jayenge.
                        </p>
                    </div>
                </div>

                <div className="audit-question-table-wrap">
                    <table className="audit-question-table">
                        <thead>
                            <tr>
                                <th style={{ width: "50px" }}>#</th>
                                <th>Question</th>
                                <th style={{ width: "110px" }}>Answer Type</th>
                                <th style={{ width: "110px" }}>Score</th>
                                <th style={{ width: "230px" }}>Photo Required on 'Yes'</th>
                                <th style={{ width: "90px" }}>Required</th>
                                <th style={{ width: "110px" }}>Status (Click to Toggle)</th>
                                <th style={{ width: "100px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && questions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="audit-empty-cell">
                                        Loading audit questions...
                                    </td>
                                </tr>
                            ) : questions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="audit-empty-cell">
                                        No audit questions found. Click 'Add Question' or '⚡ Sync / Reset 45 Questions'.
                                    </td>
                                </tr>
                            ) : (
                                questions.map((question) => {
                                    const isText = question.type === "TEXT";
                                    const hasPhoto = Boolean(question.requiresPhoto || question.photo);
                                    const photoCount = question.photoCount || 1;
                                    const photoLabel = question.photoLabel || "";
                                    const scoreVal = question.score;
                                    const isActive = question.isActive !== false;

                                    return (
                                        <tr
                                            key={question.id || question.questionNo}
                                            style={{ opacity: isActive ? 1 : 0.65 }}
                                        >
                                            <td>
                                                <strong>{question.questionNo}</strong>
                                            </td>

                                            <td className="audit-question-text" style={{ textDecoration: isActive ? "none" : "line-through" }}>
                                                {question.question}
                                            </td>

                                            <td>
                                                <span
                                                    className="audit-type-badge"
                                                    style={{
                                                        background: isText ? "#F3E8FF" : "#EEF2FF",
                                                        color: isText ? "#6B21A8" : "#3730A3",
                                                    }}
                                                >
                                                    {isText ? "TEXT" : "YES / NO"}
                                                </span>
                                            </td>

                                            <td>
                                                {scoreVal ? (
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "3px 8px",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            background: "#DCFCE7",
                                                            color: "#15803D",
                                                        }}
                                                    >
                                                        {scoreVal}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#9CA3AF" }}>—</span>
                                                )}
                                            </td>

                                            <td>
                                                {hasPhoto ? (
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px",
                                                            padding: "3px 8px",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            background: "#FEF3C7",
                                                            color: "#92400E",
                                                            border: "1px solid #FDE68A",
                                                        }}
                                                    >
                                                        <Camera size={13} />
                                                        {photoCount} Photo{photoCount > 1 ? "s" : ""}: {photoLabel || "Required"}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#9CA3AF" }}>No</span>
                                                )}
                                            </td>

                                            <td>
                                                {question.isRequired ? "Yes" : "No"}
                                            </td>

                                            {/* INTERACTIVE STATUS BADGE (CLICK TO TOGGLE ACTIVE / INACTIVE) */}
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleQuestionStatus(question)}
                                                    title="Click to toggle ACTIVE / INACTIVE"
                                                    style={{
                                                        cursor: "pointer",
                                                        border: "none",
                                                        padding: "5px 12px",
                                                        borderRadius: "999px",
                                                        fontWeight: 700,
                                                        fontSize: "11px",
                                                        letterSpacing: "0.5px",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        background: isActive ? "#DCFCE7" : "#FEE2E2",
                                                        color: isActive ? "#15803D" : "#B91C1C",
                                                        transition: "all 0.15s ease",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: "7px",
                                                            height: "7px",
                                                            borderRadius: "50%",
                                                            background: isActive ? "#16A34A" : "#DC2626",
                                                        }}
                                                    />
                                                    {isActive ? "ACTIVE" : "INACTIVE"}
                                                </button>
                                            </td>

                                            <td>
                                                <div className="audit-action-buttons">
                                                    <button
                                                        type="button"
                                                        className="audit-icon-btn"
                                                        title="Edit question"
                                                        onClick={() => openEditQuestion(question)}
                                                        disabled={saving}
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="audit-icon-btn danger"
                                                        title="Delete / Deactivate question"
                                                        onClick={() => openDeleteChoiceModal(question)}
                                                        disabled={saving}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* DELETE CHOICE MODAL (Set Inactive vs Permanently Delete) */}
            {deleteTarget && (
                <div className="audit-modal-backdrop" onClick={() => setDeleteTarget(null)}>
                    <div className="audit-modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="audit-modal-header">
                            <div>
                                <h2>Question #{deleteTarget.questionNo} Action</h2>
                                <p style={{ marginTop: "4px", color: "#334155", fontWeight: 600 }}>
                                    "{deleteTarget.question}"
                                </p>
                            </div>
                            <button type="button" className="audit-modal-close" onClick={() => setDeleteTarget(null)}>
                                ×
                            </button>
                        </div>

                        <div style={{ padding: "20px" }}>
                            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#475569" }}>
                                Aap is question ke sath kya karna chahte hain?
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {/* Option 1: Set Inactive */}
                                <div
                                    onClick={() => handleSetInactive(deleteTarget)}
                                    style={{
                                        padding: "14px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #FCD34D",
                                        background: "#FEFCE8",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: "13px", color: "#92400E", display: "block", marginBottom: "2px" }}>
                                            🟡 Set as Inactive
                                        </strong>
                                        <span style={{ fontSize: "12px", color: "#78350F" }}>
                                            Question list me rahega par audit me supervisors ko nahi dikhega.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="audit-secondary-btn"
                                        style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E", fontSize: "12px", minHeight: "32px", flexShrink: 0 }}
                                    >
                                        Set Inactive
                                    </button>
                                </div>

                                {/* Option 2: Permanently Delete */}
                                <div
                                    onClick={() => handlePermanentDelete(deleteTarget)}
                                    style={{
                                        padding: "14px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #FECACA",
                                        background: "#FEF2F2",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: "13px", color: "#B91C1C", display: "block", marginBottom: "2px" }}>
                                            🔴 Permanently Delete (Auto-Renumber)
                                        </strong>
                                        <span style={{ fontSize: "12px", color: "#991B1B" }}>
                                            List se bilkul hat jayega aur baaki questions automatically renumber ho jayenge (jaise 2 banega 1).
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="audit-primary-btn"
                                        style={{ background: "#DC2626", borderColor: "#DC2626", fontSize: "12px", minHeight: "32px", flexShrink: 0 }}
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>

                            <div className="audit-modal-footer" style={{ marginTop: "20px" }}>
                                <button type="button" className="audit-secondary-btn" onClick={() => setDeleteTarget(null)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="audit-modal-backdrop" onClick={closeModal}>
                    <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="audit-modal-header">
                            <div>
                                <h2>{editingQuestion ? `Edit Question #${form.questionNo}` : "Add Audit Question"}</h2>
                                <p>Set question number, title, answer type, score, and photo requirement on YES.</p>
                            </div>
                            <button type="button" className="audit-modal-close" onClick={closeModal} disabled={saving}>
                                ×
                            </button>
                        </div>

                        <form className="audit-form" onSubmit={saveQuestion}>
                            <div className="audit-form-grid">
                                <div className="audit-form-field">
                                    <label>Question Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.questionNo}
                                        onChange={(e) => setForm({ ...form, questionNo: e.target.value })}
                                        disabled={saving}
                                        required
                                    />
                                </div>

                                <div className="audit-form-field">
                                    <label>Answer Type</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        disabled={saving}
                                        style={{
                                            width: "100%",
                                            padding: "10px 11px",
                                            border: "1px solid var(--border-color, #d7dce5)",
                                            borderRadius: "7px",
                                            background: "var(--input-bg, #ffffff)",
                                            color: "var(--text-primary, #172033)",
                                            fontSize: "13px",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="YES_NO">YES / NO</option>
                                        <option value="TEXT">TEXT (Free input)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="audit-form-field">
                                <label>Question Text *</label>
                                <textarea
                                    value={form.question}
                                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                                    placeholder="e.g. GROOMING & TURNOUT or LOBBY AREA"
                                    disabled={saving}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="audit-form-grid">
                                <div className="audit-form-field">
                                    <label>Max Score (optional)</label>
                                    <input
                                        type="text"
                                        value={form.score}
                                        onChange={(e) => setForm({ ...form, score: e.target.value })}
                                        placeholder="e.g. 5/ 5, 3/ 3, 2/ 2"
                                        disabled={saving}
                                    />
                                </div>

                                <div className="audit-form-field">
                                    <label>Photo Required on 'Yes'</label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", fontWeight: "normal" }}>
                                        <input
                                            type="checkbox"
                                            checked={form.requiresPhoto}
                                            onChange={(e) => setForm({ ...form, requiresPhoto: e.target.checked })}
                                            disabled={saving}
                                            style={{ width: "16px", height: "16px", accentColor: "#2563EB" }}
                                        />
                                        <span>Require Photo on YES</span>
                                    </label>
                                </div>
                            </div>

                            {form.requiresPhoto && (
                                <div className="audit-form-grid" style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", marginBottom: "16px", border: "1px dashed #CBD5E1" }}>
                                    <div className="audit-form-field" style={{ marginBottom: 0 }}>
                                        <label>Number of Photos</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={form.photoCount}
                                            onChange={(e) => setForm({ ...form, photoCount: Number(e.target.value) || 1 })}
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="audit-form-field" style={{ marginBottom: 0 }}>
                                        <label>Photo Label / Instructions</label>
                                        <input
                                            type="text"
                                            value={form.photoLabel}
                                            onChange={(e) => setForm({ ...form, photoLabel: e.target.value })}
                                            placeholder="e.g. Guard uniform photos, Lobby photo"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="audit-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={form.isRequired}
                                    onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                                    disabled={saving}
                                />
                                <span>Is this question mandatory?</span>
                            </label>

                            <div className="audit-modal-footer">
                                <button type="button" className="audit-secondary-btn" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="audit-primary-btn" disabled={saving}>
                                    {saving ? "Saving..." : editingQuestion ? "Update Question" : "Create Question"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditManagement;

import { useState } from "react";
import { useParams } from "react-router-dom";
import {
    ChevronLeft,
    CheckCircle2,
    Shield,
    Camera,
    PenTool,
    Loader2,
} from "lucide-react";
import { PUBLIC_API_BASE } from "../../utils/publicConfig";
import duckminiLogo from "../../assets/duckmini-logo.png";
import "./PublicFeedback.css";

const FEEDBACK_QUESTIONS = [
    { id: 1, key: "clientName", label: "Client Representative Name*", type: "text", placeholder: "Enter Details" },
    { id: 2, key: "designation", label: "Designation*", type: "text", placeholder: "Enter Details" },
    { id: 3, key: "employeeCode", label: "Employee Code*", type: "text", placeholder: "Enter Details" },
    {
        id: 4,
        key: "serviceType",
        label: "Type of Service*",
        type: "select",
        options: ["Security Guarding", "Housekeeping", "Facility Management", "Executive Protection", "Integrated Services", "Other"],
    },
    {
        id: 5,
        key: "uniformTools",
        label: "Are Uniform, Accessories and Tools provided as per Job Role?*",
        type: "select",
        options: ["Yes", "No", "Partially"],
    },
    {
        id: 6,
        key: "skillsProficiency",
        label: "Are skills, knowledge and tech. proficiency as per Job Role?*",
        type: "select",
        options: ["Excellent", "Good", "Average", "Needs Improvement"],
    },
    {
        id: 7,
        key: "softSkillsBehavior",
        label: "Assessment of soft skills, behaviour and conduct while on duty?*",
        type: "select",
        options: ["Excellent", "Good", "Average", "Poor"],
    },
    {
        id: 8,
        key: "trainingAssessment",
        label: "Training Assessment*",
        type: "select",
        options: ["Satisfactory", "Adequate", "Needs Training", "Poor"],
    },
    {
        id: 9,
        key: "dutiesSOP",
        label: "Duties as per SOP and site processes?*",
        type: "select",
        options: ["Followed Strictly", "Followed Mostly", "Needs Guidance", "Not Followed"],
    },
    {
        id: 10,
        key: "supervisionMonitoring",
        label: "How is Site Supervision and Operations Monitoring?*",
        type: "select",
        options: ["Excellent", "Regular & Prompt", "Irregular", "Poor"],
    },
    {
        id: 11,
        key: "overallPerformance",
        label: "Overall Performance Assessment*",
        type: "select",
        options: ["Outstanding", "Exceeds Expectations", "Meets Expectations", "Needs Improvement"],
    },
    { id: 12, key: "recommendations", label: "Any Other Recommendations*", type: "text", placeholder: "Enter Details" },
];

export default function PublicFeedback() {
    const { visitId } = useParams();

    const [currentStep, setCurrentStep] = useState(1); // 1 = Checklist, 2 = Review & Submit, 3 = Success
    const [answers, setAnswers] = useState({});
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const API_BASE_URL = PUBLIC_API_BASE;

    const handleInputChange = (key, value) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
        setErrorMsg("");
    };

    const handleNext = () => {
        // Validate required questions (1 to 11 are strictly required, 12 is recommendation)
        for (let i = 0; i < 11; i++) {
            const q = FEEDBACK_QUESTIONS[i];
            const val = answers[q.key];
            if (!val || String(val).trim() === "") {
                setErrorMsg(`Please answer question #${q.id}: ${q.label.replace("*", "")}`);
                return;
            }
        }
        setErrorMsg("");
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setErrorMsg("");

            const payload = {
                visitId,
                answers,
                submittedAt: new Date().toISOString(),
            };

            const res = await fetch(
                `${API_BASE_URL}/api/public/feedback/${encodeURIComponent(visitId)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Failed to submit feedback");
            }

            setCurrentStep(3); // Success Screen
        } catch (err) {
            console.error("Feedback submit error:", err);
            setErrorMsg(err.message || "Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-page-wrapper">
            <div className="feedback-app-container">
                {/* DUCKMINI BRAND HEADER */}
                <header className="feedback-brand-banner">
                    <div className="brand-logo-title-row">
                        <div className="duckmini-brand-logo-wrap">
                            <img
                                src={duckminiLogo}
                                alt="DuckMini — One Platform. Total Visibility."
                            />
                        </div>
                    </div>

                    <h1 className="feedback-banner-title">Client Feedback Form</h1>

                    {/* STEP PROGRESS BAR */}
                    <div className="feedback-stepper-progress">
                        <div className={`progress-segment ${currentStep >= 1 ? "active" : ""}`}></div>
                        <div className={`progress-segment ${currentStep >= 2 ? "active" : ""}`}></div>
                    </div>
                </header>

                {/* STEP 1: CHECKLIST (12 QUESTIONS) */}
                {currentStep === 1 && (
                    <main className="feedback-step-content">
                        <div className="step-title-row">
                            <span className="step-badge-num">1</span>
                            <div className="step-label-group">
                                <h2>Checklist</h2>
                                <p>12 evaluation questions</p>
                            </div>
                        </div>

                        {errorMsg && <div className="feedback-error-alert">{errorMsg}</div>}

                        <div className="feedback-questions-list">
                            {FEEDBACK_QUESTIONS.map((q) => (
                                <div key={q.id} className="feedback-question-card">
                                    <div className="q-card-top-indicator">
                                        <span className="q-circle-num">{q.id}</span>
                                        <label className="q-card-label">{q.label}</label>
                                    </div>

                                    {q.type === "text" ? (
                                        <input
                                            type="text"
                                            className="feedback-text-input"
                                            placeholder={q.placeholder}
                                            value={answers[q.key] || ""}
                                            onChange={(e) => handleInputChange(q.key, e.target.value)}
                                        />
                                    ) : (
                                        <select
                                            className="feedback-select-input"
                                            value={answers[q.key] || ""}
                                            onChange={(e) => handleInputChange(q.key, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {q.options?.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* STICKY BOTTOM BUTTON */}
                        <div className="feedback-sticky-footer">
                            <button type="button" className="btn-feedback-next" onClick={handleNext}>
                                Next
                            </button>
                        </div>
                    </main>
                )}

                {/* STEP 2: REVIEW & SUBMIT */}
                {currentStep === 2 && (
                    <main className="feedback-step-content">
                        <div className="step-title-row">
                            <div className="step-badge-check">
                                <CheckCircle2 size={16} />
                            </div>
                            <div className="step-label-group">
                                <h2>Review & Submit</h2>
                                <p>Confirm evaluation responses</p>
                            </div>
                        </div>

                        {errorMsg && <div className="feedback-error-alert">{errorMsg}</div>}

                        <div className="review-summary-card">
                            <div className="card-section-header">Section 1 - Responses</div>
                            <div className="review-rows-list">
                                {FEEDBACK_QUESTIONS.map((q) => (
                                    <div key={q.id} className="review-summary-row">
                                        <span className="review-q-name">{q.label.replace("*", "")}</span>
                                        <strong className="review-q-val">{answers[q.key] || "-"}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="review-summary-card" style={{ marginTop: "16px" }}>
                            <div className="card-section-header">Verification & Media</div>
                            <div className="review-rows-list">
                                <div className="review-summary-row">
                                    <span className="review-q-name">Photographs</span>
                                    <strong className="review-q-val">Verified at Site</strong>
                                </div>
                                <div className="review-summary-row">
                                    <span className="review-q-name">Client Representative</span>
                                    <strong className="review-q-val">{answers.clientName || "Representative"}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="feedback-sticky-footer split">
                            <button
                                type="button"
                                className="btn-feedback-back"
                                onClick={() => setCurrentStep(1)}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                type="button"
                                className="btn-feedback-submit"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 size={18} className="btn-spinner" /> : "Submit Feedback"}
                            </button>
                        </div>
                    </main>
                )}

                {/* STEP 3: SUCCESS CONFIRMATION SCREEN */}
                {currentStep === 3 && (
                    <main className="feedback-step-content success-screen">
                        <div className="success-icon-circle">
                            <CheckCircle2 size={44} color="#16a34a" />
                        </div>

                        <h2>Thank You for Your Feedback!</h2>
                        <p>
                            Your valuable review has been recorded successfully. DuckMini appreciates your partnership and commitment to quality service.
                        </p>

                        <div className="soc-support-box">
                            <strong>Security Operations Centre (SOC)</strong>
                            <span>Toll Free Helpline: 1800 202 5500</span>
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}
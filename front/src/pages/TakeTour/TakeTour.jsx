import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    Gauge,
    LayoutDashboard,
    Map,
    MapPin,
    Settings,
    ShieldCheck,
    Target,
    Users,
    X,
} from "lucide-react";

import "./TakeTour.css";

const tourSteps = [
    {
        id: 1,
        icon: LayoutDashboard,
        title: "Dashboard",
        description:
            "Get a quick overview of your field operations from one place.",
        details: [
            "Audit completion and verification overview",
            "Field force online and offline status",
            "Visit and check-in overview",
            "Task progress and operational alerts",
            "Recent visits and attention-required items",
        ],
    },
    {
        id: 2,
        icon: Map,
        title: "Field Tracker",
        description:
            "Monitor your field force and understand their current availability.",
        details: [
            "View online field force",
            "View offline users",
            "Identify low-battery devices",
            "Track field force on the map",
            "Find users who have not checked in",
        ],
    },
    {
        id: 3,
        icon: ClipboardCheck,
        title: "Check In & Check Out",
        description:
            "Monitor field attendance, working hours and travel distance.",
        details: [
            "View latest check-ins",
            "Check check-in and check-out times",
            "Review working hours",
            "Monitor distance travelled",
            "Identify attendance-related issues",
        ],
    },
    {
        id: 4,
        icon: MapPin,
        title: "Visits",
        description:
            "Review field visits and verify submitted visit reports.",
        details: [
            "View latest visits",
            "Review visit date and time",
            "Open submitted reports",
            "Identify verified and unverified visits",
            "Review site and client information",
        ],
    },
    {
        id: 5,
        icon: Target,
        title: "Task Management",
        description:
            "Create, assign, monitor and manage tasks for your field force.",
        details: [
            "View task dashboard",
            "Review task summary",
            "Schedule individual tasks",
            "Schedule bulk tasks",
            "Cancel and reassign bulk tasks",
            "Review task details",
            "Create and manage campaigns",
        ],
    },
    {
        id: 6,
        icon: Gauge,
        title: "Distance Report",
        description:
            "Review the distance travelled by field users during their work.",
        details: [
            "View field force members",
            "Review contact information",
            "Check total distance travelled",
            "Search field force records",
            "Export distance report data",
        ],
    },
    {
        id: 7,
        icon: BarChart3,
        title: "Reports",
        description:
            "Analyze operational activity and generate management reports.",
        details: [
            "Audit reports",
            "Visit reports",
            "Task reports",
            "Attendance and check-in information",
            "Field force activity",
            "Exportable management data",
        ],
    },
    {
        id: 8,
        icon: Settings,
        title: "Settings",
        description:
            "Manage users and sites used throughout the field operation.",
        details: [
            "Manage field users",
            "Manage sites",
            "Search users by employee ID or phone",
            "Manage active and inactive users",
            "Update user information",
            "Manage site information",
        ],
    },
    {
        id: 9,
        icon: ShieldCheck,
        title: "Security",
        description:
            "Keep your Super Admin account protected with account security controls.",
        details: [
            "Change your account password",
            "Use strong passwords",
            "Protect administrative access",
            "Keep account credentials private",
        ],
    },
];

const TakeTour = () => {
    const [currentStep, setCurrentStep] =
        useState(0);

    const [tourFinished, setTourFinished] =
        useState(false);

    const step = tourSteps[currentStep];

    const Icon = step.icon;

    const totalSteps = tourSteps.length;

    const progress =
        ((currentStep + 1) / totalSteps) * 100;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(
                (previous) => previous + 1
            );

            return;
        }

        setTourFinished(true);
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(
                (previous) => previous - 1
            );
        }
    };

    const handleSkip = () => {
        setTourFinished(true);
    };

    const handleRestart = () => {
        setCurrentStep(0);
        setTourFinished(false);
    };

    if (tourFinished) {
        return (
            <div className="take-tour-page">

                <div className="tour-complete-card">

                    <div className="tour-complete-icon">
                        <CheckCircle2 size={45} />
                    </div>

                    <h1>
                        You're All Set!
                    </h1>

                    <p>
                        You have completed the Super Admin
                        portal tour. You can now use the
                        dashboard to manage your field
                        operations.
                    </p>

                    <div className="tour-complete-summary">

                        <div>
                            <strong>
                                {totalSteps}
                            </strong>

                            <span>
                                Modules Covered
                            </span>
                        </div>

                        <div>
                            <strong>
                                Super Admin
                            </strong>

                            <span>
                                Access Level
                            </span>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="tour-restart-button"
                        onClick={handleRestart}
                    >
                        START TOUR AGAIN
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="take-tour-page">

            <section className="take-tour-card">

                {/* =========================
            TOP
        ========================= */}

                <div className="tour-top">

                    <div className="tour-heading">

                        <div className="tour-main-icon">
                            <ShieldCheck size={24} />
                        </div>

                        <div>
                            <h1>
                                Super Admin Portal Tour
                            </h1>

                            <p>
                                Learn how to manage your field
                                operations from one place.
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="tour-close-button"
                        onClick={handleSkip}
                        title="Skip Tour"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* =========================
            PROGRESS
        ========================= */}

                <div className="tour-progress-section">

                    <div className="tour-progress-info">

                        <span>
                            Step {currentStep + 1} of{" "}
                            {totalSteps}
                        </span>

                        <strong>
                            {Math.round(progress)}%
                        </strong>

                    </div>

                    <div className="tour-progress-bar">

                        <span
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>

                </div>

                {/* =========================
            CONTENT
        ========================= */}

                <div className="tour-content">

                    {/* LEFT SIDE */}

                    <div className="tour-step-navigation">

                        {tourSteps.map(
                            (tourStep, index) => {
                                const StepIcon =
                                    tourStep.icon;

                                return (
                                    <button
                                        type="button"
                                        key={tourStep.id}
                                        className={`tour-step-item ${index === currentStep
                                                ? "active"
                                                : ""
                                            } ${index < currentStep
                                                ? "completed"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setCurrentStep(index)
                                        }
                                    >

                                        <div className="tour-step-number">

                                            {index <
                                                currentStep ? (
                                                <CheckCircle2
                                                    size={16}
                                                />
                                            ) : (
                                                <StepIcon size={16} />
                                            )}

                                        </div>

                                        <span>
                                            {tourStep.title}
                                        </span>

                                    </button>
                                );
                            }
                        )}

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="tour-step-content">

                        <div className="tour-step-icon">

                            <Icon size={36} />

                        </div>

                        <div className="tour-step-number-label">
                            MODULE {currentStep + 1}
                        </div>

                        <h2>
                            {step.title}
                        </h2>

                        <p className="tour-description">
                            {step.description}
                        </p>

                        <div className="tour-details">

                            <h3>
                                What you can do
                            </h3>

                            <div className="tour-detail-list">

                                {step.details.map(
                                    (detail, index) => (
                                        <div
                                            className="tour-detail-item"
                                            key={index}
                                        >
                                            <CheckCircle2
                                                size={16}
                                            />

                                            <span>
                                                {detail}
                                            </span>
                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </div>

                {/* =========================
            FOOTER
        ========================= */}

                <div className="tour-footer">

                    <button
                        type="button"
                        className="tour-skip-button"
                        onClick={handleSkip}
                    >
                        SKIP TOUR
                    </button>

                    <div className="tour-navigation-buttons">

                        <button
                            type="button"
                            className="tour-previous-button"
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                        >
                            <ArrowLeft size={16} />
                            PREVIOUS
                        </button>

                        <button
                            type="button"
                            className="tour-next-button"
                            onClick={handleNext}
                        >
                            {currentStep === totalSteps - 1
                                ? "FINISH TOUR"
                                : "NEXT"}

                            {currentStep !==
                                totalSteps - 1 && (
                                    <ArrowRight size={16} />
                                )}
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
};

export default TakeTour;
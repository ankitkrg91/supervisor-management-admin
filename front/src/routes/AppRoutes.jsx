import { lazy, Suspense } from "react";

import {
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";

const AdminLayout = lazy(
    () => import("../components/layout/AdminLayout")
);

const Login = lazy(
    () => import("../pages/Login/Login")
);

const Dashboard = lazy(
    () => import("../pages/Dashboard/Dashboard")
);


const Online = lazy(
    () => import("../pages/FieldTracker/Online")
);

const TrackFieldForce = lazy(
    () => import("../pages/FieldTracker/TrackFieldForce")
);

const Offline = lazy(
    () => import("../pages/FieldTracker/Offline")
);

const BatteryLowPage = lazy(
    () => import("../pages/FieldTracker/BatteryLow")
);

const NotCheckedIn = lazy(
    () => import("../pages/FieldTracker/NotCheckedIn")
);

const LatestCheckIn = lazy(
    () => import("../pages/CheckInCheckOut/LatestCheckIn")
);

const LatestVisits = lazy(
    () => import("../pages/Visits/LatestVisits")
);

const VerifiedUnverifiedVisit = lazy(
    () => import("../pages/Visits/VerifiedUnverifiedVisit")
);

const TaskDashboard = lazy(
    () => import("../pages/Tasks/Dashboard")
);

const TaskSummary = lazy(
    () => import("../pages/Tasks/TaskSummary")
);

const ScheduleTask = lazy(
    () => import("../pages/Tasks/ScheduleTask")
);

const ScheduleBulkTask = lazy(
    () => import("../pages/Tasks/ScheduleBulkTask")
);

const CancelBulkTask = lazy(
    () => import("../pages/Tasks/CancelBulkTask")
);

const ReassignTask = lazy(
    () => import("../pages/Tasks/ReassignTask")
);

const ReassignBulkTask = lazy(
    () => import("../pages/Tasks/ReassignBulkTask")
);

const TaskDetails = lazy(
    () => import("../pages/Tasks/TaskDetails")
);

const CreateCampaign = lazy(
    () => import("../pages/Tasks/CreateCampaign")
);

const Campaign = lazy(
    () => import("../pages/Tasks/Campaign")
);

const DistanceReport = lazy(
    () => import("../pages/DistanceReport/DistanceReport")
);

const Reports = lazy(
    () => import("../pages/Reports/Reports")
);

const Settings = lazy(
    () => import("../pages/Settings/Settings")
);

const ChangePassword = lazy(
    () => import("../pages/ChangePassword/ChangePassword")
);

const TakeTour = lazy(
    () => import("../pages/TakeTour/TakeTour")
);

const PublicAuditView = lazy(
    () => import("../pages/Public/PublicAuditView")
);

const PublicFeedback = lazy(
    () => import("../pages/Public/PublicFeedback")
);

// Lightweight loading screen
const RouteLoading = () => (
    <div
        role="status"
        aria-live="polite"
        style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "var(--bg-primary, #f6f8fb)",
            color: "var(--text-primary, #172033)",
            fontSize: "14px",
        }}
    >
        Loading page...
    </div>
);

// Protected Admin routes
const ProtectedRoutes = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Suspense fallback={<RouteLoading />}>
            <AdminLayout>
                <Routes>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/field-tracker/online"
                        element={<Online />}
                    />

                    <Route
                        path="/field-tracker/offline"
                        element={<Offline />}
                    />

                    <Route
                        path="/field-tracker/battery-low"
                        element={<BatteryLowPage />}
                    />

                    <Route
                        path="/field-tracker/track"
                        element={<TrackFieldForce />}
                    />

                    <Route
                        path="/field-tracker/not-checked-in"
                        element={<NotCheckedIn />}
                    />

                    <Route
                        path="/check-in/latest"
                        element={<LatestCheckIn />}
                    />

                    <Route
                        path="/visits/latest"
                        element={<LatestVisits />}
                    />

                    <Route
                        path="/visits/verified"
                        element={<VerifiedUnverifiedVisit />}
                    />

                    <Route
                        path="/tasks/dashboard"
                        element={<TaskDashboard />}
                    />

                    <Route
                        path="/tasks/summary"
                        element={<TaskSummary />}
                    />

                    <Route
                        path="/tasks/schedule"
                        element={<ScheduleTask />}
                    />

                    <Route
                        path="/tasks/schedule-bulk"
                        element={<ScheduleBulkTask />}
                    />

                    <Route
                        path="/tasks/cancel-bulk"
                        element={<CancelBulkTask />}
                    />

                    <Route
                        path="/tasks/reassign"
                        element={<ReassignTask />}
                    />

                    <Route
                        path="/tasks/reassign-bulk"
                        element={<ReassignBulkTask />}
                    />

                    <Route
                        path="/tasks/details"
                        element={<TaskDetails />}
                    />

                    <Route
                        path="/tasks/create-campaign"
                        element={<CreateCampaign />}
                    />

                    <Route
                        path="/tasks/campaign"
                        element={<Campaign />}
                    />

                    <Route
                        path="/distance-report"
                        element={<DistanceReport />}
                    />

                    <Route
                        path="/reports"
                        element={<Reports />}
                    />

                    <Route
                        path="/settings"
                        element={<Settings />}
                    />

                    <Route
                        path="/change-password"
                        element={<ChangePassword />}
                    />

                    <Route
                        path="/take-tour"
                        element={<TakeTour />}
                    />

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />
                </Routes>
            </AdminLayout>
        </Suspense>
    );
};

// Main application routes
const AppRoutes = () => {
    // Re-render when the URL changes, including after logout.
    useLocation();

    const token = localStorage.getItem("token");

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    token ? (
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    ) : (
                        <Suspense fallback={<RouteLoading />}>
                            <Login />
                        </Suspense>
                    )
                }
            />

            {/* Public pages: no login required */}
            <Route
                path="/audit-view/:visitId"
                element={
                    <Suspense fallback={<RouteLoading />}>
                        <PublicAuditView />
                    </Suspense>
                }
            />

            <Route
                path="/feedback/:visitId"
                element={
                    <Suspense fallback={<RouteLoading />}>
                        <PublicFeedback />
                    </Suspense>
                }
            />

            <Route
                path="/*"
                element={<ProtectedRoutes />}
            />
        </Routes>
    );
};

export default AppRoutes;
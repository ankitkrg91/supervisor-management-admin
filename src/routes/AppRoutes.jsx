import {
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";

import AuditManagement from "../pages/AuditManagement/AuditManagement";

import Login from "../pages/Login/Login";

import Online from "../pages/FieldTracker/Online";
import TrackFieldForce from "../pages/FieldTracker/TrackFieldForce";
import Offline from "../pages/FieldTracker/Offline";
import BatteryLowPage from "../pages/FieldTracker/BatteryLow";
import NotCheckedIn from "../pages/FieldTracker/NotCheckedIn";

import LatestCheckIn from "../pages/CheckInCheckOut/LatestCheckIn";

import LatestVisits from "../pages/Visits/LatestVisits";
import VerifiedUnverifiedVisit from "../pages/Visits/VerifiedUnverifiedVisit";

import Dashboard from "../pages/Dashboard/Dashboard";

import TaskDashboard from "../pages/Tasks/Dashboard";
import TaskSummary from "../pages/Tasks/TaskSummary";
import ScheduleTask from "../pages/Tasks/ScheduleTask";
import ScheduleBulkTask from "../pages/Tasks/ScheduleBulkTask";
import CancelBulkTask from "../pages/Tasks/CancelBulkTask";
import ReassignTask from "../pages/Tasks/ReassignTask";
import ReassignBulkTask from "../pages/Tasks/ReassignBulkTask";
import TaskDetails from "../pages/Tasks/TaskDetails";
import CreateCampaign from "../pages/Tasks/CreateCampaign";
import Campaign from "../pages/Tasks/Campaign";

import DistanceReport from "../pages/DistanceReport/DistanceReport";
import Reports from "../pages/Reports/Reports";

import Settings from "../pages/Settings/Settings";
import ChangePassword from "../pages/ChangePassword/ChangePassword";
import TakeTour from "../pages/TakeTour/TakeTour";


// ============================================================
// PROTECTED ROUTES
// ============================================================

const ProtectedRoutes = () => {
    const token = localStorage.getItem("token");

    // No token = not logged in
    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return (
        <AdminLayout>
            <Routes>

                {/* =================================================
                    DASHBOARD
                ================================================= */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />


                {/* =================================================
                    FIELD TRACKER
                ================================================= */}

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


                {/* =================================================
                    CHECK IN / CHECK OUT
                ================================================= */}

                <Route
                    path="/check-in/latest"
                    element={<LatestCheckIn />}
                />


                {/* =================================================
                    VISITS
                ================================================= */}

                <Route
                    path="/visits/latest"
                    element={<LatestVisits />}
                />

                <Route
                    path="/visits/verified"
                    element={<VerifiedUnverifiedVisit />}
                />


                {/* =================================================
                    TASKS
                ================================================= */}

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


                {/* =================================================
                    OTHER PAGES
                ================================================= */}

                <Route
                    path="/distance-report"
                    element={<DistanceReport />}
                />

                <Route
                    path="/reports"
                    element={<Reports />}
                />

                <Route
                    path="/audit-management"
                    element={<AuditManagement />}
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


                {/* =================================================
                    DEFAULT PROTECTED ROUTE
                ================================================= */}

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
    );
};


// ============================================================
// APP ROUTES
// ============================================================

const AppRoutes = () => {
    useLocation();
    const token = localStorage.getItem("token");

    return (
        <Routes>

            {/* =================================================
                LOGIN
            ================================================= */}

            <Route
                path="/login"
                element={
                    token ? (
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    ) : (
                        <Login />
                    )
                }
            />


            {/* =================================================
                EVERYTHING ELSE = PROTECTED
            ================================================= */}

            <Route
                path="/*"
                element={<ProtectedRoutes />}
            />

        </Routes>
    );
};

export default AppRoutes;
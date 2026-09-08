import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
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
import ReassignBulkTask from "../pages/Tasks/ReassignBulkTask";
import TaskDetails from "../pages/Tasks/TaskDetails";
import CreateCampaign from "../pages/Tasks/CreateCampaign";
import Campaign from "../pages/Tasks/Campaign";

import DistanceReport from "../pages/DistanceReport/DistanceReport";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import ChangePassword from "../pages/ChangePassword/ChangePassword";
import TakeTour from "../pages/TakeTour/TakeTour";


const ProtectedRoutes = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <AdminLayout>
            <Routes>

                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                {/* Field Tracker */}
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

                {/* Check In & Check Out */}
                <Route
                    path="/check-in/latest"
                    element={<LatestCheckIn />}
                />

                {/* Visits */}
                <Route
                    path="/visits/latest"
                    element={<LatestVisits />}
                />

                <Route
                    path="/visits/verified"
                    element={<VerifiedUnverifiedVisit />}
                />

                {/* Tasks */}
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

                {/* Other pages */}
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

                {/* Default */}
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />

            </Routes>
        </AdminLayout>
    );
};


const AppRoutes = () => {
    return (
        <Routes>

            {/* Public route */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Protected application */}
            <Route
                path="/*"
                element={<ProtectedRoutes />}
            />

        </Routes>
    );
};


export default AppRoutes;
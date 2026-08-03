import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import GenerateReports from "./pages/report/GenerateReports.jsx";
import UserDetails from "./pages/report/UserDetails.jsx";
import SearchMerchant from "./pages/report/SearchMerchant.jsx";
import CallbackDetails from "./pages/report/CallbackDetails.jsx";
import DispositionDetails from "./pages/report/DispositionDetails.jsx";
import AdvisorTimeshare from "./pages/report/AdvisorTimeshare.jsx";
import ActivitySummary from "./pages/report/ActivitySummary.jsx";
import AdvisorLiveStatus from "./pages/report/AdvisorLiveStatus.jsx";
import AdvisorPerformance from "./pages/report/AdvisorPerformance.jsx";
import ActivityPerformance from "./pages/report/ActivityPerformance.jsx";
import AgentCrmActivity from "./pages/report/AgentCrmActivity.jsx";

import ActivityGenerateReport from "./pages/activity/GenerateReport.jsx";
import AddNewActivity from "./pages/activity/AddNewActivity.jsx";
import ManageDispositions from "./pages/activity/ManageDispositions.jsx";
import ManageActivity from "./pages/activity/ManageActivity.jsx";
import PendingDataAutoAssign from "./pages/activity/PendingDataAutoAssign.jsx";

import QualityGenerateReport from "./pages/quality/GenerateReport.jsx";
import AuditCallQuality from "./pages/quality/AuditCallQuality.jsx";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/report/generate" element={<GenerateReports />} />
        <Route path="/report/user-details" element={<UserDetails />} />
        <Route path="/report/search-merchant" element={<SearchMerchant />} />
        <Route path="/report/callback-details" element={<CallbackDetails />} />
        <Route path="/report/disposition-details" element={<DispositionDetails />} />
        <Route path="/report/advisor-timeshare" element={<AdvisorTimeshare />} />
        <Route path="/report/activity-summary" element={<ActivitySummary />} />
        <Route path="/report/advisor-live-status" element={<AdvisorLiveStatus />} />
        <Route path="/report/advisor-performance" element={<AdvisorPerformance />} />
        <Route path="/report/activity-performance" element={<ActivityPerformance />} />
        <Route path="/report/agent-crm-activity" element={<AgentCrmActivity />} />

        <Route path="/activity/generate-report" element={<ActivityGenerateReport />} />
        <Route path="/activity/add-new" element={<AddNewActivity />} />
        <Route path="/activity/manage-dispositions" element={<ManageDispositions />} />
        <Route path="/activity/manage-activity" element={<ManageActivity />} />
        <Route path="/activity/pending-auto-assign" element={<PendingDataAutoAssign />} />

        <Route path="/quality/generate-report" element={<QualityGenerateReport />} />
        <Route path="/quality/audit-call-quality" element={<AuditCallQuality />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

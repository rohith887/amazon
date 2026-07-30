import { requireAuth } from "./auth.js";
import { el } from "./dom.js";
import { renderSidebar } from "./components/sidebar.js";
import { renderTopbar } from "./components/topbar.js";
import { renderFooter } from "./components/footer.js";
import { registerRoute, setDefaultRoute, onRouteChange, currentPath, startRouter } from "./router.js";

import { renderDashboard } from "./pages/dashboard.js";
import { renderGenerateReports } from "./pages/report/generateReports.js";
import { renderUserDetails } from "./pages/report/userDetails.js";
import { renderSearchMerchant } from "./pages/report/searchMerchant.js";
import { renderCallbackDetails } from "./pages/report/callbackDetails.js";
import { renderDispositionDetails } from "./pages/report/dispositionDetails.js";
import { renderAdvisorTimeshare } from "./pages/report/advisorTimeshare.js";
import { renderActivitySummary } from "./pages/report/activitySummary.js";
import { renderAdvisorLiveStatus } from "./pages/report/advisorLiveStatus.js";
import { renderAdvisorPerformance } from "./pages/report/advisorPerformance.js";
import { renderActivityPerformance } from "./pages/report/activityPerformance.js";
import { renderAgentCrmActivity } from "./pages/report/agentCrmActivity.js";

import { renderActivityGenerateReport } from "./pages/activity/generateReport.js";
import { renderAddNewActivity } from "./pages/activity/addNewActivity.js";
import { renderManageDispositions } from "./pages/activity/manageDispositions.js";
import { renderManageActivity } from "./pages/activity/manageActivity.js";
import { renderPendingDataAutoAssign } from "./pages/activity/pendingDataAutoAssign.js";

import { renderQualityGenerateReport } from "./pages/quality/generateReport.js";
import { renderAuditCallQuality } from "./pages/quality/auditCallQuality.js";

requireAuth();

const app = document.getElementById("app");

const pageRoot = el("div", { id: "page-root" });
const pageInner = el("div", { class: "page-inner" }, [pageRoot]);
const pageScroll = el("main", { class: "page-scroll" }, [pageInner]);
const topbar = renderTopbar(currentPath());
const appMain = el("div", { class: "app-main" }, [topbar, pageScroll, renderFooter()]);
const sidebar = renderSidebar(currentPath());

app.append(sidebar, appMain);

onRouteChange((path) => {
  sidebar.updateActive(path);
  topbar.updateTitle(path);
  pageScroll.scrollTop = 0;
});

registerRoute("/dashboard", renderDashboard);

registerRoute("/report/generate", renderGenerateReports);
registerRoute("/report/user-details", renderUserDetails);
registerRoute("/report/search-merchant", renderSearchMerchant);
registerRoute("/report/callback-details", renderCallbackDetails);
registerRoute("/report/disposition-details", renderDispositionDetails);
registerRoute("/report/advisor-timeshare", renderAdvisorTimeshare);
registerRoute("/report/activity-summary", renderActivitySummary);
registerRoute("/report/advisor-live-status", renderAdvisorLiveStatus);
registerRoute("/report/advisor-performance", renderAdvisorPerformance);
registerRoute("/report/activity-performance", renderActivityPerformance);
registerRoute("/report/agent-crm-activity", renderAgentCrmActivity);

registerRoute("/activity/generate-report", renderActivityGenerateReport);
registerRoute("/activity/add-new", renderAddNewActivity);
registerRoute("/activity/manage-dispositions", renderManageDispositions);
registerRoute("/activity/manage-activity", renderManageActivity);
registerRoute("/activity/pending-auto-assign", renderPendingDataAutoAssign);

registerRoute("/quality/generate-report", renderQualityGenerateReport);
registerRoute("/quality/audit-call-quality", renderAuditCallQuality);

setDefaultRoute("/dashboard");
startRouter();

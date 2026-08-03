export const NAV = [
  { label: "Dashboard", path: "/dashboard" },
  {
    label: "Report",
    path: "/report",
    children: [
      { label: "Generate Reports", path: "/report/generate" },
      { label: "User Details", path: "/report/user-details" },
      { label: "Search Merchant-ID", path: "/report/search-merchant" },
      { label: "Callback Details", path: "/report/callback-details" },
      { label: "Disposition Details", path: "/report/disposition-details" },
      { label: "Advisor Timeshare", path: "/report/advisor-timeshare" },
      { label: "Activity Summary", path: "/report/activity-summary" },
      { label: "Advisor Live Status", path: "/report/advisor-live-status" },
      { label: "Advisor Performance", path: "/report/advisor-performance" },
      { label: "Activity Performance", path: "/report/activity-performance" },
      { label: "Agent CRM Activity", path: "/report/agent-crm-activity" },
    ],
  },
  {
    label: "Activity",
    path: "/activity",
    children: [
      { label: "Generate Report", path: "/activity/generate-report" },
      { label: "Add New Activity", path: "/activity/add-new" },
      { label: "Manage Dispositions", path: "/activity/manage-dispositions" },
      { label: "Manage Activity", path: "/activity/manage-activity" },
      { label: "Pending Data Auto Assign", path: "/activity/pending-auto-assign" },
    ],
  },
  {
    label: "Quality",
    path: "/quality",
    children: [
      { label: "Generate Report", path: "/quality/generate-report" },
      { label: "Audit Call Quality", path: "/quality/audit-call-quality" },
    ],
  },
];

export function findNavLabel(path) {
  for (const section of NAV) {
    if (section.path === path) return section.label;
    for (const child of section.children ?? []) {
      if (child.path === path) return child.label;
    }
  }
  return "";
}

export function findBreadcrumb(path) {
  for (const section of NAV) {
    if (section.path === path) return [section.label];
    for (const child of section.children ?? []) {
      if (child.path === path) return [section.label, child.label];
    }
  }
  return [];
}

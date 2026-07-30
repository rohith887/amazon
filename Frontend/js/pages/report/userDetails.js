import { mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { button } from "../../components/button.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

export async function renderUserDetails(container) {
  const columns = [
    { key: "teamLeaderName", header: "Team Leader Name" },
    { key: "userName", header: "User Name" },
    { key: "alias", header: "Alias" },
    { key: "sipId", header: "SIP ID" },
    { key: "empId", header: "Emp ID" },
    { key: "email", header: "Email ID" },
    { key: "lobActivity", header: "LOB (Activity)" },
    { key: "fetchStrategy", header: "Fetch Strategy" },
    {
      key: "enabled",
      header: "Enabled",
      sortValue: (r) => (r.enabled ? 1 : 0),
      render: (r) => badge(r.enabled ? "Active" : "InActive", r.enabled ? "success" : "neutral"),
    },
    {
      key: "role",
      header: "Roles (Location)",
      sortValue: (r) => r.role,
      render: (r) => `${r.role} (${r.location})`,
    },
  ];

  const table = dataTable({ columns, rows: [], loading: true, exportFileName: "user-details" });

  const c = card([
    cardHeader("Users Details", [
      button({ label: "List Users", variant: "secondary", size: "sm" }),
      button({ label: "Add New User", variant: "success", size: "sm" }),
      button({ label: "Manage User", variant: "danger", size: "sm" }),
    ]),
    table,
  ]);

  mount(container, c);

  const users = await api.get("/report/users");
  table.setData(
    users.map((u) => ({ id: u.id, teamLeaderName: u.teamLeaderName, userName: u.userName, alias: u.alias, sipId: u.sipId, empId: u.empId, email: u.email, lobActivity: u.lobActivity, fetchStrategy: u.fetchStrategy, enabled: u.enabled, role: u.role, location: u.location })),
  );
}

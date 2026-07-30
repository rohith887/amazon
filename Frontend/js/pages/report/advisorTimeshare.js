import { mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, setSelectOptions } from "../../components/field.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

export async function renderAdvisorTimeshare(container) {
  let activity = "all";

  const activityField = selectField({ value: activity, options: [{ label: "All Activities", value: "all" }], onChange: (v) => { activity = v; load(); } });
  activityField.style.width = "220px";

  const countBadge = badge("Advisor Count: 0", "brand");

  const columns = [
    { key: "advisor", header: "Advisor" },
    { key: "teamLeader", header: "Team Leader" },
    { key: "interactionCount", header: "Interaction Count", align: "right" },
    { key: "completeCount", header: "Complete Count", align: "right" },
    { key: "closedCount", header: "Closed Count", align: "right" },
    { key: "interactionsPerHour", header: "Interactions Per Hour", align: "right" },
    { key: "completePerHour", header: "Complete PerHour", align: "right" },
    { key: "completePercentage", header: "Complete Percentage", align: "right" },
    { key: "idleTimePercentage", header: "IdleTime Percentage", align: "right" },
    { key: "loginTime", header: "Login Time", align: "right" },
    { key: "interactionTime", header: "Interaction Time", align: "right" },
    { key: "idleTime", header: "Idle Time", align: "right" },
    { key: "lunchBreak", header: "Lunch Break", align: "right" },
    { key: "teaBreak", header: "Tea Break", align: "right" },
    { key: "briefing", header: "Briefing", align: "right" },
  ];

  const table = dataTable({ columns, rows: [], loading: true, exportFileName: "advisor-timeshare" });

  mount(container, card([cardHeader("Advisor Timeshare", [activityField, countBadge]), table]));

  async function load() {
    table.setData([], true);
    const data = await api.get("/report/advisor-timeshare", { activity });
    setSelectOptions(activityField, [{ label: "All Activities", value: "all" }, ...data.activities]);
    activityField.select.value = activity;
    countBadge.textContent = `Advisor Count: ${data.advisorCount}`;
    table.setData(data.rows);
  }

  await load();
}

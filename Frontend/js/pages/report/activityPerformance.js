import { mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { legendBar } from "../../components/legendBar.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

const LEGEND_ITEMS = [
  { abbr: "AD", full: "Advisor Assigned" },
  { abbr: "AL", full: "Allocated Records" },
  { abbr: "FR", full: "Fresh/Untouched Records" },
  { abbr: "INT", full: "Interactions Completed" },
  { abbr: "CL", full: "Closed Records" },
  { abbr: "COMP", full: "Successfully Completed Records" },
  { abbr: "COMP %", full: "Complete %" },
];

export async function renderActivityPerformance(container) {
  const lastUpdatedBadge = badge("Last Updated : —", "brand");

  const table = dataTable({
    columns: [
      { key: "activity", header: "Activity" },
      { key: "ad", header: "AD", align: "right" },
      { key: "al", header: "AL", align: "right" },
      { key: "fr", header: "FR", align: "right" },
      { key: "int", header: "INT", align: "right" },
      { key: "cl", header: "CL", align: "right" },
      { key: "comp", header: "COMP", align: "right" },
      { key: "compPercentage", header: "COMP %", align: "right", render: (r) => r.compPercentage.toFixed(2) },
    ],
    rows: [],
    loading: true,
    exportFileName: "activity-performance",
  });

  mount(container, card([cardHeader("Activity Performance", [lastUpdatedBadge]), legendBar(LEGEND_ITEMS), table]));

  const data = await api.get("/report/activity-performance");
  lastUpdatedBadge.textContent = `Last Updated : ${data.lastUpdatedMinutesAgo} min ago`;
  table.setData(data.rows);
}

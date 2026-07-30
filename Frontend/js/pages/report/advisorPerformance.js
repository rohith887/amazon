import { mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { legendBar } from "../../components/legendBar.js";
import { dataTable } from "../../components/dataTable.js";

const LEGEND_ITEMS = [
  { abbr: "AL", full: "Allocated Records" },
  { abbr: "FR", full: "Fresh/Untouched Records" },
  { abbr: "PR", full: "Processed Records" },
  { abbr: "INT", full: "Interactions Completed" },
  { abbr: "CL", full: "Closed Records" },
  { abbr: "COMP", full: "Successfully Completed Records" },
  { abbr: "PCB", full: "Pending Callbacks" },
];

export async function renderAdvisorPerformance(container) {
  const table = dataTable({
    columns: [
      { key: "advisor", header: "Advisor" },
      { key: "lobName", header: "LOB" },
      { key: "prPercentage", header: "PR %", align: "right", render: (r) => `${r.prPercentage.toFixed(2)}%` },
      { key: "al", header: "AL", align: "right" },
      { key: "fr", header: "FR", align: "right" },
      { key: "pr", header: "PR", align: "right" },
      { key: "int", header: "INT", align: "right" },
      { key: "cl", header: "CL", align: "right" },
      { key: "comp", header: "COMP", align: "right" },
      { key: "pcb", header: "PCB", align: "right" },
    ],
    rows: [],
    loading: true,
    exportFileName: "advisor-performance",
  });

  mount(container, card([cardHeader("Advisor Live Performance Status"), legendBar(LEGEND_ITEMS), table]));

  const rows = await api.get("/report/advisor-performance");
  table.setData(rows);
}

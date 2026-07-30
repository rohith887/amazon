import { mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, setSelectOptions } from "../../components/field.js";
import { dataTable } from "../../components/dataTable.js";

export async function renderActivitySummary(container) {
  let activity = "";

  const activityField = selectField({ placeholder: "Select Activity", options: [], onChange: (v) => { activity = v; load(); } });
  activityField.style.width = "240px";

  const table = dataTable({
    columns: [
      { key: "priority", header: "Priority" },
      { key: "cnumber", header: "cnumber" },
      { key: "cheader", header: "cheader" },
      { key: "total", header: "Total", align: "right" },
      { key: "fetched", header: "Fetched", align: "right" },
      { key: "pending", header: "Pending", align: "right" },
    ],
    rows: [],
    exportFileName: "activity-summary",
    emptyHint: "Select an activity to view its record breakdown.",
  });

  mount(container, card([cardHeader("Activity Summary Data", [activityField]), table]));

  async function load() {
    const data = await api.get("/report/activity-summary", { activity });
    setSelectOptions(activityField, data.activities, "Select Activity");
    activityField.select.value = activity;
    table.setData(data.rows);
  }

  await load();
}

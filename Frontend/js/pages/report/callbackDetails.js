import { mount, formatDateTime } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

export async function renderCallbackDetails(container) {
  const countBadge = badge("Today's Callbacks: 0", "brand");
  const table = dataTable({
    columns: [
      { key: "advisor", header: "Advisor" },
      { key: "merchantId", header: "Merchant ID" },
      { key: "lob", header: "LOB" },
      { key: "recordTime", header: "Record Time", render: (r) => formatDateTime(r.recordTime) },
      { key: "callbackTime", header: "CallBack Time", render: (r) => formatDateTime(r.callbackTime) },
      { key: "type", header: "Type", render: (r) => badge(r.type, r.type === "RNR Callback" ? "warning" : "brand") },
    ],
    rows: [],
    loading: true,
    exportFileName: "callback-details",
  });

  mount(container, card([cardHeader("CallBacks Details", [countBadge]), table]));

  const data = await api.get("/report/callbacks");
  countBadge.textContent = `Today's Callbacks: ${data.todayCount.toLocaleString()}`;
  table.setData(data.rows);
}

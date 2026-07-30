import { el, mount, todayIso } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader, cardBody } from "../../components/card.js";
import { textField } from "../../components/field.js";
import { button } from "../../components/button.js";
import { badge } from "../../components/badge.js";

export async function renderAgentCrmActivity(container) {
  const state = { startDate: todayIso(), endDate: todayIso() };
  const lastUpdatedBadge = badge("Last Updated : —", "brand");

  const startField = textField({ label: "Start Date", type: "date", value: state.startDate, onInput: (v) => (state.startDate = v) });
  const endField = textField({ label: "End Date", type: "date", value: state.endDate, onInput: (v) => (state.endDate = v) });

  const downloadBtn = button({
    label: "Download Report",
    onClick: async () => {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing…";
      try {
        const blob = await api.getBlob("/report/agent-crm-activity", state);
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: `agent-crm-activity_${state.startDate}_${state.endDate}.csv` });
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download Report";
      }
    },
  });

  mount(
    container,
    card([
      cardHeader("Agent CRM Activity Raw Data", [lastUpdatedBadge]),
      cardBody([el("div", { style: { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" } }, [startField, endField, downloadBtn])]),
    ]),
  );

  const meta = await api.get("/report/agent-crm-activity/meta");
  lastUpdatedBadge.textContent = `Last Updated : ${meta.lastUpdatedMinutesAgo} min ago`;
}

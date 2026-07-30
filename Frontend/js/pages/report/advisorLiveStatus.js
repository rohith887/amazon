import { el, mount, formatDuration } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { badge } from "../../components/badge.js";
import { emptyState } from "../../components/emptyState.js";

const LONG_CALL_THRESHOLD_SECONDS = 600;

export async function renderAdvisorLiveStatus(container) {
  const countBadge = badge("Advisor Count: 0", "brand");
  const tableWrap = el("div", { class: "table-scroll" });

  mount(container, card([cardHeader("Advisor Interaction Status", [countBadge]), tableWrap]));

  const data = await api.get("/report/advisor-live-status");
  countBadge.textContent = `Advisor Count: ${data.advisorCount}`;

  if (!data.rows.length) {
    tableWrap.append(emptyState());
    return;
  }

  const rows = data.rows.map((r) => {
    const isLong = r.durationSeconds >= LONG_CALL_THRESHOLD_SECONDS;
    return el("tr", { style: isLong ? { background: "var(--warning-100)" } : {} }, [
      el("td", { style: isLong ? { fontWeight: "600", color: "var(--warning-500)" } : {} }, [r.teamLeader]),
      el("td", { style: isLong ? { fontWeight: "600", color: "var(--warning-500)" } : {} }, [r.advisor]),
      el("td", {}, [r.lobName]),
      el("td", {}, [badge(r.activityState, r.activityState === "Live Call" ? "success" : "neutral")]),
      el("td", { class: "align-right tabular-nums", style: isLong ? { fontWeight: "600", color: "var(--warning-500)" } : {} }, [
        formatDuration(r.durationSeconds),
      ]),
    ]);
  });

  tableWrap.append(
    el("table", { class: "data-table" }, [
      el("thead", {}, [
        el("tr", {}, [
          el("th", {}, ["Team Leader"]),
          el("th", {}, ["Advisor"]),
          el("th", {}, ["LOB"]),
          el("th", {}, ["Activity"]),
          el("th", { class: "align-right" }, ["Activity Duration"]),
        ]),
      ]),
      el("tbody", {}, rows),
    ]),
  );
}

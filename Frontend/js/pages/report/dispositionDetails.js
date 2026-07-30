import { el, mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { badge } from "../../components/badge.js";
import { emptyState } from "../../components/emptyState.js";

export async function renderDispositionDetails(container) {
  const countBadge = badge("Today's Interactions: 0", "brand");
  const body = el("div", { style: { maxHeight: "70vh", overflowY: "auto", padding: "20px" } }, [
    el("p", { style: { textAlign: "center", padding: "64px 0", color: "var(--ink-400)" } }, ["Loading…"]),
  ]);

  mount(container, card([cardHeader("Disposition Details", [countBadge]), body]));

  const data = await api.get("/report/dispositions");
  countBadge.textContent = `Today's Interactions: ${data.todayInteractions.toLocaleString()}`;

  body.innerHTML = "";
  if (!data.groups.length) {
    body.append(emptyState());
    return;
  }

  for (const group of data.groups) {
    const table = el("table", { style: { width: "100%", fontSize: "13.5px" } }, [
      el(
        "tbody",
        {},
        group.dispositions.map((d) =>
          el("tr", { style: { borderBottom: "1px solid var(--ink-100)" } }, [
            el("td", { style: { padding: "8px 16px", color: "var(--brand-700)" } }, [d.name]),
            el("td", { style: { padding: "8px 16px", textAlign: "right", color: "var(--ink-700)" } }, [String(d.count)]),
            el("td", { style: { padding: "8px 16px", textAlign: "right", width: "90px", color: "var(--ink-500)" } }, [d.percentage.toFixed(2)]),
          ]),
        ),
      ),
      el("tfoot", {}, [
        el("tr", { style: { background: "var(--danger-500)", color: "#fff", fontWeight: "600" } }, [
          el("td", { style: { padding: "8px 16px" } }, ["TOTAL"]),
          el("td", { style: { padding: "8px 16px", textAlign: "right" } }, [String(group.totalCount)]),
          el("td", { style: { padding: "8px 16px", textAlign: "right" } }, ["100.00"]),
        ]),
      ]),
    ]);

    body.append(
      el("div", { style: { border: "1px solid var(--ink-100)", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" } }, [
        el(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              background: "var(--success-500)",
              color: "#fff",
              padding: "8px 16px",
              fontSize: "13.5px",
              fontWeight: "500",
            },
          },
          [el("span", {}, [`Activity :: ${group.activityName}`]), el("span", {}, [`Agents Logged in :: ${group.agentsLoggedIn}`])],
        ),
        table,
      ]),
    );
  }
}

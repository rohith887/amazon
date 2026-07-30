import { el, mount, todayIso, firstOfMonthIso, daysAgoIso, formatNumber } from "../dom.js";
import { api } from "../api.js";
import { card } from "../components/card.js";
import { selectField, textField } from "../components/field.js";
import { statTile } from "../components/statTile.js";
import { dataTable } from "../components/dataTable.js";
import { emptyState } from "../components/emptyState.js";
import { icons } from "../components/icons.js";

const SERIES = [
  { key: "outReach", label: "Out-Reaches", colorVar: "--series-outreach" },
  { key: "connected", label: "Connected Count", colorVar: "--series-connected" },
  { key: "completed", label: "Completed Count", colorVar: "--series-completed" },
  { key: "closed", label: "Closed Count", colorVar: "--series-closed" },
];

const RATE_TILES = [
  { label: "Connect Rate", from: "connected", of: "outReach", colorVar: "--brand-500" },
  { label: "Completed Share", from: "completed", of: "outReach", colorVar: "--success-500" },
  { label: "Close Rate", from: "closed", of: "outReach", colorVar: "--warning-500" },
];

const LEADERBOARD_SIZE = 8;

const PRESETS = [
  { label: "Today", start: todayIso, end: todayIso },
  { label: "Last 7 Days", start: () => daysAgoIso(6), end: todayIso },
  { label: "This Month", start: firstOfMonthIso, end: todayIso },
];

function pct(num, denom) {
  if (!denom) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

export async function renderDashboard(container) {
  const state = {
    startDate: firstOfMonthIso(),
    endDate: todayIso(),
    reportType: "agent",
    activity: "all",
  };

  const pageHead = el("div", { class: "page-head" }, [
    el("h1", {}, ["Dashboard"]),
    el("p", {}, ["Monitor outreach and activity performance at a glance."]),
  ]);

  const statTilesRow = el("div", { class: "stat-grid" });
  const rateTilesRow = el("div", { class: "stat-grid stat-grid-secondary" });

  const leaderboardSubtitle = el("p", { class: "card-subtitle" });
  const leaderboardBody = el("div", { class: "leaderboard" });
  const leaderboardCard = card([
    el("div", { class: "card-header" }, [el("div", {}, [el("h2", {}, ["Top Performers"]), leaderboardSubtitle])]),
    leaderboardBody,
  ]);

  const tableWrap = el("div");
  const tableCard = card([el("div", { class: "card-header" }, [el("h2", {}, ["All Records"])]), tableWrap]);

  const startDateField = textField({ label: "Select Start Date", type: "date", value: state.startDate, onInput: (v) => { state.startDate = v; load(); } });
  const endDateField = textField({ label: "Select End Date", type: "date", value: state.endDate, onInput: (v) => { state.endDate = v; load(); } });
  const reportTypeField = selectField({ label: "Report Type", value: state.reportType, options: [], onChange: (v) => { state.reportType = v; load(); } });
  const activityField = selectField({ label: "Activity", value: state.activity, options: [{ label: "All", value: "all" }], onChange: (v) => { state.activity = v; load(); } });

  const presetButtons = PRESETS.map((preset) => {
    const btn = el("button", {
      class: "filter-preset-btn",
      type: "button",
      onClick: () => {
        state.startDate = preset.start();
        state.endDate = preset.end();
        startDateField.input.value = state.startDate;
        endDateField.input.value = state.endDate;
        load();
      },
    }, [preset.label]);
    return { preset, btn };
  });

  const filtersSummary = el("p", { class: "filters-summary" });
  const filtersToggleBtn = el("button", { class: "filters-toggle-btn", title: "Toggle filters", onClick: () => setFiltersOpen(!filtersOpen) }, [icons.chevronDown()]);
  const filtersBody = el("div", { class: "filters-body collapsed" }, [
    el("div", { class: "filters-body-inner" }, [
      el("div", { class: "filter-presets" }, presetButtons.map((p) => p.btn)),
      el("div", { class: "form-grid" }, [startDateField, endDateField, reportTypeField, activityField]),
    ]),
  ]);

  let filtersOpen = false;
  function setFiltersOpen(open) {
    filtersOpen = open;
    filtersBody.classList.toggle("collapsed", !open);
    filtersToggleBtn.classList.toggle("open", open);
  }

  const filterCard = card([
    el("div", { class: "card-header" }, [el("div", {}, [el("h2", {}, ["Filters"]), filtersSummary]), filtersToggleBtn]),
    filtersBody,
  ]);

  mount(container, pageHead, filterCard, statTilesRow, el("h3", { class: "section-label" }, ["Conversion Rates"]), rateTilesRow, leaderboardCard, tableCard);

  let table = null;

  function renderLeaderboard(series) {
    leaderboardBody.innerHTML = "";

    if (!series.length) {
      leaderboardSubtitle.textContent = "";
      leaderboardBody.append(emptyState({ title: "No activity yet", hint: "Try adjusting the date range or filters." }));
      return;
    }

    const reportLabel = reportTypeField.select.selectedOptions[0]?.text ?? "";
    leaderboardSubtitle.textContent = `Ranked by Out-Reaches · ${reportLabel}`;

    const sorted = [...series].sort((a, b) => b.outReach - a.outReach);
    const top = sorted.slice(0, LEADERBOARD_SIZE);
    const max = Math.max(1, ...top.map((r) => r.outReach));

    top.forEach((row, i) => {
      const rank = i + 1;
      leaderboardBody.append(
        el("div", { class: "leaderboard-row" }, [
          el("span", { class: `leaderboard-rank${rank <= 3 ? ` rank-${rank}` : ""}` }, [String(rank)]),
          el("div", { class: "leaderboard-main" }, [
            el("div", { class: "leaderboard-top" }, [
              el("span", { class: "leaderboard-name" }, [row.name]),
              el("span", { class: "leaderboard-value" }, [formatNumber(row.outReach)]),
            ]),
            el("div", { class: "leaderboard-bar-track" }, [
              el("div", { class: "leaderboard-bar-fill", style: { width: `${Math.max(4, (row.outReach / max) * 100)}%` } }),
            ]),
            el("div", { class: "leaderboard-meta" }, [
              `Connected ${formatNumber(row.connected)} · Completed ${formatNumber(row.completed)} · Closed ${formatNumber(row.closed)}`,
            ]),
          ]),
        ]),
      );
    });

    if (sorted.length > top.length) {
      leaderboardBody.append(el("p", { class: "leaderboard-more" }, [`+${sorted.length - top.length} more — see full table below`]));
    }
  }

  function renderTable(series) {
    if (!table) {
      table = dataTable({
        exportFileName: "dashboard-details",
        columns: [
          { key: "name", header: "Name" },
          { key: "outReach", header: "Out-Reaches", align: "right" },
          { key: "connected", header: "Connected", align: "right" },
          { key: "completed", header: "Completed", align: "right" },
          { key: "closed", header: "Closed", align: "right" },
        ],
        rows: series,
        emptyTitle: "No records found",
        emptyHint: "Try adjusting the date range or filters.",
      });
      tableWrap.append(table);
    } else {
      table.setData(series);
    }
  }

  async function load() {
    const data = await api.get("/dashboard", {
      startDate: state.startDate,
      endDate: state.endDate,
      reportType: state.reportType,
      activity: state.activity,
    });

    reportTypeField.select.innerHTML = "";
    for (const opt of data.reportTypes) {
      reportTypeField.select.append(el("option", { value: opt.value, selected: opt.value === state.reportType }, [opt.label]));
    }
    activityField.select.innerHTML = "";
    for (const opt of data.activities) {
      activityField.select.append(el("option", { value: opt.value, selected: opt.value === state.activity }, [opt.label]));
    }

    const rangeLabel = state.startDate === state.endDate ? state.startDate : `${state.startDate} – ${state.endDate}`;
    const reportLabel = reportTypeField.select.selectedOptions[0]?.text ?? "";
    const activityLabel = activityField.select.selectedOptions[0]?.text ?? "";
    filtersSummary.textContent = `${rangeLabel} · ${reportLabel} · ${activityLabel}`;
    for (const { preset, btn } of presetButtons) {
      btn.classList.toggle("active", state.startDate === preset.start() && state.endDate === preset.end());
    }

    statTilesRow.innerHTML = "";
    for (const s of SERIES) {
      statTilesRow.append(statTile({ label: s.label, value: data.totals[s.key] ?? 0, colorVar: s.colorVar }));
    }

    rateTilesRow.innerHTML = "";
    for (const r of RATE_TILES) {
      rateTilesRow.append(statTile({ label: r.label, value: pct(data.totals[r.from] ?? 0, data.totals[r.of] ?? 0), colorVar: r.colorVar }));
    }

    renderLeaderboard(data.series);
    renderTable(data.series);
  }

  await load();
}

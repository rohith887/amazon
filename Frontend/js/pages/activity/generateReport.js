import { el, mount, todayIso } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader, cardBody } from "../../components/card.js";
import { selectField, textField, setSelectOptions } from "../../components/field.js";
import { button } from "../../components/button.js";

const AUDIENCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Team Leader Wise", value: "team_leader" },
  { label: "Agent Wise", value: "agent" },
];

export async function renderActivityGenerateReport(container) {
  const state = { reportType: "", activity: "", audience: "all", assignee: "all", startDate: todayIso(), endDate: todayIso() };
  let options = { teamLeaders: [], agents: [] };

  const reportTypeField = selectField({ label: "Report Type", placeholder: "Select Report", options: [], onChange: (v) => { state.reportType = v; refreshButtons(); } });
  const activityField = selectField({ label: "Select Activity", placeholder: "Select Activity", options: [], onChange: (v) => { state.activity = v; refreshButtons(); } });
  const audienceField = selectField({
    label: "Select Report Type",
    value: state.audience,
    options: AUDIENCE_OPTIONS,
    onChange: (v) => {
      state.audience = v;
      state.assignee = "all";
      refreshAssigneeOptions();
    },
  });
  const assigneeField = selectField({ label: "Select Team Leader / Agent", value: state.assignee, options: [{ label: "All", value: "all" }], disabled: true });
  const startField = textField({ label: "Select Start Date", type: "date", value: state.startDate, onInput: (v) => (state.startDate = v) });
  const endField = textField({ label: "Select End Date", type: "date", value: state.endDate, onInput: (v) => (state.endDate = v) });

  function refreshAssigneeOptions() {
    const list =
      state.audience === "team_leader" ? options.teamLeaders : state.audience === "agent" ? options.agents : [];
    setSelectOptions(assigneeField, [{ label: "All", value: "all" }, ...list]);
    assigneeField.select.value = "all";
    assigneeField.select.disabled = state.audience === "all";
  }

  async function download(format) {
    const btn = format === "xlsx" ? xlsxBtn : csvBtn;
    btn.disabled = true;
    btn.textContent = "Preparing…";
    try {
      const blob = await api.getBlob("/activity/generate-report", { ...state, format });
      const url = URL.createObjectURL(blob);
      const a = el("a", { href: url, download: `activity-report_${state.startDate}_${state.endDate}.${format}` });
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      btn.disabled = !state.reportType || !state.activity;
      btn.textContent = format === "xlsx" ? "XLSX - Download Report" : "CSV - Download Report";
    }
  }

  const xlsxBtn = button({ label: "XLSX - Download Report", disabled: true, onClick: () => download("xlsx") });
  const csvBtn = button({ label: "CSV - Download Report", variant: "secondary", disabled: true, onClick: () => download("csv") });

  function refreshButtons() {
    const disabled = !state.reportType || !state.activity;
    xlsxBtn.disabled = disabled;
    csvBtn.disabled = disabled;
  }

  const c = card([
    cardHeader("Activity Report"),
    cardBody([
      el("div", { class: "form-grid", style: { padding: "0" } }, [reportTypeField, activityField, audienceField, assigneeField, startField, endField]),
      el("div", { class: "form-grid", style: { padding: "0", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" } }, [xlsxBtn, csvBtn]),
    ]),
  ]);

  mount(container, c);

  options = await api.get("/activity/generate-report/options");
  setSelectOptions(reportTypeField, options.reportTypes, "Select Report");
  setSelectOptions(activityField, options.activities, "Select Activity");
}

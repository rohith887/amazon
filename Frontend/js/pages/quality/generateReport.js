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

export async function renderQualityGenerateReport(container) {
  const state = { reportType: "", activity: "", audience: "all", assignee: "all", startDate: todayIso(), endDate: todayIso() };
  let options = { teamLeaders: [], agents: [] };

  const reportTypeField = selectField({ label: "Report Type", placeholder: "Select Report", options: [], onChange: (v) => { state.reportType = v; refreshBtn(); } });
  const activityField = selectField({ label: "Select Activity", placeholder: "Select Activity", options: [], onChange: (v) => { state.activity = v; refreshBtn(); } });
  const audienceField = selectField({
    label: "Select ReportType",
    value: state.audience,
    options: AUDIENCE_OPTIONS,
    onChange: (v) => {
      state.audience = v;
      state.assignee = "all";
      const list = v === "team_leader" ? options.teamLeaders : v === "agent" ? options.agents : [];
      setSelectOptions(assigneeField, [{ label: "All", value: "all" }, ...list]);
      assigneeField.select.value = "all";
      assigneeField.select.disabled = v === "all";
    },
  });
  const assigneeField = selectField({ label: "Select Team Leader / Agent", value: "all", options: [{ label: "All", value: "all" }], disabled: true });
  const startField = textField({ label: "Select Start Date", type: "date", value: state.startDate, onInput: (v) => (state.startDate = v) });
  const endField = textField({ label: "Select End Date", type: "date", value: state.endDate, onInput: (v) => (state.endDate = v) });

  const downloadBtn = button({
    label: "Download Report",
    disabled: true,
    onClick: async () => {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing…";
      try {
        const blob = await api.getBlob("/quality/generate-report", state);
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: `quality-report_${state.startDate}_${state.endDate}.xlsx` });
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } finally {
        refreshBtn();
        downloadBtn.textContent = "Download Report";
      }
    },
  });

  function refreshBtn() {
    downloadBtn.disabled = !state.reportType || !state.activity;
  }

  mount(
    container,
    card([
      cardHeader("Quality Report"),
      cardBody([
        el("div", { class: "form-grid", style: { padding: "0" } }, [reportTypeField, activityField, audienceField, assigneeField, startField, endField]),
        downloadBtn,
      ]),
    ]),
  );

  options = await api.get("/quality/generate-report/options");
  setSelectOptions(reportTypeField, options.reportTypes, "Select Report");
  setSelectOptions(activityField, options.activities, "Select Activity");
}

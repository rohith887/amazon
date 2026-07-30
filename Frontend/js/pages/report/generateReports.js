import { el, mount, todayIso } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader, cardBody } from "../../components/card.js";
import { selectField, textField, setSelectOptions } from "../../components/field.js";
import { button } from "../../components/button.js";

export async function renderGenerateReports(container) {
  const state = { reportType: "", lob: "", startDate: todayIso(), endDate: todayIso() };

  const reportTypeField = selectField({ label: "Report Type", placeholder: "Select Report", options: [], onChange: (v) => { state.reportType = v; refreshBtn(); } });
  const lobField = selectField({ label: "Select LOB", placeholder: "Select LOB", options: [], onChange: (v) => { state.lob = v; refreshBtn(); } });
  const startField = textField({ label: "Select Start Date", type: "date", value: state.startDate, onInput: (v) => (state.startDate = v) });
  const endField = textField({ label: "Select End Date", type: "date", value: state.endDate, onInput: (v) => (state.endDate = v) });

  const downloadBtn = button({
    label: "Download Report",
    disabled: true,
    onClick: async () => {
      downloadBtn.disabled = true;
      downloadBtn.textContent = "Preparing…";
      try {
        const blob = await api.getBlob("/report/generate", state);
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: `report_${state.startDate}_${state.endDate}.csv` });
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

  function refreshBtn() {
    downloadBtn.disabled = !state.reportType || !state.lob;
  }

  const c = card([
    cardHeader("Generate Report"),
    cardBody([
      el("div", { class: "form-grid", style: { padding: "0" } }, [reportTypeField, lobField, startField, endField]),
      downloadBtn,
    ]),
  ]);

  mount(container, c);

  const options = await api.get("/report/generate/options");
  setSelectOptions(reportTypeField, options.reportTypes, "Select Report");
  setSelectOptions(lobField, options.lobs, "Select LOB");
}

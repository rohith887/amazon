import { el, mount, todayIso, formatDateTime } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, textField, textAreaField } from "../../components/field.js";
import { button } from "../../components/button.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

const RATING_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];
const ASPT_OPTIONS = [
  { label: "Agent", value: "agent" },
  { label: "Seller", value: "seller" },
  { label: "Process", value: "process" },
  { label: "Technology", value: "technology" },
  { label: "NA", value: "na" },
];

export async function renderAuditCallQuality(container) {
  let view = "search";
  let searchTab = "date-advisor";

  async function render() {
    container.innerHTML = "";
    if (view === "search") renderSearch();
    else if (view === "list") await renderList();
  }

  function renderSearch() {
    const state = { callDate: todayIso(), rid: "", merchantId: "" };

    const dateAdvisorBtn = tabButton("Date / Advisor Wise", searchTab === "date-advisor", () => {
      searchTab = "date-advisor";
      renderSearch();
    });
    const ridMerchantBtn = tabButton("RID / Merchant ID Wise", searchTab === "rid-merchant", () => {
      searchTab = "rid-merchant";
      renderSearch();
    });

    const fieldsWrap = el("div", { style: { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap", padding: "20px" } });

    if (searchTab === "date-advisor") {
      const dateField = textField({ label: "Call Date", type: "date", value: state.callDate, onInput: (v) => (state.callDate = v) });
      fieldsWrap.append(dateField);
    } else {
      const ridField = textField({ label: "RID", placeholder: "e.g. 7896", onInput: (v) => (state.rid = v) });
      const merchantField = textField({ label: "Merchant ID", placeholder: "e.g. Arvin G", onInput: (v) => (state.merchantId = v) });
      fieldsWrap.append(ridField, merchantField);
    }

    const listBtn = button({
      label: "List Advisors",
      variant: "success",
      onClick: async () => {
        listBtn.disabled = true;
        listBtn.textContent = "Loading…";
        const params = searchTab === "date-advisor" ? { callDate: state.callDate } : { rid: state.rid, merchantId: state.merchantId };
        lastRows = await api.get("/quality/audit/search", params);
        view = "list";
        await render();
      },
    });
    fieldsWrap.append(listBtn);

    mount(
      container,
      card([
        cardHeader("Audit Call Quality", [button({ label: "Legends", variant: "secondary", size: "sm" })]),
        el("div", { class: "tab-bar" }, [dateAdvisorBtn, ridMerchantBtn]),
        fieldsWrap,
      ]),
    );
  }

  function tabButton(label, active, onClick) {
    return el("button", { class: `tab-btn${active ? " active" : ""}`, onClick }, [label]);
  }

  let lastRows = [];

  async function renderList() {
    const c = card([
      cardHeader("Audit Call Quality", [button({ label: "← Back to search", variant: "secondary", size: "sm", onClick: () => { view = "search"; render(); } })]),
    ]);
    mount(container, c);
    renderListTableInto(c, lastRows);
  }

  function renderListTableInto(cardEl, rows) {
    const table = dataTable({
      columns: [
        { key: "rid", header: "RID" },
        { key: "merchantId", header: "MerchantID" },
        { key: "currentUserName", header: "CurrentUserName" },
        { key: "activity", header: "Activity" },
        { key: "disposition", header: "Priority" },
        { key: "updatedAt", header: "UpdateTime", render: (r) => formatDateTime(r.updatedAt) },
        { key: "handleTime", header: "Handle Time" },
        {
          key: "action",
          header: "",
          render: (r) => button({ label: "Audit", size: "sm", onClick: () => renderAuditForm(r) }),
        },
      ],
      rows,
      exportFileName: "audit-call-quality",
    });
    cardEl.append(table);
  }

  async function renderAuditForm(interaction) {
    let formTab = "quality";
    const template = await api.get("/quality/audit-form-template");

    async function renderFormTab() {
      container.innerHTML = "";
      const parameters = formTab === "quality" ? template.quality : template.shortCall;
      const ratings = {};

      const qualityTabBtn = tabButton("Quality Audit Form", formTab === "quality", () => {
        formTab = "quality";
        renderFormTab();
      });
      const shortCallTabBtn = tabButton("Short Call Audit Form", formTab === "short-call", () => {
        formTab = "short-call";
        renderFormTab();
      });

      const paramRows = parameters.map((p) =>
        el("tr", { style: { borderBottom: "1px solid var(--ink-100)" } }, [
          el("td", { style: { padding: "8px 12px", color: p.fatal ? "var(--danger-500)" : "var(--brand-700)" } }, [p.attribute]),
          el("td", { style: { padding: "8px 12px", color: p.fatal ? "var(--danger-500)" : "var(--ink-700)" } }, [p.parameter]),
          el("td", { style: { padding: "8px 12px", textAlign: "right", color: "var(--ink-500)" } }, [p.weightage ? String(p.weightage) : "—"]),
          el("td", { style: { padding: "8px 12px", width: "120px" } }, [
            selectField({ placeholder: "Select", options: RATING_OPTIONS, onChange: (v) => { ratings[p.id] = v; refreshSubmit(); } }),
          ]),
        ]),
      );

      const paramsTable = el("div", { style: { border: "1px solid var(--ink-100)", borderRadius: "8px", overflow: "hidden" } }, [
        el("table", { style: { width: "100%", fontSize: "13.5px" } }, [
          el("thead", {}, [
            el("tr", { style: { background: "var(--surface-muted)" } }, [
              el("th", { style: { padding: "8px 12px", textAlign: "left", fontSize: "11.5px", textTransform: "uppercase", color: "var(--ink-500)" } }, ["Attribute"]),
              el("th", { style: { padding: "8px 12px", textAlign: "left", fontSize: "11.5px", textTransform: "uppercase", color: "var(--ink-500)" } }, ["Parameters"]),
              el("th", { style: { padding: "8px 12px", textAlign: "right", fontSize: "11.5px", textTransform: "uppercase", color: "var(--ink-500)" } }, ["Weightage"]),
              el("th", { style: { padding: "8px 12px", textAlign: "left", fontSize: "11.5px", textTransform: "uppercase", color: "var(--ink-500)" } }, ["Ratings"]),
            ]),
          ]),
          el("tbody", {}, paramRows),
        ]),
      ]);

      const disqualificationField = textAreaField({ label: "Disqualification Reason" });
      const callSummaryField = textAreaField({ label: "Call Summary" });
      const areasField = textAreaField({ label: "Areas of Improvements" });
      const asptField = selectField({ label: "ASPT", placeholder: "Select ASPT", options: ASPT_OPTIONS });
      const asptRemarksField = textAreaField({ label: "ASPT Remarks" });
      const submittedBadge = badge("Audit submitted successfully", "success");
      submittedBadge.classList.add("hidden");

      const submitBtn = button({
        label: "Audit Call Quality",
        disabled: true,
        onClick: async () => {
          submitBtn.disabled = true;
          submitBtn.textContent = "Submitting…";
          await api.post(`/quality/audit/${interaction.interactionId}`, {
            formTab,
            ratings,
            disqualificationReason: disqualificationField.textarea.value,
            callSummary: callSummaryField.textarea.value,
            areasOfImprovement: areasField.textarea.value,
            aspt: asptField.select.value,
            asptRemarks: asptRemarksField.textarea.value,
          });
          submittedBadge.classList.remove("hidden");
          submitBtn.textContent = "Audit Call Quality";
          refreshSubmit();
        },
      });

      function refreshSubmit() {
        submitBtn.disabled = !parameters.every((p) => ratings[p.id]);
      }

      const rightPanel = el("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
        disqualificationField,
        callSummaryField,
        areasField,
        asptField,
        asptRemarksField,
        submittedBadge,
        submitBtn,
      ]);

      mount(
        container,
        card([
          el(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--brand-600)",
                color: "#fff",
                padding: "12px 20px",
                fontSize: "13.5px",
                fontWeight: "500",
              },
            },
            [
              el("span", {}, [`Interaction Details :: RID :: ${interaction.rid} || Interaction ID :: ${interaction.interactionId}`]),
              button({ label: "← Back to list", variant: "secondary", size: "sm", onClick: () => { view = "list"; render(); } }),
            ],
          ),
          el("div", { class: "tab-bar" }, [qualityTabBtn, shortCallTabBtn]),
          el("div", { style: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", padding: "20px" }, class: "audit-grid" }, [paramsTable, rightPanel]),
        ]),
      );
    }

    await renderFormTab();
  }

  await render();
}

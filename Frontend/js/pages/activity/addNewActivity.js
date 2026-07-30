import { el, mount, formatDateTime } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, textField, setSelectOptions } from "../../components/field.js";
import { button } from "../../components/button.js";
import { toggle } from "../../components/toggle.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

const ACTIVITY_TYPE_OPTIONS = [
  { label: "Voice", value: "Voice" },
  { label: "Non Voice", value: "Non Voice" },
];
const FIELD_TYPE_OPTIONS = [
  { label: "Input", value: "Input" },
  { label: "Output", value: "Output" },
];

export async function renderAddNewActivity(container) {
  let mode = "list";
  let lobs = [];

  function headerActions() {
    return [
      button({ label: "List Activities", variant: mode === "list" ? "primary" : "secondary", size: "sm", onClick: () => setMode("list") }),
      button({ label: "Add New Activity", variant: mode === "create" ? "success" : "secondary", size: "sm", onClick: () => setMode("create") }),
      button({ label: "Manage Advisors", variant: "danger", size: "sm" }),
    ];
  }

  function setMode(next) {
    mode = next;
    render();
  }

  async function render() {
    container.innerHTML = "";
    if (mode === "list") {
      await renderList();
    } else {
      await renderCreate();
    }
  }

  async function renderList() {
    const table = dataTable({
      columns: [
        { key: "activityName", header: "Activity Name" },
        { key: "lobName", header: "LOB Name" },
        { key: "activityType", header: "Activity Type" },
        { key: "creationDate", header: "Creation Date", render: (r) => formatDateTime(r.creationDate) },
        {
          key: "enabled",
          header: "Enabled",
          align: "center",
          sortValue: (r) => (r.enabled ? 1 : 0),
          render: (r) => toggle({ checked: r.enabled, disabled: true }),
        },
      ],
      rows: [],
      loading: true,
      exportFileName: "activity-list",
    });
    mount(container, card([cardHeader("Activity List's", headerActions()), table]));
    const rows = await api.get("/activity/list");
    table.setData(rows);
  }

  async function renderCreate() {
    const state = {
      lob: "",
      activityType: "",
      activityName: "",
      activityId: null,
      fieldType: "Input",
      fieldName: "",
      displayOnForm: true,
      fields: [],
    };

    const setupCard = card([]);
    const fieldBuilderWrap = el("div");
    mount(container, setupCard, fieldBuilderWrap);

    function renderSetupCard() {
      const lobField = selectField({ label: "Select LOB", placeholder: "Select LOB", value: state.lob, options: lobs, disabled: Boolean(state.activityId), onChange: (v) => (state.lob = v) });
      const nameField = textField({ label: "Activity Name", value: state.activityName, disabled: Boolean(state.activityId), onInput: (v) => (state.activityName = v) });
      const typeField = selectField({ label: "Activity Type", placeholder: "Select Activity Type", value: state.activityType, options: ACTIVITY_TYPE_OPTIONS, disabled: Boolean(state.activityId), onChange: (v) => (state.activityType = v) });

      function refreshSaveBtn() {
        saveBtn.disabled = !state.lob || !state.activityType || !state.activityName.trim();
      }
      lobField.select.addEventListener("change", refreshSaveBtn);
      typeField.select.addEventListener("change", refreshSaveBtn);
      nameField.input.addEventListener("input", refreshSaveBtn);

      const saveBtn = button({
        label: "Set Activity Name",
        variant: "success",
        disabled: true,
        onClick: async () => {
          saveBtn.disabled = true;
          saveBtn.textContent = "Saving…";
          const { id } = await api.post("/activity", { lob: state.lob, activityType: state.activityType, activityName: state.activityName });
          state.activityId = id;
          renderSetupCard();
          renderFieldBuilder();
        },
      });

      const grid = el("div", { class: "form-grid" }, [lobField, nameField, typeField, state.activityId ? null : el("div", { style: { display: "flex", alignItems: "flex-end" } }, [saveBtn])]);

      setupCard.innerHTML = "";
      setupCard.append(
        cardHeader("Add New Activity", headerActions()),
        grid,
        ...(state.activityId
          ? [el("div", { style: { borderTop: "1px solid var(--ink-100)", padding: "12px 20px" } }, [badge("Activity draft created — add fields below", "success")])]
          : []),
      );
    }

    function renderFieldBuilder() {
      fieldBuilderWrap.innerHTML = "";
      if (!state.activityId) return;

      const fieldTypeField = selectField({ label: "Field Type", value: state.fieldType, options: FIELD_TYPE_OPTIONS, onChange: (v) => (state.fieldType = v) });
      const fieldNameField = textField({ label: "Field Name", value: "", onInput: (v) => { state.fieldName = v; addFieldBtn.disabled = !v.trim(); } });
      const activityNameField = textField({ label: "Activity Name", value: state.activityName, disabled: true });

      const displayToggle = toggle({ checked: state.displayOnForm, label: "Display on Form", onChange: (v) => (state.displayOnForm = v) });

      const addFieldBtn = button({
        label: "Add/Update Field",
        variant: "secondary",
        disabled: true,
        onClick: async () => {
          if (!state.fieldName.trim()) return;
          const field = await api.post(`/activity/${state.activityId}/fields`, {
            fieldType: state.fieldType,
            fieldName: state.fieldName.trim(),
            displayOnForm: state.displayOnForm,
          });
          state.fields.push(field);
          state.fieldName = "";
          renderFieldBuilder();
        },
      });

      const saveActivityBtn = button({
        label: "Save Activity",
        variant: "success",
        onClick: async () => {
          saveActivityBtn.disabled = true;
          saveActivityBtn.textContent = "Saving…";
          await api.post(`/activity/${state.activityId}/save`);
          setMode("list");
        },
      });

      const inputFields = state.fields.filter((f) => f.fieldType === "Input");
      const outputFields = state.fields.filter((f) => f.fieldType === "Output");

      fieldBuilderWrap.append(
        card([
          cardHeader("Add / Edit Field"),
          el("div", { class: "form-grid" }, [activityNameField, fieldTypeField, fieldNameField, el("div", { style: { display: "flex", alignItems: "flex-end", paddingBottom: "10px" } }, [displayToggle])]),
          el("div", { class: "form-grid", style: { paddingTop: "0" } }, [addFieldBtn, saveActivityBtn]),
        ]),
        fieldListCard("Input Fields", inputFields),
        fieldListCard("Output Fields", outputFields),
        previewCard(outputFields),
      );
    }

    function fieldListCard(title, fields) {
      return card([
        cardHeader(title),
        fields.length === 0
          ? el("p", { style: { padding: "0 20px 20px", fontSize: "13px", color: "var(--ink-400)" } }, ["No fields added yet."])
          : el(
              "div",
              { style: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "0 20px 20px" } },
              fields.map((f) => el("span", { class: "chip" }, [f.fieldName, !f.displayOnForm ? el("span", { style: { color: "var(--ink-400)" } }, [" (hidden)"]) : null])),
            ),
      ]);
    }

    function previewCard(outputFields) {
      const recordDetailsRows = ["Merchant ID", "Cohort Number", "Cohort Header", "Token ID"].map((label) =>
        el("tr", { style: { borderBottom: "1px solid var(--ink-100)" } }, [
          el("td", { style: { padding: "10px 16px", fontWeight: "500", color: "var(--ink-600)" } }, [label]),
          el("td", { style: { padding: "10px 16px", color: "var(--ink-400)" } }, ["XXX"]),
        ]),
      );

      const disposePanel = el("div", { style: { display: "flex", flexDirection: "column", gap: "16px", padding: "16px" } }, [
        ...outputFields.filter((f) => f.displayOnForm).map((f) => textField({ label: f.fieldName, disabled: true, placeholder: "Agent enters value during call" })),
        textField({ label: "Remarks", disabled: true, placeholder: "Agent enters value during call" }),
        button({ label: "Dispose Interaction", disabled: true }),
      ]);

      return card([
        cardHeader("Advisor CRM Visualization"),
        el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", padding: "20px" } }, [
          el("div", { style: { border: "1px solid var(--ink-100)", borderRadius: "8px" } }, [
            el("div", { style: { borderBottom: "1px solid var(--ink-100)", background: "var(--surface-muted)", padding: "10px 16px", fontWeight: "600", fontSize: "13.5px" } }, ["Record Details"]),
            el("table", { style: { width: "100%" } }, [el("tbody", {}, recordDetailsRows)]),
          ]),
          el("div", { style: { border: "1px solid var(--ink-100)", borderRadius: "8px" } }, [
            el("div", { style: { borderBottom: "1px solid var(--ink-100)", background: "var(--surface-muted)", padding: "10px 16px", fontWeight: "600", fontSize: "13.5px" } }, ["Dispose"]),
            disposePanel,
          ]),
        ]),
      ]);
    }

    renderSetupCard();
    renderFieldBuilder();
  }

  lobs = await api.get("/activity/lobs");
  await render();
}

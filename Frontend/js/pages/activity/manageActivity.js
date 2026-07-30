import { el, mount, formatDateTime } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField } from "../../components/field.js";
import { button } from "../../components/button.js";
import { toggle } from "../../components/toggle.js";
import { badge } from "../../components/badge.js";
import { dataTable } from "../../components/dataTable.js";

const TABS = [
  { key: "upload", label: "Upload Data", variant: "primary" },
  { key: "records", label: "Manage Records", variant: "success" },
  { key: "running-check", label: "Running Activity Check", variant: "success" },
  { key: "rcp-upload", label: "RCP Upload Data", variant: "primary" },
  { key: "rcp-report", label: "RCP Report", variant: "primary" },
  { key: "advisors", label: "Manage Advisors", variant: "danger" },
];

function uploadForm(lobs, endpoint) {
  let lob = "";
  let file = null;

  const lobField = selectField({ label: "Select LOB", placeholder: "Select LOB", options: lobs, onChange: (v) => { lob = v; refresh(); } });
  const fileInput = el("input", {
    type: "file",
    class: "file-input",
    accept: ".csv,.xlsx,.xls",
    onChange: (e) => {
      file = e.target.files[0] ?? null;
      refresh();
    },
  });
  const messageEl = el("p", { class: "hidden", style: { fontSize: "13px", color: "var(--success-500)" } });

  const submitBtn = button({
    label: "Upload Data",
    disabled: true,
    onClick: async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading…";
      const formData = new FormData();
      formData.append("lob", lob);
      formData.append("file", file);
      const result = await api.postForm(endpoint, formData);
      messageEl.textContent = `"${result.fileName}" uploaded successfully.`;
      messageEl.classList.remove("hidden");
      fileInput.value = "";
      file = null;
      submitBtn.textContent = "Upload Data";
      refresh();
    },
  });

  function refresh() {
    submitBtn.disabled = !lob || !file;
  }

  return el("div", { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "20px" } }, [
    lobField,
    el("label", { class: "field" }, [el("span", { class: "field-label" }, ["File"]), fileInput]),
    messageEl,
    submitBtn,
  ]);
}

export async function renderManageActivity(container) {
  let tab = "upload";
  const lobs = await api.get("/activity/lobs");

  function headerActions() {
    return TABS.map((t) => button({ label: t.label, variant: tab === t.key ? t.variant : "secondary", size: "sm", onClick: () => setTab(t.key) }));
  }

  function setTab(next) {
    tab = next;
    render();
  }

  async function render() {
    container.innerHTML = "";
    const body = el("div");
    mount(container, card([cardHeader("Activity File Upload", headerActions()), body]));

    if (tab === "upload") {
      body.append(uploadForm(lobs, "/activity/upload"));
    } else if (tab === "rcp-upload") {
      body.append(uploadForm(lobs, "/activity/rcp-upload"));
    } else if (tab === "records") {
      const table = dataTable({
        columns: [
          { key: "merchantId", header: "Merchant ID" },
          { key: "status", header: "Status", render: (r) => badge(r.status, r.status === "Processed" ? "success" : "warning") },
          { key: "uploadedOn", header: "Uploaded On", render: (r) => formatDateTime(r.uploadedOn) },
          { key: "fetchedBy", header: "Fetched By" },
        ],
        rows: [],
        loading: true,
        exportFileName: "manage-records",
      });
      body.append(table);
      const rows = await api.get("/activity/records");
      table.setData(rows);
    } else if (tab === "running-check") {
      const table = dataTable({
        columns: [
          { key: "fileName", header: "File Name" },
          { key: "totalRecords", header: "Total Records", align: "right" },
          { key: "processed", header: "Processed", align: "right" },
          { key: "status", header: "Status", render: (r) => badge(r.status, r.status === "Completed" ? "success" : "brand") },
        ],
        rows: [],
        loading: true,
        exportFileName: "running-activity-check",
      });
      body.append(table);
      const rows = await api.get("/activity/running-check");
      table.setData(rows);
    } else if (tab === "rcp-report") {
      const lobField = selectField({ label: "Select LOB", placeholder: "Select LOB", options: lobs });
      body.append(
        el("div", { style: { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap", padding: "20px" } }, [
          el("div", { style: { maxWidth: "280px", width: "100%" } }, [lobField]),
          button({ label: "Download RCP Report" }),
        ]),
      );
    } else if (tab === "advisors") {
      const table = dataTable({
        columns: [
          { key: "advisor", header: "Advisor" },
          { key: "teamLeader", header: "Team Leader" },
          { key: "assigned", header: "Assigned", align: "center", render: (r) => toggle({ checked: r.assigned }) },
        ],
        rows: [],
        loading: true,
        exportFileName: "manage-advisors",
      });
      body.append(table);
      const rows = await api.get("/activity/advisors");
      table.setData(rows);
    }
  }

  await render();
}

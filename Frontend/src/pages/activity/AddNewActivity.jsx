import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { formatDateTime } from "../../utils/date.js";

function defaultState() {
  return {
    name: "",
    lob: "",
    leadSource: "",
    phoneColumn: "",
    extraColumns: [],
    csv: null,
    columns: [],
    mapping: {},
    useDeadLine: false,
    deadlineMinutes: "60",
    usePriority: false,
    priorityColumn: "",
  };
}

const STRATEGY_OPTIONS = [
  { label: "Round Robin", value: "round_robin" },
  { label: "Priority Based", value: "priority" },
];

export default function AddNewActivity() {
  const [state, setState] = useState(defaultState);
  const [lobs, setLobs] = useState([]);
  const [options, setOptions] = useState({ leadSources: [], extraColumns: [] });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  function patch(p) {
    setState((s) => ({ ...s, ...p }));
  }

  function loadActivities() {
    setActivitiesLoading(true);
    api
      .get("/activity/list")
      .then(setActivities)
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
  }

  useEffect(() => {
    loadActivities();
    api
      .get("/activity/lobs")
      .then(setLobs)
      .catch(() => {});
    api
      .get("/activity/options")
      .then(setOptions)
      .catch(() => {});
  }, []);

  async function handleFileChange(file) {
    if (!file) return;
    patch({ csv: file, columns: [] });
    const text = await file.text();
    const headerLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
    const columns = headerLine.split(",").map((c) => c.trim()).filter(Boolean);
    patch({ columns });
  }

  function updateMapping(column, field) {
    setState((s) => {
      const mapping = { ...s.mapping, [column]: field };
      return { ...s, mapping };
    });
  }

  const primaryField = Object.keys(state.mapping).find((c) => state.mapping[c] === "primary");
  const used = new Set(Object.values(state.mapping));
  const availableColumns = state.columns.filter((c) => !used.has(c) || state.mapping[c] === undefined);
  const extraUsed = state.extraColumns.filter((c) => used.has(c));

  const step1Done = Boolean(state.name.trim() && state.lob && state.leadSource);
  const step2Done = Boolean(state.csv && primaryField);
  const step3Done = Boolean(state.usePriority ? state.priorityColumn && extraUsed.length > 0 : true);
  const canSubmit = step1Done && step2Done && step3Done;

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("name", state.name);
      formData.append("lob", state.lob);
      formData.append("leadSource", state.leadSource);
      formData.append("csv", state.csv);
      formData.append("primaryColumn", primaryField);
      formData.append("priorityColumn", state.priorityColumn);
      formData.append("columnMapping", JSON.stringify(state.mapping));
      if (state.useDeadLine) {
        formData.append("deadlineMinutes", state.deadlineMinutes);
      }
      await api.postForm("/activity", formData);
      setMessage(`Activity "${state.name}" created.`);
      setState(defaultState());
      loadActivities();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader title="Add New Activity" />
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "20px" }}>
        <section>
          <h3 className="section-title">Step 1 - Activity Details</h3>
          <div className="form-grid" style={{ padding: "0" }}>
            <TextField label="Activity Name" value={state.name} onChange={(v) => patch({ name: v })} />
            <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={state.lob} onChange={(v) => patch({ lob: v })} />
            <SelectField
              label="Lead Source"
              placeholder="Select Lead Source"
              options={options.leadSources}
              value={state.leadSource}
              onChange={(v) => patch({ leadSource: v })}
            />
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 className="section-title">Step 2 - Upload Data File</h3>
          <label className="field">
            <span className="field-label">Upload CSV File</span>
            <input type="file" className="file-input" accept=".csv" onChange={(e) => handleFileChange(e.target.files[0] ?? null)} />
          </label>
          {state.csv ? (
            <div className="form-grid" style={{ padding: "0" }}>
              {state.columns.map((column) => {
                const field = state.mapping[column];
                return (
                  <SelectField
                    key={column}
                    label={`Column "${column}" maps to`}
                    placeholder="Do not import"
                    value={field ?? ""}
                    onChange={(v) => updateMapping(column, v)}
                    options={[
                      { label: "Do not import", value: "" },
                      { label: "Primary Data Field", value: "primary" },
                      ...state.extraColumns.map((c) => ({ label: c, value: c })),
                    ]}
                  />
                );
              })}
            </div>
          ) : null}
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 className="section-title">Step 3 - Priority and Deadline (Optional)</h3>
          <div className="form-grid" style={{ padding: "0" }}>
            <Toggle label="Enable Priority Based Assignment" checked={state.usePriority} onChange={(v) => patch({ usePriority: v })} />
            <Toggle label="Enable Data Deadline" checked={state.useDeadLine} onChange={(v) => patch({ useDeadLine: v })} />
          </div>
          {state.usePriority ? (
            <div className="form-grid" style={{ padding: "0" }}>
              <SelectField
                label="Priority Column"
                placeholder="Select Column"
                value={state.priorityColumn}
                disabled={!state.csv}
                onChange={(v) => patch({ priorityColumn: v })}
                options={[
                  { label: "Primary Data Field", value: "primary" },
                  ...state.extraColumns.map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
          ) : null}
          {state.useDeadLine ? (
            <div className="form-grid" style={{ padding: "0" }}>
              <TextField
                label="Deadline (minutes)"
                type="number"
                value={state.deadlineMinutes}
                onChange={(v) => patch({ deadlineMinutes: v })}
              />
            </div>
          ) : null}
          {primaryField ? (
            <p style={{ fontSize: "13px" }}>
              <Badge tone="brand">Primary</Badge>&nbsp; {primaryField}
            </p>
          ) : null}
        </section>

        {message ? <p style={{ fontSize: "13px", color: "var(--success-500)" }}>{message}</p> : null}
        <Button label={saving ? "Creating…" : "Create Activity"} onClick={handleSubmit} disabled={!canSubmit || saving} />
      </div>
      </Card>

      <Card>
        <CardHeader title="Configured Activities" />
        <DataTable
          columns={[
            { key: "name", header: "Activity Name" },
            { key: "lobName", header: "LOB Name" },
            { key: "activityType", header: "Activity Type" },
            { key: "createdAt", header: "Creation Date", render: (r) => formatDateTime(r.createdAt) },
            {
              key: "enabled",
              header: "Enabled",
              sortValue: (r) => (r.enabled ? 1 : 0),
              render: (r) => <Badge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "Active" : "Disabled"}</Badge>,
            },
          ]}
          rows={activities}
          loading={activitiesLoading}
          exportFileName="configured-activities"
          emptyHint="No activities configured yet."
        />
      </Card>
    </>
  );
}

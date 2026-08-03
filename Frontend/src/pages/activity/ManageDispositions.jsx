import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";

function DispositionForm({ lobs }) {
  const [lob, setLob] = useState("");
  const [name, setName] = useState("");
  const [connected, setConnected] = useState(false);
  const [closed, setClosed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = Boolean(lob && name.trim());

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await api.post("/activity/dispositions", { lob, name, connected, closed, completed });
      setMessage(`Disposition "${name}" added.`);
      setName("");
      setConnected(false);
      setClosed(false);
      setCompleted(false);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={lob} onChange={setLob} />
      <div style={{ borderTop: "1px solid var(--ink-100)" }} />
      <TextField label="New Disposition" value={name} onChange={setName} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Toggle label="Connected" checked={connected} onChange={setConnected} />
        <Toggle label="Closed - Record will not come back for Reattempt" checked={closed} onChange={setClosed} />
        <Toggle label="Completed - Record is marked as Success" checked={completed} onChange={setCompleted} />
      </div>
      {message ? <p style={{ fontSize: "13px", color: "var(--success-500)" }}>{message}</p> : null}
      <Button label={saving ? "Saving…" : "Add New Disposition"} onClick={handleSubmit} disabled={!canSubmit || saving} />
    </div>
  );
}

function SubDispositionForm({ lobs }) {
  const [lob, setLob] = useState("");
  const [dispositions, setDispositions] = useState([]);
  const [disposition, setDisposition] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = Boolean(lob && disposition && name.trim());

  async function handleLobChange(v) {
    setLob(v);
    setDisposition("");
    if (v) {
      const rows = await api.get("/activity/dispositions", { lob: v }).catch(() => []);
      setDispositions(rows);
    } else {
      setDispositions([]);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await api.post("/activity/sub-dispositions", { lob, disposition, name });
      setMessage(`Sub-disposition "${name}" added.`);
      setName("");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={lob} onChange={handleLobChange} />
      <SelectField
        label="Select Disposition"
        placeholder="Select Disposition"
        options={dispositions}
        value={disposition}
        disabled={!lob}
        onChange={setDisposition}
      />
      <TextField label="New SubDisposition" value={name} onChange={setName} />
      {message ? <p style={{ fontSize: "13px", color: "var(--success-500)" }}>{message}</p> : null}
      <Button label={saving ? "Saving…" : "Add New SubDisposition"} onClick={handleSubmit} disabled={!canSubmit || saving} />
    </div>
  );
}

export default function ManageDispositions() {
  const [mode, setMode] = useState("dispositions");
  const [lobs, setLobs] = useState([]);

  useEffect(() => {
    api
      .get("/activity/lobs")
      .then(setLobs)
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader
        title={mode === "dispositions" ? "Add Disposition" : "Add SubDisposition"}
        actions={[
          <Button key="d" label="Add Dispositions" variant={mode === "dispositions" ? "primary" : "secondary"} size="sm" onClick={() => setMode("dispositions")} />,
          <Button key="s" label="Add SubDispositions" variant={mode === "sub-dispositions" ? "success" : "secondary"} size="sm" onClick={() => setMode("sub-dispositions")} />,
        ]}
      />
      {mode === "dispositions" ? <DispositionForm lobs={lobs} /> : <SubDispositionForm lobs={lobs} />}
    </Card>
  );
}

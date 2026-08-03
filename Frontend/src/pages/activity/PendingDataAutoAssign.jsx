import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";

const STRATEGY_OPTIONS = [
  { label: "Round Robin", value: "round_robin" },
  { label: "Priority Based", value: "priority" },
  { label: "Equal Split", value: "equal_split" },
];

export default function PendingDataAutoAssign() {
  const [activities, setActivities] = useState([]);
  const [activity, setActivity] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [strategy, setStrategy] = useState("round_robin");
  const [inactiveMinutes, setInactiveMinutes] = useState("30");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/activity/list-options")
      .then(setActivities)
      .catch(() => {});
  }, []);

  const showConfig = Boolean(activity);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await api.post(`/activity/${activity}/auto-assign`, {
        enabled,
        strategy,
        inactiveMinutes: Number(inactiveMinutes),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // keep button in a recoverable state
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Pending Data Auto Assign" />
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
        <div style={{ maxWidth: "320px" }}>
          <SelectField label="Select Activity" placeholder="Select Activity" options={activities} value={activity} onChange={setActivity} />
        </div>

        {showConfig ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderTop: "1px solid var(--ink-100)", paddingTop: "20px" }}>
              <Toggle label="Enable automatic reassignment for this activity" checked={enabled} onChange={setEnabled} />
            </div>
            <div className="form-grid" style={{ padding: "0" }}>
              <SelectField label="Assignment Strategy" value={strategy} options={STRATEGY_OPTIONS} disabled={!enabled} onChange={setStrategy} />
              <TextField
                label="Reassign after advisor inactive for (minutes)"
                type="number"
                value={inactiveMinutes}
                disabled={!enabled}
                onChange={setInactiveMinutes}
              />
            </div>
            {saved ? (
              <p style={{ fontSize: "13px", color: "var(--success-500)" }}>Configuration saved.</p>
            ) : null}
            <Button label={saving ? "Saving…" : "Save Configuration"} onClick={handleSave} disabled={saving} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

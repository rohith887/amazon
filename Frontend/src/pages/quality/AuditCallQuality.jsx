import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { todayIso } from "../../utils/date.js";

const AUDIT_COLUMNS = [
  { key: "callId", header: "Call ID" },
  { key: "recordingUrl", header: "Recording" },
  { key: "agent", header: "Agent" },
  { key: "score", header: "Score", align: "right" },
  { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Completed" ? "success" : "warning"}>{r.status}</Badge> },
  { key: "auditedOn", header: "Audited On" },
];

export default function AuditCallQuality() {
  const [lobs, setLobs] = useState([]);
  const [lob, setLob] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/quality/lobs")
      .then(setLobs)
      .catch(() => {});
  }, []);

  async function handleSearch() {
    if (!lob) return;
    setLoading(true);
    try {
      const rows = await api.get("/quality/calls", { lob, startDate, endDate });
      setCalls(rows);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Audit Call Quality" />
      <CardBody>
        <div className="form-grid" style={{ padding: "0" }}>
          <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={lob} onChange={setLob} />
          <TextField label="Start Date" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="End Date" type="date" value={endDate} onChange={setEndDate} />
          <div style={{ alignSelf: "flex-end" }}>
            <Button label={loading ? "Searching…" : "Search Calls"} onClick={handleSearch} disabled={!lob || loading} />
          </div>
        </div>
        <DataTable
          columns={AUDIT_COLUMNS}
          rows={calls}
          loading={loading}
          searchable
          exportFileName="audit-call-quality"
          emptyTitle="No calls found"
          emptyHint="Select an LOB and date range to fetch calls for auditing."
        />
      </CardBody>
    </Card>
  );
}

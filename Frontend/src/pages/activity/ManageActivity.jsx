import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { formatDateTime } from "../../utils/date.js";
import { downloadBlob } from "../../utils/download.js";

const TABS = [
  { key: "upload", label: "Upload Data", variant: "primary" },
  { key: "records", label: "Manage Records", variant: "success" },
  { key: "running-check", label: "Running Activity Check", variant: "success" },
  { key: "rcp-upload", label: "RCP Upload Data", variant: "primary" },
  { key: "rcp-report", label: "RCP Report", variant: "primary" },
  { key: "advisors", label: "Manage Advisors", variant: "danger" },
];

function UploadForm({ lobs, activities, endpoint, requireActivity = true }) {
  const [lob, setLob] = useState("");
  const [activity, setActivity] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const canSubmit = Boolean(lob && file && (!requireActivity || activity));

  async function handleUpload() {
    if (!canSubmit || uploading) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("lob", lob);
      if (activity) formData.append("activity", activity);
      formData.append("file", file);
      const result = await api.postForm(endpoint, formData);
      setMessage(`"${result.fileName}" uploaded (${result.imported ?? 0} records).`);
      setFile(null);
    } catch (err) {
      setMessage(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={lob} onChange={setLob} />
      <SelectField
        label={requireActivity ? "Select Activity (Campaign)" : "RCP Activity (auto-created)"}
        placeholder="Select Activity"
        options={activities}
        value={activity}
        disabled={!requireActivity}
        onChange={setActivity}
      />
      <label className="field">
        <span className="field-label">File</span>
        <input
          type="file"
          className="file-input"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
        />
      </label>
      {message ? <p style={{ fontSize: "13px", color: "var(--success-500)" }}>{message}</p> : null}
      <Button label={uploading ? "Uploading…" : "Upload Data"} onClick={handleUpload} disabled={!canSubmit || uploading} />
    </div>
  );
}

export default function ManageActivity() {
  const [tab, setTab] = useState("upload");
  const [lobs, setLobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [runningCheck, setRunningCheck] = useState([]);
  const [runningLoading, setRunningLoading] = useState(false);
  const [advisors, setAdvisors] = useState([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [rcpLob, setRcpLob] = useState("");
  const [downloadingRcp, setDownloadingRcp] = useState(false);

  useEffect(() => {
    api
      .get("/activity/lobs")
      .then(setLobs)
      .catch(() => {});
    api
      .get("/activity/list-options")
      .then(setActivities)
      .catch(() => {});
  }, []);

  async function handleRcpReport() {
    if (!rcpLob || downloadingRcp) return;
    setDownloadingRcp(true);
    try {
      const blob = await api.getBlob("/activity/rcp-report", { lob: rcpLob });
      downloadBlob(blob, "rcp-report.csv");
    } catch {
      // no-op
    } finally {
      setDownloadingRcp(false);
    }
  }

  useEffect(() => {
    if (tab === "records") {
      setRecordsLoading(true);
      api
        .get("/activity/records")
        .then(setRecords)
        .catch(() => {})
        .finally(() => setRecordsLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "running-check") {
      setRunningLoading(true);
      api
        .get("/activity/running-check")
        .then(setRunningCheck)
        .catch(() => {})
        .finally(() => setRunningLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "advisors") {
      setAdvisorsLoading(true);
      api
        .get("/activity/advisors")
        .then(setAdvisors)
        .catch(() => {})
        .finally(() => setAdvisorsLoading(false));
    }
  }, [tab]);

  return (
    <Card>
      <CardHeader
        title="Activity File Upload"
        actions={TABS.map((t) => (
          <Button key={t.key} label={t.label} variant={tab === t.key ? t.variant : "secondary"} size="sm" onClick={() => setTab(t.key)} />
        ))}
      />
      <div>
        {tab === "upload" ? <UploadForm lobs={lobs} activities={activities} endpoint="/activity/upload" /> : null}
        {tab === "rcp-upload" ? <UploadForm lobs={lobs} activities={activities} endpoint="/activity/rcp-upload" requireActivity={false} /> : null}

        {tab === "records" ? (
          <DataTable
            columns={[
              { key: "merchantId", header: "Merchant ID" },
              { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Processed" ? "success" : "warning"}>{r.status}</Badge> },
              { key: "uploadedOn", header: "Uploaded On", render: (r) => formatDateTime(r.uploadedOn) },
              { key: "fetchedBy", header: "Fetched By" },
            ]}
            rows={records}
            loading={recordsLoading}
            exportFileName="manage-records"
          />
        ) : null}

        {tab === "running-check" ? (
          <DataTable
            columns={[
              { key: "fileName", header: "File Name" },
              { key: "totalRecords", header: "Total Records", align: "right" },
              { key: "processed", header: "Processed", align: "right" },
              { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Completed" ? "success" : "brand"}>{r.status}</Badge> },
            ]}
            rows={runningCheck}
            loading={runningLoading}
            exportFileName="running-activity-check"
          />
        ) : null}

        {tab === "rcp-report" ? (
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap", padding: "20px" }}>
            <div style={{ maxWidth: "280px", width: "100%" }}>
              <SelectField label="Select LOB" placeholder="Select LOB" options={lobs} value={rcpLob} onChange={setRcpLob} />
            </div>
            <Button label={downloadingRcp ? "Downloading…" : "Download RCP Report"} onClick={handleRcpReport} disabled={!rcpLob || downloadingRcp} />
          </div>
        ) : null}

        {tab === "advisors" ? (
          <DataTable
            columns={[
              { key: "advisor", header: "Advisor" },
              { key: "teamLeader", header: "Team Leader" },
              { key: "assigned", header: "Assigned", align: "center", render: (r) => <Toggle checked={Boolean(r.assigned)} /> },
            ]}
            rows={advisors}
            loading={advisorsLoading}
            exportFileName="manage-advisors"
          />
        ) : null}
      </div>
    </Card>
  );
}

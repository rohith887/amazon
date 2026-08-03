import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { todayIso } from "../../utils/date.js";
import { downloadBlob } from "../../utils/download.js";

const AUDIENCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Team Leader Wise", value: "team_leader" },
  { label: "Agent Wise", value: "agent" },
];

export default function ActivityGenerateReport() {
  const [reportType, setReportType] = useState("");
  const [activity, setActivity] = useState("");
  const [audience, setAudience] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [options, setOptions] = useState({ reportTypes: [], activities: [], teamLeaders: [], agents: [] });
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    api
      .get("/activity/generate-report/options")
      .then(setOptions)
      .catch(() => {});
  }, []);

  const assigneeOptions = [
    { label: "All", value: "all" },
    ...(audience === "team_leader" ? options.teamLeaders : audience === "agent" ? options.agents : []),
  ];
  const assigneeDisabled = audience === "all";
  const canDownload = Boolean(reportType && activity);

  function handleAudienceChange(v) {
    setAudience(v);
    setAssignee("all");
  }

  async function handleDownload(format) {
    if (!canDownload || downloading) return;
    setDownloading(format);
    try {
      const blob = await api.getBlob("/activity/generate-report", { reportType, activity, audience, assignee, startDate, endDate, format });
      downloadBlob(blob, `activity-report_${startDate}_${endDate}.${format}`);
    } finally {
      setDownloading("");
    }
  }

  return (
    <Card>
      <CardHeader title="Activity Report" />
      <CardBody>
        <div className="form-grid" style={{ padding: "0" }}>
          <SelectField label="Report Type" placeholder="Select Report" options={options.reportTypes} value={reportType} onChange={setReportType} />
          <SelectField label="Select Activity" placeholder="Select Activity" options={options.activities} value={activity} onChange={setActivity} />
          <SelectField label="Select Audience" value={audience} options={AUDIENCE_OPTIONS} onChange={handleAudienceChange} />
          <SelectField label="Select Team Leader / Agent" value={assignee} options={assigneeOptions} disabled={assigneeDisabled} onChange={setAssignee} />
          <TextField label="Select Start Date" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="Select End Date" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <div className="form-grid" style={{ padding: "0", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Button
            label={downloading === "xlsx" ? "Preparing…" : "XLSX - Download Report"}
            disabled={!canDownload || Boolean(downloading)}
            onClick={() => handleDownload("xlsx")}
          />
          <Button
            label={downloading === "csv" ? "Preparing…" : "CSV - Download Report"}
            variant="secondary"
            disabled={!canDownload || Boolean(downloading)}
            onClick={() => handleDownload("csv")}
          />
        </div>
      </CardBody>
    </Card>
  );
}

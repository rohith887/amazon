import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { todayIso, daysAgoIso } from "../../utils/date.js";
import { downloadBlob } from "../../utils/download.js";

const AUDIENCE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Team Leader Wise", value: "team_leader" },
  { label: "Agent Wise", value: "agent" },
];

export default function QualityGenerateReport() {
  const [reportType, setReportType] = useState("agent_quality");
  const [audience, setAudience] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [startDate, setStartDate] = useState(daysAgoIso(7));
  const [endDate, setEndDate] = useState(todayIso());
  const [options, setOptions] = useState({ reportTypes: [], teamLeaders: [], agents: [] });
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    api
      .get("/quality/generate-report/options")
      .then(setOptions)
      .catch(() => {});
  }, []);

  const assigneeOptions = [
    { label: "All", value: "all" },
    ...(audience === "team_leader" ? options.teamLeaders : audience === "agent" ? options.agents : []),
  ];
  const assigneeDisabled = audience === "all";
  const canDownload = true;

  function handleAudienceChange(v) {
    setAudience(v);
    setAssignee("all");
  }

  async function handleDownload(format) {
    if (!canDownload || downloading) return;
    setDownloading(format);
    try {
      const blob = await api.getBlob("/quality/generate-report", { reportType, audience, assignee, startDate, endDate, format });
      downloadBlob(blob, `quality-report_${startDate}_${endDate}.${format}`);
    } finally {
      setDownloading("");
    }
  }

  return (
    <Card>
      <CardHeader title="Quality Audit Report" />
      <CardBody>
        <div className="form-grid" style={{ padding: "0" }}>
          <SelectField label="Select Report Type" value={reportType} options={options.reportTypes} onChange={setReportType} />
          <SelectField label="Select Audience" value={audience} options={AUDIENCE_OPTIONS} onChange={handleAudienceChange} />
          <SelectField label="Select Team Leader / Agent" value={assignee} options={assigneeOptions} disabled={assigneeDisabled} onChange={setAssignee} />
          <TextField label="Select Start Date" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="Select End Date" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <div className="form-grid" style={{ padding: "0", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Button
            label={downloading === "xlsx" ? "Preparing…" : "XLSX - Download Report"}
            disabled={Boolean(downloading)}
            onClick={() => handleDownload("xlsx")}
          />
          <Button
            label={downloading === "csv" ? "Preparing…" : "CSV - Download Report"}
            variant="secondary"
            disabled={Boolean(downloading)}
            onClick={() => handleDownload("csv")}
          />
        </div>
      </CardBody>
    </Card>
  );
}

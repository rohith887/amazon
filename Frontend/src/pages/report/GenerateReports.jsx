import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { todayIso } from "../../utils/date.js";
import { downloadBlob } from "../../utils/download.js";

export default function GenerateReports() {
  const [reportType, setReportType] = useState("");
  const [lob, setLob] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [options, setOptions] = useState({ reportTypes: [], lobs: [] });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get("/report/generate/options")
      .then(setOptions)
      .catch(() => {});
  }, []);

  const canDownload = Boolean(reportType && lob);

  async function handleDownload() {
    if (!canDownload) return;
    setDownloading(true);
    try {
      const blob = await api.getBlob("/report/generate", { reportType, lob, startDate, endDate });
      downloadBlob(blob, `report_${startDate}_${endDate}.csv`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Generate Report" />
      <CardBody>
        <div className="form-grid" style={{ padding: "0" }}>
          <SelectField label="Report Type" placeholder="Select Report" options={options.reportTypes} value={reportType} onChange={setReportType} />
          <SelectField label="Select LOB" placeholder="Select LOB" options={options.lobs} value={lob} onChange={setLob} />
          <TextField label="Select Start Date" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="Select End Date" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <Button label={downloading ? "Preparing…" : "Download Report"} disabled={!canDownload || downloading} onClick={handleDownload} />
      </CardBody>
    </Card>
  );
}

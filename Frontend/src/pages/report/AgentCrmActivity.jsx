import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { todayIso } from "../../utils/date.js";
import { downloadBlob } from "../../utils/download.js";

export default function AgentCrmActivity() {
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [lastUpdatedMinutesAgo, setLastUpdatedMinutesAgo] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get("/report/agent-crm-activity/meta")
      .then((meta) => setLastUpdatedMinutesAgo(meta.lastUpdatedMinutesAgo))
      .catch(() => {});
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await api.getBlob("/report/agent-crm-activity", { startDate, endDate });
      downloadBlob(blob, `agent-crm-activity_${startDate}_${endDate}.csv`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Agent CRM Activity Raw Data"
        actions={[<Badge key="updated">{`Last Updated : ${lastUpdatedMinutesAgo == null ? "—" : `${lastUpdatedMinutesAgo} min ago`}`}</Badge>]}
      />
      <CardBody>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <TextField label="Start Date" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="End Date" type="date" value={endDate} onChange={setEndDate} />
          <Button label={downloading ? "Preparing…" : "Download Report"} onClick={handleDownload} disabled={downloading} />
        </div>
      </CardBody>
    </Card>
  );
}

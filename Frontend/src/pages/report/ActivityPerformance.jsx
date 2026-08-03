import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { LegendBar } from "../../components/ui/LegendBar.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";

const LEGEND_ITEMS = [
  { abbr: "AD", full: "Advisor Assigned" },
  { abbr: "AL", full: "Allocated Records" },
  { abbr: "FR", full: "Fresh/Untouched Records" },
  { abbr: "INT", full: "Interactions Completed" },
  { abbr: "CL", full: "Closed Records" },
  { abbr: "COMP", full: "Successfully Completed Records" },
  { abbr: "COMP %", full: "Complete %" },
];

export default function ActivityPerformance() {
  const [lastUpdatedMinutesAgo, setLastUpdatedMinutesAgo] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/report/activity-performance")
      .then((data) => {
        if (cancelled) return;
        setLastUpdatedMinutesAgo(data.lastUpdatedMinutesAgo);
        setRows(data.rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader
        title="Activity Performance"
        actions={[<Badge key="updated">{`Last Updated : ${lastUpdatedMinutesAgo == null ? "—" : `${lastUpdatedMinutesAgo} min ago`}`}</Badge>]}
      />
      <LegendBar items={LEGEND_ITEMS} />
      <DataTable
        columns={[
          { key: "activity", header: "Activity" },
          { key: "ad", header: "AD", align: "right" },
          { key: "al", header: "AL", align: "right" },
          { key: "fr", header: "FR", align: "right" },
          { key: "int", header: "INT", align: "right" },
          { key: "cl", header: "CL", align: "right" },
          { key: "comp", header: "COMP", align: "right" },
          { key: "compPercentage", header: "COMP %", align: "right", render: (r) => Number(r.compPercentage ?? 0).toFixed(2) },
        ]}
        rows={rows}
        loading={loading}
        exportFileName="activity-performance"
      />
    </Card>
  );
}

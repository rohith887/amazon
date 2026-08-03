import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { LegendBar } from "../../components/ui/LegendBar.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";

const LEGEND_ITEMS = [
  { abbr: "AL", full: "Allocated Records" },
  { abbr: "FR", full: "Fresh/Untouched Records" },
  { abbr: "PR", full: "Processed Records" },
  { abbr: "INT", full: "Interactions Completed" },
  { abbr: "CL", full: "Closed Records" },
  { abbr: "COMP", full: "Successfully Completed Records" },
  { abbr: "PCB", full: "Pending Callbacks" },
];

export default function AdvisorPerformance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/report/advisor-performance")
      .then((data) => {
        if (!cancelled) setRows(data);
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
      <CardHeader title="Advisor Live Performance Status" />
      <LegendBar items={LEGEND_ITEMS} />
      <DataTable
        columns={[
          { key: "advisor", header: "Advisor" },
          { key: "lobName", header: "LOB" },
          { key: "prPercentage", header: "PR %", align: "right", render: (r) => `${Number(r.prPercentage ?? 0).toFixed(2)}%` },
          { key: "al", header: "AL", align: "right" },
          { key: "fr", header: "FR", align: "right" },
          { key: "pr", header: "PR", align: "right" },
          { key: "int", header: "INT", align: "right" },
          { key: "cl", header: "CL", align: "right" },
          { key: "comp", header: "COMP", align: "right" },
          { key: "pcb", header: "PCB", align: "right" },
        ]}
        rows={rows}
        loading={loading}
        exportFileName="advisor-performance"
      />
    </Card>
  );
}

import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { formatDateTime } from "../../utils/date.js";

export default function CallbackDetails() {
  const [todayCount, setTodayCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/report/callbacks")
      .then((data) => {
        if (cancelled) return;
        setTodayCount(data.todayCount);
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
      <CardHeader title="CallBacks Details" actions={[<Badge key="count">{`Today's Callbacks: ${todayCount.toLocaleString()}`}</Badge>]} />
      <DataTable
        columns={[
          { key: "advisor", header: "Advisor" },
          { key: "merchantId", header: "Merchant ID" },
          { key: "lob", header: "LOB" },
          { key: "recordTime", header: "Record Time", render: (r) => formatDateTime(r.recordTime) },
          { key: "callbackTime", header: "CallBack Time", render: (r) => formatDateTime(r.callbackTime) },
          { key: "type", header: "Type", render: (r) => <Badge tone={r.type === "RNR Callback" ? "warning" : "brand"}>{r.type}</Badge> },
        ]}
        rows={rows}
        loading={loading}
        exportFileName="callback-details"
      />
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField } from "../../components/ui/Field.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";

export default function ActivitySummary() {
  const [activity, setActivity] = useState("");
  const [activities, setActivities] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback((selectedActivity) => {
    setLoading(true);
    api
      .get("/report/activity-summary", { activity: selectedActivity })
      .then((data) => {
        setActivities(data.activities);
        setRows(data.rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(activity);
  }, [load, activity]);

  return (
    <Card>
      <CardHeader
        title="Activity Summary Data"
        actions={[
          <div key="activity" style={{ width: "240px" }}>
            <SelectField
              placeholder="Select Activity"
              value={activity}
              options={activities}
              onChange={(v) => setActivity(v)}
            />
          </div>,
        ]}
      />
      <DataTable
        columns={[
          { key: "priority", header: "Priority" },
          { key: "cnumber", header: "cnumber" },
          { key: "cheader", header: "cheader" },
          { key: "total", header: "Total", align: "right" },
          { key: "fetched", header: "Fetched", align: "right" },
          { key: "pending", header: "Pending", align: "right" },
        ]}
        rows={rows}
        loading={loading}
        exportFileName="activity-summary"
        emptyHint="Select an activity to view its record breakdown."
      />
    </Card>
  );
}

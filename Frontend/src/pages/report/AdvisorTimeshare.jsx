import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { SelectField } from "../../components/ui/Field.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";

const COLUMNS = [
  { key: "advisor", header: "Advisor" },
  { key: "teamLeader", header: "Team Leader" },
  { key: "interactionCount", header: "Interaction Count", align: "right" },
  { key: "completeCount", header: "Complete Count", align: "right" },
  { key: "closedCount", header: "Closed Count", align: "right" },
  { key: "interactionsPerHour", header: "Interactions Per Hour", align: "right" },
  { key: "completePerHour", header: "Complete PerHour", align: "right" },
  { key: "completePercentage", header: "Complete Percentage", align: "right" },
  { key: "idleTimePercentage", header: "IdleTime Percentage", align: "right" },
  { key: "loginTime", header: "Login Time", align: "right" },
  { key: "interactionTime", header: "Interaction Time", align: "right" },
  { key: "idleTime", header: "Idle Time", align: "right" },
  { key: "lunchBreak", header: "Lunch Break", align: "right" },
  { key: "teaBreak", header: "Tea Break", align: "right" },
  { key: "briefing", header: "Briefing", align: "right" },
];

export default function AdvisorTimeshare() {
  const [activity, setActivity] = useState("all");
  const [activities, setActivities] = useState([]);
  const [advisorCount, setAdvisorCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (selectedActivity) => {
      setLoading(true);
      api
        .get("/report/advisor-timeshare", { activity: selectedActivity })
        .then((data) => {
          setActivities([{ label: "All Activities", value: "all" }, ...data.activities]);
          setAdvisorCount(data.advisorCount);
          setRows(data.rows);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    load(activity);
  }, [load, activity]);

  return (
    <Card>
      <CardHeader
        title="Advisor Timeshare"
        actions={[
          <div key="activity" style={{ width: "220px" }}>
            <SelectField
              value={activity}
              options={activities}
              onChange={(v) => setActivity(v)}
            />
          </div>,
          <Badge key="count">{`Advisor Count: ${advisorCount}`}</Badge>,
        ]}
      />
      <DataTable columns={COLUMNS} rows={rows} loading={loading} exportFileName="advisor-timeshare" />
    </Card>
  );
}

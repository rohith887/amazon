import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { formatDuration } from "../../utils/date.js";

const LONG_CALL_THRESHOLD_SECONDS = 600;

export default function AdvisorLiveStatus() {
  const [advisorCount, setAdvisorCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/report/advisor-live-status")
      .then((data) => {
        if (cancelled) return;
        setAdvisorCount(data.advisorCount);
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
      <CardHeader title="Advisor Interaction Status" actions={[<Badge key="count">{`Advisor Count: ${advisorCount}`}</Badge>]} />
      <div className="table-scroll">
        {loading ? (
          <p style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-400)" }}>Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Leader</th>
                <th>Advisor</th>
                <th>LOB</th>
                <th>Activity</th>
                <th className="align-right">Activity Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isLong = r.durationSeconds >= LONG_CALL_THRESHOLD_SECONDS;
                const warnStyle = isLong ? { fontWeight: "600", color: "var(--warning-500)" } : {};
                return (
                  <tr key={i} style={isLong ? { background: "var(--warning-100)" } : {}}>
                    <td style={warnStyle}>{r.teamLeader}</td>
                    <td style={warnStyle}>{r.advisor}</td>
                    <td>{r.lobName}</td>
                    <td>
                      <Badge tone={r.activityState === "Live Call" ? "success" : "neutral"}>{r.activityState}</Badge>
                    </td>
                    <td className="align-right tabular-nums" style={warnStyle}>
                      {formatDuration(r.durationSeconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

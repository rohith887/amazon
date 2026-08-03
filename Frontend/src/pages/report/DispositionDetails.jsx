import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";

export default function DispositionDetails() {
  const [todayInteractions, setTodayInteractions] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/report/dispositions")
      .then((data) => {
        if (cancelled) return;
        setTodayInteractions(data.todayInteractions);
        setGroups(data.groups);
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
        title="Disposition Details"
        actions={[<Badge key="count">{`Today's Interactions: ${todayInteractions.toLocaleString()}`}</Badge>]}
      />
      <div style={{ maxHeight: "70vh", overflowY: "auto", padding: "20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-400)" }}>Loading…</p>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <div
              key={group.activityName}
              style={{ border: "1px solid var(--ink-100)", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "var(--success-500)",
                  color: "#fff",
                  padding: "8px 16px",
                  fontSize: "13.5px",
                  fontWeight: "500",
                }}
              >
                <span>{`Activity :: ${group.activityName}`}</span>
                <span>{`Agents Logged in :: ${group.agentsLoggedIn}`}</span>
              </div>
              <table style={{ width: "100%", fontSize: "13.5px" }}>
                <tbody>
                  {group.dispositions.map((d) => (
                    <tr key={d.name} style={{ borderBottom: "1px solid var(--ink-100)" }}>
                      <td style={{ padding: "8px 16px", color: "var(--brand-700)" }}>{d.name}</td>
                      <td style={{ padding: "8px 16px", textAlign: "right", color: "var(--ink-700)" }}>{String(d.count)}</td>
                      <td style={{ padding: "8px 16px", textAlign: "right", width: "90px", color: "var(--ink-500)" }}>
                        {Number(d.percentage ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--danger-500)", color: "#fff", fontWeight: "600" }}>
                    <td style={{ padding: "8px 16px" }}>TOTAL</td>
                    <td style={{ padding: "8px 16px", textAlign: "right" }}>{String(group.totalCount)}</td>
                    <td style={{ padding: "8px 16px", textAlign: "right" }}>100.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

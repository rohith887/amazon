import db from "../models/index.js";

function dayRange(startDate, endDate) {
  return {
    $gte: new Date(`${startDate}T00:00:00`),
    $lte: new Date(`${endDate}T23:59:59.999`),
  };
}

function hourLabel(d) {
  const h = String(d.getHours()).padStart(2, "0");
  return `${h}:00`;
}

/**
 * GET /dashboard?startDate&endDate&reportType&activity
 *
 * reportType: agent | team_leader | hour | activity
 *
 * Returns:
 * {
 *   totals: { outReach, connected, completed, closed },
 *   series: [{ name, outReach, connected, completed, closed }],
 *   reportTypes: [{ label, value }],
 *   activities: [{ label, value }]
 * }
 */
export async function getDashboard({ startDate, endDate, reportType = "agent", activity = "all" }) {
  const activities = await db.Activity.find().sort({ name: 1 }).lean();
  const activityOptions = [{ label: "All Activities", value: "all" }, ...activities.map((a) => ({ label: a.name, value: String(a._id) }))];

  const reportTypes = [
    { label: "Agent", value: "agent" },
    { label: "Team Leader", value: "team_leader" },
    { label: "Hour Wise", value: "hour" },
    { label: "Activity", value: "activity" },
  ];

  const where = {};
  if (startDate && endDate) where.startedAt = dayRange(startDate, endDate);

  if (activity && activity !== "all") where.activity = activity;

  const interactions = await db.Interaction.find(where)
    .populate("advisor", "userName teamLeaderName")
    .populate("activity", "name")
    .populate("disposition", "connected completed closed")
    .lean();

  const byKey = new Map();
  for (const interaction of interactions) {
    let groupName = "Unknown";
    if (reportType === "agent") groupName = interaction.advisor?.userName ?? "Unknown";
    else if (reportType === "team_leader") groupName = interaction.advisor?.teamLeaderName || "No Team Leader";
    else if (reportType === "hour") groupName = interaction.startedAt ? hourLabel(new Date(interaction.startedAt)) : "Unknown";
    else groupName = interaction.activity?.name ?? "Unknown";

    if (!byKey.has(groupName)) byKey.set(groupName, { name: groupName, outReach: 0, connected: 0, completed: 0, closed: 0 });
    const row = byKey.get(groupName);
    row.outReach += 1;
    if (interaction.disposition?.connected) row.connected += 1;
    if (interaction.disposition?.completed) row.completed += 1;
    if (interaction.disposition?.closed) row.closed += 1;
  }

  const series = [...byKey.values()];
  const totals = series.reduce(
    (acc, r) => ({
      outReach: acc.outReach + r.outReach,
      connected: acc.connected + r.connected,
      completed: acc.completed + r.completed,
      closed: acc.closed + r.closed,
    }),
    { outReach: 0, connected: 0, completed: 0, closed: 0 },
  );

  return { totals, series, reportTypes, activities: activityOptions };
}

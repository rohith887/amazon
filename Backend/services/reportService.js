import db from "../models/index.js";
import { sendRows } from "../utils/export.js";
import { ApiError } from "../utils/apiError.js";
import { syncService } from "./syncService.js";
import { REPORT_TYPES, dayRange, todayRange } from "../utils/reportTypes.js";

function toOptions(rows, valueKey, labelKey) {
  return rows.map((r) => ({ label: r[labelKey], value: String(r[valueKey]) }));
}

function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

function pct(num, denom) {
  return denom ? Math.round((num / denom) * 10000) / 100 : 0;
}

async function resolveLobId(lob) {
  if (!lob) return null;
  if (db.mongoose.Types.ObjectId.isValid(lob)) {
    const byId = await db.Lob.findById(lob).lean();
    if (byId) return byId._id;
  }
  const byName = await db.Lob.findOne({ name: lob }).lean();
  if (!byName) return null;
  return byName._id;
}

async function loadContext(where = {}) {
  const [records, interactions, callbacks, audits, timeEntries, loginLogs, dispositions, activities, lobs, users] = await Promise.all([
    db.Record.find(where.record).select("activity lob merchantId phone priority status assignedAdvisor fetchedAt createdAt extra").lean(),
    db.Interaction.find(where.interaction)
      .populate("advisor", "userName teamLeaderName role")
      .populate("activity", "name lob")
      .populate("disposition", "name connected closed completed")
      .lean(),
    db.Callback.find(where.callback).populate("advisor", "userName").lean(),
    db.Audit.find(where.audit)
      .populate("agent", "userName teamLeaderName")
      .populate("lob", "name")
      .lean(),
    db.TimeEntry.find(where.timeEntry).populate("user", "userName teamLeaderName role").lean(),
    db.LoginLog.find(where.loginLog).populate("user", "userName teamLeaderName role").lean(),
    db.Disposition.find().select("name connected closed completed").lean(),
    db.Activity.find().select("name").lean(),
    db.Lob.find().select("name").lean(),
    db.User.find().select("userName teamLeaderName").lean(),
  ]);
  return { records, interactions, callbacks, audits, timeEntries, loginLogs, dispositions, activities, lobs, users };
}

// Shared report row builder. Called by /report/generate, /activity/generate-report
// and /quality/generate-report with different filter slices.
export async function buildReportRows(reportType, { activity, lob, advisorId, teamLeaderId, startDate, endDate, shortCallSeconds = 30 } = {}) {
  const range = dayRange(startDate, endDate);
  const where = {
    record: {},
    interaction: {},
    callback: {},
    audit: {},
    timeEntry: {},
    loginLog: {},
  };

  if (lob) {
    const lobId = await resolveLobId(lob);
    if (lobId) {
      const lobActivityIds = (await db.Activity.find({ lob: lobId }).select("_id").lean()).map((a) => a._id);
      where.record.lob = lobId;
      where.audit.lob = lobId;
      where.callback.lob = lobId;
      if (lobActivityIds.length) {
        where.interaction.activity = { $in: lobActivityIds };
        where.timeEntry.activity = { $in: lobActivityIds };
        where.loginLog.activity = { $in: lobActivityIds };
      }
    }
  }
  if (activity) {
    where.record.activity = activity;
    where.interaction.activity = activity;
    where.timeEntry.activity = activity;
    where.loginLog.activity = activity;
  }
  if (advisorId) {
    where.record.assignedAdvisor = advisorId;
    where.interaction.advisor = advisorId;
    where.callback.advisor = advisorId;
    where.audit.agent = advisorId;
    where.timeEntry.user = advisorId;
    where.loginLog.user = advisorId;
  }
  if (teamLeaderId) {
    const tl = await db.User.findById(teamLeaderId).lean();
    const team = tl ? await db.User.find({ teamLeaderName: tl.userName }).select("_id").lean() : [];
    const ids = team.map((u) => u._id);
    if (ids.length) {
      where.record.assignedAdvisor = { $in: ids };
      where.interaction.advisor = { $in: ids };
      where.callback.advisor = { $in: ids };
      where.audit.agent = { $in: ids };
      where.timeEntry.user = { $in: ids };
      where.loginLog.user = { $in: ids };
    }
  }
  if (startDate || endDate) {
    where.interaction.startedAt = range;
    where.audit.auditedOn = range;
    where.callback.callbackTime = range;
    where.timeEntry.startedAt = range;
    where.loginLog.loginAt = range;
  }

  const ctx = await loadContext(where);

  switch (reportType) {
    case "agent_performance":
      return agentPerformanceRows(ctx, { activity, lob, startDate, endDate });
    case "agent_quality":
      return agentQualityRows(ctx);
    case "quality_data_dump":
      return ctx.audits.map((a) => ({
        callId: a.callId,
        date: a.auditedOn,
        advisor: a.agent?.userName ?? "",
        teamLeader: a.agent?.teamLeaderName ?? "",
        lob: a.lob?.name ?? "",
        score: a.score ?? "",
        passFail: a.passFail ?? "",
        errorCategory: a.errorCategory ?? "",
        remarks: a.remarks ?? "",
        status: a.status,
        recordingUrl: a.recordingUrl ?? "",
        qaParams: a.qaParams && Object.keys(a.qaParams).length ? JSON.stringify(a.qaParams) : "",
      }));
    case "quality_short_call":
      return ctx.interactions
        .filter((i) => (i.durationSeconds ?? 0) < shortCallSeconds)
        .map((i) => ({
          callId: String(i._id),
          date: i.startedAt,
          advisor: i.advisor?.userName ?? "",
          activity: i.activity?.name ?? "",
          disposition: i.disposition?.name ?? "",
          durationSeconds: i.durationSeconds ?? 0,
          recordingUrl: i.recordingUrl ?? "",
        }));
    case "interaction":
      return ctx.interactions.map((i) => ({
        callId: String(i._id),
        date: i.startedAt,
        advisor: i.advisor?.userName ?? "",
        activity: i.activity?.name ?? "",
        merchantId: i.merchantId ?? "",
        disposition: i.disposition?.name ?? "",
        status: i.status ?? "",
        durationSeconds: i.durationSeconds ?? 0,
        remarks: i.remarks ?? "",
        recordingUrl: i.recordingUrl ?? "",
      }));
    case "leads_completion":
      return leadsCompletionRows(ctx);
    case "leads_data_dump":
      return ctx.records.map((r) => ({
        leadId: String(r._id),
        merchantId: r.merchantId,
        merchantName: merchantName(r),
        activity: activityNameById(ctx, r.activity),
        lob: lobNameById(ctx, r.lob),
        phone: r.phone ?? "",
        status: r.status,
        priority: r.priority ?? "",
        assignedAgent: advisorNameById(ctx, r.assignedAdvisor),
        fetchedAt: r.fetchedAt,
        uploadedOn: r.createdAt,
      }));
    case "disposition":
      return dispositionRows(ctx);
    default:
      throw new ApiError(400, `Unknown report type "${reportType}"`);
  }
}

function merchantName(r) {
  return r.extra?.merchantName || r.extra?.merchant_name || r.extra?.name || r.extra?.customer || r.extra?.customerName || "";
}

function activityNameById(ctx, id) {
  const a = ctx.activities?.find((x) => String(x._id) === String(id));
  return a?.name ?? "";
}

function lobNameById(ctx, id) {
  const l = ctx.lobs?.find((x) => String(x._id) === String(id));
  return l?.name ?? "";
}

function advisorNameById(ctx, id) {
  const u = ctx.users?.find((x) => String(x._id) === String(id));
  return u?.userName ?? "";
}

function agentPerformanceRows(ctx) {
  const byAdvisor = new Map();
  for (const i of ctx.interactions) {
    const id = i.advisor?._id ? String(i.advisor._id) : "?";
    if (!byAdvisor.has(id)) byAdvisor.set(id, { advisor: i.advisor?.userName ?? "?", teamLeader: i.advisor?.teamLeaderName ?? "", calls: 0, talkTime: 0, sales: 0 });
    const row = byAdvisor.get(id);
    row.calls += 1;
    row.talkTime += i.durationSeconds ?? 0;
    if (i.disposition?.completed) row.sales += 1;
  }

  const loginByAdvisor = new Map();
  for (const l of ctx.loginLogs) {
    const id = l.user?._id ? String(l.user._id) : "?";
    const dur = l.durationSeconds ?? (l.logoutAt ? (l.logoutAt - l.loginAt) / 1000 : (Date.now() - l.loginAt) / 1000);
    loginByAdvisor.set(id, (loginByAdvisor.get(id) ?? 0) + dur);
  }

  const idleByAdvisor = new Map();
  for (const t of ctx.timeEntries) {
    if (t.status !== "idle") continue;
    const id = t.user?._id ? String(t.user._id) : "?";
    const dur = t.durationSeconds ?? (t.endedAt ? (t.endedAt - t.startedAt) / 1000 : (Date.now() - t.startedAt) / 1000);
    idleByAdvisor.set(id, (idleByAdvisor.get(id) ?? 0) + dur);
  }

  const rows = [];
  for (const [id, row] of byAdvisor) {
    const calls = row.calls;
    const loginHours = (loginByAdvisor.get(id) ?? 0) / 3600;
    rows.push({
      advisor: row.advisor,
      teamLeader: row.teamLeader,
      callsHandled: calls,
      ahtSeconds: calls ? Math.round(row.talkTime / calls) : 0,
      talkTimeSeconds: Math.round(row.talkTime),
      idleTimeSeconds: Math.round(idleByAdvisor.get(id) ?? 0),
      sales: row.sales,
      conversionPercentage: pct(row.sales, calls),
      loginHours: Math.round(loginHours * 100) / 100,
    });
  }
  return rows.sort((a, b) => b.callsHandled - a.callsHandled);
}

function agentQualityRows(ctx) {
  const byAdvisor = new Map();
  for (const a of ctx.audits) {
    const id = a.agent?._id ? String(a.agent._id) : "?";
    if (!byAdvisor.has(id)) {
      byAdvisor.set(id, { advisor: a.agent?.userName ?? "?", teamLeader: a.agent?.teamLeaderName ?? "", audits: 0, scoreSum: 0, pass: 0, fail: 0, remarks: [] });
    }
    const row = byAdvisor.get(id);
    row.audits += 1;
    row.scoreSum += a.score ?? 0;
    if (a.passFail === "Pass") row.pass += 1;
    if (a.passFail === "Fail") row.fail += 1;
    if (a.remarks) row.remarks.push(a.remarks);
  }
  return [...byAdvisor.values()].map((r) => ({
    advisor: r.advisor,
    teamLeader: r.teamLeader,
    audits: r.audits,
    avgScore: r.audits ? Math.round((r.scoreSum / r.audits) * 100) / 100 : 0,
    pass: r.pass,
    fail: r.fail,
    compliance: r.audits ? pct(r.pass, r.audits) : 0,
    remarks: r.remarks.slice(-1)[0] ?? "",
  }));
}

function leadsCompletionRows(ctx) {
  const byAdvisor = new Map();
  for (const r of ctx.records) {
    const id = r.assignedAdvisor ? String(r.assignedAdvisor) : "unassigned";
    if (!byAdvisor.has(id)) byAdvisor.set(id, { advisor: r.assignedAdvisor ? advisorNameById(ctx, r.assignedAdvisor) : "Unassigned", total: 0, completed: 0, pending: 0, closed: 0 });
    const row = byAdvisor.get(id);
    row.total += 1;
    if (r.status === "completed") row.completed += 1;
    else if (r.status === "closed") row.closed += 1;
    else row.pending += 1;
  }
  return [...byAdvisor.values()].map((r) => ({
    advisor: r.advisor,
    totalLeads: r.total,
    completed: r.completed,
    pending: r.pending,
    closed: r.closed,
    completionPercentage: pct(r.completed, r.total),
  }));
}

function dispositionRows(ctx) {
  const counts = new Map();
  let total = 0;
  for (const i of ctx.interactions) {
    const name = i.disposition?.name ?? "Other";
    counts.set(name, (counts.get(name) ?? 0) + 1);
    total += 1;
  }
  return [...counts.entries()]
    .map(([name, count]) => ({
      disposition: name,
      count,
      connected: ctx.dispositions.find((d) => d.name === name)?.connected ? "Yes" : "No",
      closed: ctx.dispositions.find((d) => d.name === name)?.closed ? "Yes" : "No",
      completed: ctx.dispositions.find((d) => d.name === name)?.completed ? "Yes" : "No",
      percentage: pct(count, total),
    }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------- endpoints

// GET /report/generate/options
export async function getGenerateOptions() {
  const lobs = await db.Lob.find().sort({ name: 1 }).lean();
  return { reportTypes: REPORT_TYPES, lobs: toOptions(lobs, "_id", "name") };
}

// GET /report/generate
export async function generateReport({ reportType, lob, startDate, endDate }) {
  const rows = await buildReportRows(reportType, { lob, startDate, endDate });
  const today = new Date().toISOString().slice(0, 10);
  return {
    rows,
    filename: `report_${reportType}_${startDate ?? today}_${endDate ?? today}`,
    format: "csv",
  };
}

// GET /report/users
export async function listUsers({ role, teamLeader } = {}) {
  const where = {};
  if (role) where.role = role;
  if (teamLeader) where.teamLeaderName = teamLeader;
  const users = await db.User.find(where).sort({ userName: 1 }).lean();
  return users.map((u) => ({
    id: String(u._id),
    teamLeaderName: u.teamLeaderName,
    userName: u.userName,
    alias: u.alias,
    sipId: u.sipId,
    empId: u.empId,
    email: u.email,
    lobActivity: u.lobActivity,
    fetchStrategy: u.fetchStrategy,
    enabled: u.enabled,
    role: u.role,
    location: u.location,
  }));
}

// POST /report/users — Add New User
export async function createUser(fields) {
  const email = (fields.email ?? "").trim().toLowerCase();
  if (!fields.userName || !email) throw new ApiError(400, "User name and email are required");
  if (fields.role && !["agent", "team_leader", "trainer", "admin"].includes(fields.role)) {
    throw new ApiError(400, "Invalid role");
  }
  const exists = await db.User.findOne({ email });
  if (exists) throw new ApiError(409, "A user with that email already exists");
  const user = await db.User.create({
    teamLeaderName: fields.teamLeaderName || null,
    userName: fields.userName.trim(),
    alias: fields.alias || null,
    sipId: fields.sipId || null,
    empId: fields.empId || null,
    email,
    lobActivity: fields.lobActivity || null,
    fetchStrategy: fields.fetchStrategy || null,
    enabled: fields.enabled !== undefined ? Boolean(fields.enabled) : true,
    role: fields.role || "agent",
    location: fields.location || null,
  });
  return { id: String(user._id) };
}

// PATCH /report/users/:id — Manage User
export async function updateUser(id, patch) {
  const user = await db.User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  if (patch.role && !["agent", "team_leader", "trainer", "admin"].includes(patch.role)) {
    throw new ApiError(400, "Invalid role");
  }
  const allowed = ["teamLeaderName", "userName", "alias", "sipId", "empId", "email", "lobActivity", "fetchStrategy", "enabled", "role", "location"];
  for (const key of allowed) {
    if (patch[key] !== undefined) user[key] = key === "enabled" ? Boolean(patch[key]) : patch[key];
  }
  if (patch.email) {
    const email = String(patch.email).trim().toLowerCase();
    const dup = await db.User.findOne({ email, _id: { $ne: user._id } });
    if (dup) throw new ApiError(409, "A user with that email already exists");
    user.email = email;
  }
  await user.save();
  return { id: String(user._id) };
}

// GET /report/callbacks
export async function getCallbacks() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const callbacks = await db.Callback.find({ callbackTime: { $gte: dayStart } })
    .populate("advisor", "userName")
    .populate("record", "merchantId fetchedAt")
    .populate("lob", "name")
    .lean();

  const rows = callbacks.map((c) => ({
    advisor: c.advisor?.userName ?? "",
    merchantId: c.record?.merchantId ?? "",
    lob: c.lob?.name ?? "",
    recordTime: c.record?.fetchedAt ?? null,
    callbackTime: c.callbackTime,
    type: c.type,
  }));
  return { todayCount: callbacks.length, rows };
}

// GET /report/dispositions
export async function getDispositionDetails() {
  const range = todayRange();
  const interactions = await db.Interaction.find({ startedAt: range })
    .populate("advisor", "userName")
    .populate("activity", "name")
    .populate("disposition", "name")
    .lean();

  const groupsMap = new Map();
  let todayInteractions = 0;
  for (const i of interactions) {
    const activityName = i.activity?.name ?? "Unknown";
    if (!groupsMap.has(activityName)) {
      groupsMap.set(activityName, { activityName, agentsLoggedIn: new Set(), totalCount: 0, dispositions: new Map() });
    }
    const group = groupsMap.get(activityName);
    group.totalCount += 1;
    todayInteractions += 1;
    if (i.advisor?._id) group.agentsLoggedIn.add(String(i.advisor._id));
    const name = i.disposition?.name ?? "Other";
    group.dispositions.set(name, (group.dispositions.get(name) ?? 0) + 1);
  }

  const groups = [...groupsMap.values()].map((g) => ({
    activityName: g.activityName,
    agentsLoggedIn: g.agentsLoggedIn.size,
    totalCount: g.totalCount,
    dispositions: [...g.dispositions.entries()]
      .map(([name, count]) => ({ name, count, percentage: pct(count, g.totalCount) }))
      .sort((a, b) => b.count - a.count),
  }));

  return { todayInteractions, groups };
}

// GET /report/merchant/:id
export async function getMerchant(id) {
  const record = await db.Record.findOne({ merchantId: id })
    .populate("activity", "name")
    .populate("lob", "name")
    .lean();
  if (!record) throw new ApiError(404, "Merchant not found");

  const interactions = await db.Interaction.find({ record: record._id })
    .populate("advisor", "userName")
    .populate("activity", "name")
    .populate("disposition", "name")
    .sort({ startedAt: -1 })
    .lean();

  return {
    merchantId: record.merchantId,
    merchantName: merchantName(record),
    lob: record.lob?.name ?? "",
    activity: record.activity?.name ?? "",
    phone: record.phone ?? "",
    status: record.status,
    priority: record.priority ?? "",
    interactions: interactions.map((i) => ({
      date: i.startedAt,
      advisor: i.advisor?.userName ?? "",
      activity: i.activity?.name ?? "",
      disposition: i.disposition?.name ?? "",
      remarks: i.remarks ?? "",
      durationSeconds: i.durationSeconds ?? 0,
    })),
  };
}

// GET /report/advisor-timeshare?activity
export async function getAdvisorTimeshare({ activity }) {
  const activities = await db.Activity.find().sort({ name: 1 }).lean();
  const range = todayRange();
  const where = { startedAt: range };
  if (activity && activity !== "all") where.activity = activity;

  const [timeEntries, loginLogs, interactions] = await Promise.all([
    db.TimeEntry.find(where).populate("user", "userName teamLeaderName").lean(),
    db.LoginLog.find(where).populate("user", "userName teamLeaderName").lean(),
    db.Interaction.find(where)
      .populate("advisor", "userName teamLeaderName")
      .populate("disposition", "name connected closed completed")
      .lean(),
  ]);

  const buckets = { talking: 0, idle: 0, lunch: 0, tea: 0, briefing: 0 };
  const advisorRows = new Map();
  const entryDur = (t) => t.durationSeconds ?? (t.endedAt ? (t.endedAt - t.startedAt) / 1000 : (Date.now() - t.startedAt) / 1000);

  for (const t of timeEntries) {
    const id = t.user?._id ? String(t.user._id) : "?";
    if (!advisorRows.has(id)) advisorRows.set(id, { advisor: t.user?.userName ?? "?", teamLeader: t.user?.teamLeaderName ?? "", ...buckets, loginTime: 0 });
    const row = advisorRows.get(id);
    const dur = entryDur(t);
    if (t.status === "talking") row.talking += dur;
    else if (t.status === "idle") row.idle += dur;
    else if (t.status === "lunch") row.lunch += dur;
    else if (t.status === "tea") row.tea += dur;
    else if (t.status === "briefing") row.briefing += dur;
  }

  for (const l of loginLogs) {
    const id = l.user?._id ? String(l.user._id) : "?";
    if (!advisorRows.has(id)) advisorRows.set(id, { advisor: l.user?.userName ?? "?", teamLeader: l.user?.teamLeaderName ?? "", ...buckets, loginTime: 0 });
    const dur = l.durationSeconds ?? (l.logoutAt ? (l.logoutAt - l.loginAt) / 1000 : (Date.now() - l.loginAt) / 1000);
    advisorRows.get(id).loginTime += dur;
  }

  const interactionCount = new Map();
  const completeCount = new Map();
  const closedCount = new Map();
  for (const i of interactions) {
    const id = i.advisor?._id ? String(i.advisor._id) : "?";
    interactionCount.set(id, (interactionCount.get(id) ?? 0) + 1);
    if (i.disposition?.completed) completeCount.set(id, (completeCount.get(id) ?? 0) + 1);
    if (i.disposition?.closed) closedCount.set(id, (closedCount.get(id) ?? 0) + 1);
  }

  const rows = [...advisorRows.entries()].map(([id, r]) => {
    const int = interactionCount.get(id) ?? 0;
    const loginHours = r.loginTime / 3600;
    return {
      advisor: r.advisor,
      teamLeader: r.teamLeader,
      interactionCount: int,
      completeCount: completeCount.get(id) ?? 0,
      closedCount: closedCount.get(id) ?? 0,
      interactionsPerHour: Math.round((loginHours ? int / loginHours : 0) * 100) / 100,
      completePerHour: Math.round((loginHours ? (completeCount.get(id) ?? 0) / loginHours : 0) * 100) / 100,
      completePercentage: pct(completeCount.get(id) ?? 0, int),
      idleTimePercentage: pct(r.idle, r.loginTime),
      loginTime: fmtDuration(r.loginTime),
      interactionTime: fmtDuration(r.talking),
      idleTime: fmtDuration(r.idle),
      lunchBreak: fmtDuration(r.lunch),
      teaBreak: fmtDuration(r.tea),
      briefing: fmtDuration(r.briefing),
    };
  });

  return {
    activities: toOptions(activities, "_id", "name"),
    advisorCount: rows.length,
    rows,
  };
}

// GET /report/activity-summary?activity
export async function getActivitySummary({ activity }) {
  const activities = await db.Activity.find().sort({ name: 1 }).lean();
  const where = {};
  if (activity) where.activity = activity;
  const records = await db.Record.find(where).select("priority assignedAdvisor status").lean();

  const groups = new Map();
  for (const r of records) {
    const key = r.priority ?? "-";
    if (!groups.has(key)) groups.set(key, { total: 0, fetched: 0, pending: 0 });
    const g = groups.get(key);
    g.total += 1;
    if (r.assignedAdvisor) g.fetched += 1;
    else g.pending += 1;
  }

  return {
    activities: toOptions(activities, "_id", "name"),
    rows: [...groups.entries()].map(([priority, g]) => ({
      priority,
      cnumber: "",
      cheader: "",
      total: g.total,
      fetched: g.fetched,
      pending: g.pending,
    })),
  };
}

// GET /report/advisor-live-status
export async function getAdvisorLiveStatus() {
  const open = await db.TimeEntry.find({ endedAt: null })
    .populate("user", "userName teamLeaderName")
    .populate("activity", "name lob")
    .populate("activity.lob", "name")
    .sort({ startedAt: -1 })
    .lean();

  const seen = new Set();
  const rows = [];
  const STATUS_LABEL = {
    talking: "Live Call",
    waiting: "Waiting",
    fetch: "Fetch",
    idle: "Idle",
    lunch: "Lunch",
    tea: "Tea Break",
    briefing: "Briefing",
    training: "Training",
    bio: "Bio Break",
    break_out: "Break Out",
  };

  for (const t of open) {
    const uid = t.user?._id ? String(t.user._id) : "?";
    if (seen.has(uid)) continue;
    seen.add(uid);
    const dur = t.durationSeconds ?? (Date.now() - t.startedAt) / 1000;
    rows.push({
      teamLeader: t.user?.teamLeaderName ?? "",
      advisor: t.user?.userName ?? "?",
      lobName: t.activity?.lob?.name ?? "",
      activityState: STATUS_LABEL[t.status] ?? t.status,
      durationSeconds: Math.round(dur),
    });
  }

  return { advisorCount: rows.length, rows };
}

// GET /report/advisor-performance
export async function getAdvisorPerformance() {
  const advisors = await db.User.find({ role: "agent" }).lean();
  const ids = advisors.map((a) => a._id);
  const today = todayRange();

  const [records, interactions, callbacks] = await Promise.all([
    db.Record.find({ assignedAdvisor: { $in: ids } }).select("status assignedAdvisor").lean(),
    db.Interaction.find({ advisor: { $in: ids }, startedAt: today }).populate("disposition", "name completed closed").lean(),
    db.Callback.find({ advisor: { $in: ids }, callbackTime: today }).lean(),
  ]);

  const rec = new Map(ids.map((id) => [String(id), { al: 0, fr: 0, pr: 0, cl: 0, comp: 0 }]));
  for (const r of records) {
    const row = rec.get(String(r.assignedAdvisor));
    if (!row) continue;
    row.al += 1;
    if (r.status === "fresh") row.fr += 1;
    else if (["processed", "closed", "completed"].includes(r.status)) row.pr += 1;
    if (r.status === "closed") row.cl += 1;
    if (r.status === "completed") row.comp += 1;
  }

  const int = new Map();
  for (const i of interactions) int.set(String(i.advisor), (int.get(String(i.advisor)) ?? 0) + 1);
  const pcb = new Map();
  for (const c of callbacks) pcb.set(String(c.advisor), (pcb.get(String(c.advisor)) ?? 0) + 1);

  return advisors.map((a) => {
    const r = rec.get(String(a._id)) ?? { al: 0, fr: 0, pr: 0, cl: 0, comp: 0 };
    return {
      advisor: a.userName,
      lobName: a.lobActivity ?? "",
      prPercentage: pct(r.pr, r.al),
      al: r.al,
      fr: r.fr,
      pr: r.pr,
      int: int.get(String(a._id)) ?? 0,
      cl: r.cl,
      comp: r.comp,
      pcb: pcb.get(String(a._id)) ?? 0,
    };
  });
}

// GET /report/activity-performance
export async function getActivityPerformance() {
  const activities = await db.Activity.find().lean();
  const activityIds = activities.map((a) => a._id);
  const today = todayRange();

  const [records, interactions] = await Promise.all([
    db.Record.find({ activity: { $in: activityIds } }).select("status assignedAdvisor").lean(),
    db.Interaction.find({ activity: { $in: activityIds }, startedAt: today }).lean(),
  ]);

  const stats = new Map();
  for (const a of activities) {
    stats.set(String(a._id), { activity: a.name, ad: new Set(), al: 0, fr: 0, int: 0, cl: 0, comp: 0 });
  }
  for (const r of records) {
    const s = stats.get(String(r.activity));
    if (!s) continue;
    s.al += 1;
    if (r.assignedAdvisor) s.ad.add(String(r.assignedAdvisor));
    if (r.status === "fresh") s.fr += 1;
    if (r.status === "closed") s.cl += 1;
    if (r.status === "completed") s.comp += 1;
  }
  for (const i of interactions) {
    const s = stats.get(String(i.activity));
    if (s) s.int += 1;
  }

  return {
    lastUpdatedMinutesAgo: syncService.lastUpdatedMinutesAgo(),
    rows: [...stats.values()].map((s) => ({
      activity: s.activity,
      ad: s.ad.size,
      al: s.al,
      fr: s.fr,
      int: s.int,
      cl: s.cl,
      comp: s.comp,
      compPercentage: pct(s.comp, s.int),
    })),
  };
}

// GET /report/agent-crm-activity/meta
export async function getAgentCrmActivityMeta() {
  return { lastUpdatedMinutesAgo: syncService.lastUpdatedMinutesAgo() };
}

// GET /report/agent-crm-activity
export async function getAgentCrmActivity({ startDate, endDate }) {
  const where = {};
  if (startDate || endDate) where.startedAt = dayRange(startDate, endDate);

  const interactions = await db.Interaction.find(where)
    .populate("advisor", "userName")
    .populate("activity", "name lob")
    .populate("activity.lob", "name")
    .populate("disposition", "name")
    .sort({ startedAt: 1 })
    .lean();

  const rows = interactions.map((i) => ({
    date: i.startedAt ? i.startedAt.toISOString().slice(0, 10) : "",
    time: i.startedAt ? i.startedAt.toISOString().slice(11, 16) : "",
    advisor: i.advisor?.userName ?? "",
    lob: i.activity?.lob?.name ?? "",
    merchantId: i.merchantId ?? "",
    activity: i.activity?.name ?? "",
    disposition: i.disposition?.name ?? "",
    status: i.status ?? "",
    duration: fmtDuration(i.durationSeconds ?? 0),
  }));

  const today = new Date().toISOString().slice(0, 10);
  return {
    rows,
    filename: `agent-crm-activity_${startDate ?? today}_${endDate ?? today}`,
    format: "csv",
  };
}

export { sendRows };

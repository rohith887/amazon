import db from "../models/index.js";
import { ApiError } from "../utils/apiError.js";
import { sendRows } from "../utils/export.js";
import { parseUploadFile, mapRowsToRecords } from "../utils/importer.js";
import { REPORT_TYPES } from "../utils/reportTypes.js";
import { buildReportRows } from "./reportService.js";

const AUDIENCE_TYPES = ["all", "team_leader", "agent"];

function toOptions(rows, valueKey, labelKey) {
  return rows.map((r) => ({ label: r[labelKey], value: String(r[valueKey]) }));
}

export async function listLobs() {
  return toOptions(await db.Lob.find().sort({ name: 1 }).lean(), "_id", "name");
}

export async function listActivities() {
  return toOptions(await db.Activity.find().sort({ name: 1 }).lean(), "_id", "name");
}

// GET /activity/list — full activity table (Activity Name, LOB, Type, Created, Enabled)
export async function listActivityTable() {
  const activities = await db.Activity.find()
    .populate("lob", "name")
    .sort({ createdAt: -1 })
    .lean();
  return activities.map((a) => ({
    id: String(a._id),
    name: a.name,
    lobName: a.lob?.name ?? "",
    activityType: a.activityType ?? "Voice",
    createdAt: a.createdAt,
    enabled: a.enabled ?? true,
  }));
}

// GET /activity/options — lead source + extra columns offered when creating an activity
export async function getOptions() {
  const lobs = await db.Lob.find().lean();
  return {
    leadSources: lobs.map((l) => ({ label: l.name, value: String(l._id) })),
    extraColumns: [
      { label: "Phone", value: "phone" },
      { label: "Priority", value: "priority" },
      { label: "Merchant Name", value: "merchantName" },
      { label: "Cohort Number", value: "cohortNumber" },
      { label: "Cohort Header", value: "cohortHeader" },
    ],
  };
}

async function insertRecordsInBatches(records, batchSize = 2000) {
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const res = await db.Record.insertMany(batch, { ordered: false });
    inserted += res.length;
  }
  return inserted;
}

// POST /activity — multipart: name, lob, leadSource, csv, primaryColumn, priorityColumn, columnMapping, deadlineMinutes
export async function createActivity(fields, file) {
  if (!file) throw new ApiError(400, "CSV file is required");
  if (!fields.name || !fields.lob) throw new ApiError(400, "Name and LOB are required");

  const lobId = await resolveLobId(fields.lob);

  // mapping = { sourceColumn: destField }, destField is "primary", "priority" or an extra field name.
  let mapping = {};
  try {
    mapping = JSON.parse(fields.columnMapping ?? "{}");
  } catch {
    mapping = {};
  }
  const primaryColumn = fields.primaryColumn || Object.keys(mapping).find((c) => mapping[c] === "primary") || null;
  if (!primaryColumn) throw new ApiError(400, "A primary data column is required to map merchant IDs");

  const priorityColumn = fields.priorityColumn || Object.keys(mapping).find((c) => mapping[c] === "priority") || null;
  const extraMapping = {};
  for (const [source, dest] of Object.entries(mapping)) {
    if (dest && dest !== "primary" && dest !== "priority" && source !== primaryColumn) {
      extraMapping[dest] = source;
    }
  }

  const rows = await parseUploadFile(file);
  if (rows.length === 0) throw new ApiError(400, "The uploaded file is empty or has no data rows");

  const { records } = mapRowsToRecords(rows, {
    activityId: undefined, // assigned after activity is created
    lobId,
    primaryColumn,
    priorityColumn,
    extraMapping,
  });
  if (records.length === 0) throw new ApiError(400, `No valid rows found under primary column "${primaryColumn}"`);

  const activity = await db.Activity.create({
    name: fields.name.trim(),
    lob: lobId,
    leadSource: fields.leadSource || null,
    deadlineMinutes: fields.deadlineMinutes ? Number(fields.deadlineMinutes) : null,
    priorityColumn,
  });

  records.forEach((r) => {
    r.activity = activity._id;
  });

  const imported = await insertRecordsInBatches(records);

  return { activity: { id: String(activity._id), name: activity.name }, imported };
}

// POST /activity/upload | /activity/rcp-upload — multipart: lob, activity, file
export async function uploadData(fields, file, { rcp = false } = {}) {
  if (!file) throw new ApiError(400, "File is required");
  const lobId = await resolveLobId(fields.lob);

  let activityId;
  if (rcp) {
    activityId = await getOrCreateRcpActivity(lobId);
  } else {
    activityId = fields.activity || null;
    if (!activityId) throw new ApiError(400, "Activity is required for a data upload");
  }

  const job = await db.UploadJob.create({
    fileName: file.originalname,
    lob: lobId,
    activity: activityId,
    status: "processing",
  });

  try {
    const rows = await parseUploadFile(file);
    const { records } = mapRowsToRecords(rows, {
      activityId,
      lobId,
      primaryColumn: guessPrimaryColumn(rows),
      priorityColumn: "priority" in (rows[0] ?? {}) ? "priority" : null,
      extraMapping: { phone: "phone" in (rows[0] ?? {}) ? "phone" : null, merchantName: "merchantName" in (rows[0] ?? {}) ? "merchantName" : null },
    });
    if (records.length === 0) throw new ApiError(400, "No data rows found in the uploaded file");

    const imported = await insertRecordsInBatches(records);
    job.totalRecords = rows.length;
    job.processed = imported;
    job.status = "completed";
    await job.save();

    return { fileName: file.originalname, jobId: String(job._id), imported, totalRecords: rows.length };
  } catch (err) {
    job.status = "failed";
    await job.save();
    throw err;
  }
}

function guessPrimaryColumn(rows) {
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const preferred = ["merchant", "merchant_id", "merchantId", "mid", "m_id", "account", "customer_id", "phone", "number"];
  for (const p of preferred) {
    const hit = keys.find((k) => k.toLowerCase() === p || k.toLowerCase().includes("merchant"));
    if (hit) return hit;
  }
  return keys[0] ?? "";
}

async function getOrCreateRcpActivity(lobId) {
  let activity = await db.Activity.findOne({ name: "RCP", lob: lobId }).lean();
  if (!activity) {
    activity = await db.Activity.create({ name: "RCP", lob: lobId, activityType: "Voice" });
  }
  return activity._id;
}

// GET /activity/rcp-report?lob
export async function rcpReport(lobId, { startDate, endDate } = {}) {
  const lob = await db.Lob.findById(lobId);
  if (!lob) throw new ApiError(404, "LOB not found");
  const activity = await db.Activity.findOne({ name: "RCP", lob: lob._id }).lean();
  if (!activity) return { rows: [], filename: `rcp-report_${lob.name}`, format: "csv" };

  const where = { activity: activity._id };
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { $gte: new Date(`${startDate}T00:00:00`) } : {}),
      ...(endDate ? { $lte: new Date(`${endDate}T23:59:59.999`) } : {}),
    };
  }
  const records = await db.Record.find(where)
    .populate("assignedAdvisor", "userName")
    .sort({ createdAt: -1 })
    .lean();

  return {
    rows: records.map((r) => ({
      merchantId: r.merchantId,
      status: r.status,
      priority: r.priority ?? "",
      assignedAgent: r.assignedAdvisor?.userName ?? "",
      uploadedOn: r.createdAt,
    })),
    filename: `rcp-report_${lob.name}`,
    format: "csv",
  };
}

// GET /activity/records?activity&status&search
export async function listRecords({ activity, status, search } = {}) {
  const where = {};
  if (activity) where.activity = activity;
  if (status) where.status = status;
  if (search) where.merchantId = { $regex: search, $options: "i" };

  const records = await db.Record.find(where)
    .populate("assignedAdvisor", "userName")
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  return records.map((r) => ({
    merchantId: r.merchantId,
    status: r.status,
    uploadedOn: r.createdAt,
    fetchedBy: r.assignedAdvisor?.userName ?? "No",
    priority: r.priority ?? "",
  }));
}

export async function getRunningCheck() {
  const jobs = await db.UploadJob.find().sort({ createdAt: -1 }).limit(100).lean();
  return jobs.map((j) => ({
    fileName: j.fileName,
    totalRecords: j.totalRecords,
    processed: j.processed,
    status: j.status,
    lob: j.lob ? String(j.lob) : "",
  }));
}

export async function listAdvisors() {
  const users = await db.User.find({ role: "agent" }).lean();
  return users.map((u) => ({
    advisor: u.userName,
    teamLeader: u.teamLeaderName,
    assigned: Boolean(u.fetchStrategy),
    id: String(u._id),
  }));
}

// GET /activity/dispositions?lob — options for form dropdowns
export async function listDispositions(lobId) {
  const where = lobId ? { lob: lobId } : {};
  return toOptions(await db.Disposition.find(where).sort({ name: 1 }).lean(), "_id", "name");
}

// GET /activity/dispositions/detail?lob — dispositions with sub-dispositions + flags
export async function listDispositionsDetail(lobId) {
  const where = lobId ? { lob: lobId } : {};
  const [dispositions, subs] = await Promise.all([
    db.Disposition.find(where).sort({ name: 1 }).lean(),
    db.SubDisposition.find().lean(),
  ]);
  const subByDisp = new Map();
  for (const s of subs) {
    const key = String(s.disposition);
    if (!subByDisp.has(key)) subByDisp.set(key, []);
    subByDisp.get(key).push(s.name);
  }
  return dispositions.map((d) => ({
    id: String(d._id),
    name: d.name,
    connected: d.connected,
    closed: d.closed,
    completed: d.completed,
    enabled: d.enabled,
    subDispositions: subByDisp.get(String(d._id)) ?? [],
  }));
}

// POST /activity/dispositions
export async function createDisposition({ lob, name, connected, closed, completed }) {
  const lobId = await resolveLobId(lob);
  const existing = await db.Disposition.findOne({ lob: lobId, name });
  if (existing) throw new ApiError(409, `Disposition "${name}" already exists for this LOB`);
  const disposition = await db.Disposition.create({
    lob: lobId,
    name,
    connected: Boolean(connected),
    closed: Boolean(closed),
    completed: Boolean(completed),
    enabled: true,
  });
  return { id: String(disposition._id) };
}

// PATCH /activity/dispositions/:id/status — enable / disable
export async function updateDispositionStatus(id, { enabled }) {
  const disposition = await db.Disposition.findById(id);
  if (!disposition) throw new ApiError(404, "Disposition not found");
  disposition.enabled = Boolean(enabled);
  await disposition.save();
  return { id: String(disposition._id), enabled: disposition.enabled };
}

// POST /activity/sub-dispositions
export async function createSubDisposition({ lob, disposition, name }) {
  let dispositionId = disposition;
  if (lob && !db.mongoose.Types.ObjectId.isValid(disposition)) {
    const resolvedLob = await resolveLobId(lob);
    const found = await db.Disposition.findOne({ lob: resolvedLob, name: disposition }).lean();
    if (found) dispositionId = found._id;
  }
  const dispositionRow = await db.Disposition.findById(dispositionId);
  if (!dispositionRow) throw new ApiError(404, "Disposition not found");
  const sub = await db.SubDisposition.create({ disposition: dispositionRow._id, name });
  return { id: String(sub._id) };
}

// GET /activity/generate-report/options
export async function getGenerateReportOptions() {
  const [activities, teamLeaders, agents] = await Promise.all([
    db.Activity.find().sort({ name: 1 }).lean(),
    db.User.find({ role: "team_leader" }).lean(),
    db.User.find({ role: "agent" }).lean(),
  ]);
  return {
    reportTypes: REPORT_TYPES,
    activities: toOptions(activities, "_id", "name"),
    teamLeaders: toOptions(teamLeaders, "_id", "userName"),
    agents: toOptions(agents, "_id", "userName"),
  };
}

// GET /activity/generate-report
export async function generateReport({ reportType, activity, audience, assignee, startDate, endDate, format }) {
  if (!AUDIENCE_TYPES.includes(audience)) throw new ApiError(400, "Invalid audience");
  const rows = await buildReportRows(reportType, {
    activity: activity || undefined,
    advisorId: audience === "agent" && assignee && assignee !== "all" ? assignee : undefined,
    teamLeaderId: audience === "team_leader" && assignee && assignee !== "all" ? assignee : undefined,
    startDate,
    endDate,
  });
  const today = new Date().toISOString().slice(0, 10);
  return { rows, filename: `activity-report_${reportType}_${startDate ?? today}_${endDate ?? today}`, format };
}

// POST /activity/:activity/auto-assign
export async function updateAutoAssign(activityId, { enabled, strategy, inactiveMinutes }) {
  const activity = await db.Activity.findById(activityId);
  if (!activity) throw new ApiError(404, "Activity not found");
  activity.autoAssignEnabled = Boolean(enabled);
  activity.autoAssignStrategy = strategy ?? null;
  activity.autoAssignInactiveMinutes = inactiveMinutes ? Number(inactiveMinutes) : null;
  await activity.save();
  return { ok: true };
}

// POST /activity/:activity/auto-assign/run — reassign stale pending records
export async function runAutoAssign(activityId) {
  const activity = await db.Activity.findById(activityId);
  if (!activity) throw new ApiError(404, "Activity not found");
  if (!activity.autoAssignEnabled) throw new ApiError(400, "Auto assignment is disabled for this activity");

  const thresholdMs = (activity.autoAssignInactiveMinutes ?? 30) * 60 * 1000;
  const cutoff = new Date(Date.now() - thresholdMs);

  const candidates = await db.Record.find({
    activity: activityId,
    assignedAdvisor: { $ne: null },
    status: "fresh",
  }).lean();

  const candidateIds = candidates.map((c) => c.assignedAdvisor);
  const activeUserIds = await db.TimeEntry.find({ endedAt: null, user: { $in: candidateIds } }).distinct("user");
  const activeSet = new Set(activeUserIds.map(String));

  const stale = [];
  for (const record of candidates) {
    if (activeSet.has(String(record.assignedAdvisor))) continue;
    const log = await db.LoginLog.findOne({ user: record.assignedAdvisor, loginAt: { $lte: cutoff } })
      .sort({ loginAt: -1 })
      .lean();
    if (!log || log.loginAt <= cutoff) stale.push(record);
  }

  if (stale.length === 0) return { reassigned: 0 };

  const agents = await db.User.find({ role: "agent", enabled: true }).select("_id").lean();
  if (agents.length === 0) return { reassigned: 0 };

  const pick = buildAssigner(activity.autoAssignStrategy ?? "round_robin", agents);
  let reassigned = 0;
  for (const record of stale) {
    const target = pick.next();
    if (target) {
      await db.Record.updateOne({ _id: record._id }, { assignedAdvisor: target._id });
      reassigned += 1;
    }
  }
  return { reassigned };
}

function buildAssigner(strategy, agents) {
  let idx = 0;
  const counters = new Map(agents.map((a) => [String(a._id), 0]));
  if (strategy === "priority") {
    return {
      next() {
        const sorted = [...agents].sort((a, b) => (counters.get(String(a._id)) ?? 0) - (counters.get(String(b._id)) ?? 0));
        const target = sorted[0];
        counters.set(String(target._id), (counters.get(String(target._id)) ?? 0) + 1);
        return target;
      },
    };
  }
  return {
    next() {
      const target = agents[idx % agents.length];
      idx += 1;
      counters.set(String(target._id), (counters.get(String(target._id)) ?? 0) + 1);
      return target;
    },
  };
}

async function resolveLobId(lob) {
  if (!lob) throw new ApiError(400, "LOB is required");
  if (db.mongoose.Types.ObjectId.isValid(lob)) {
    const byId = await db.Lob.findById(lob).lean();
    if (byId) return byId._id;
  }
  const byName = await db.Lob.findOne({ name: lob }).lean();
  if (!byName) throw new ApiError(404, "LOB not found");
  return byName._id;
}

export { sendRows };

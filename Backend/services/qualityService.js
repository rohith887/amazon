import db from "../models/index.js";
import { sendRows } from "../utils/export.js";
import { ApiError } from "../utils/apiError.js";
import { REPORT_TYPES, dayRange } from "../utils/reportTypes.js";

function toOptions(rows, valueKey, labelKey) {
  return rows.map((r) => ({ label: r[labelKey], value: String(r[valueKey]) }));
}

function pct(num, denom) {
  return denom ? Math.round((num / denom) * 10000) / 100 : 0;
}

export async function listLobs() {
  return toOptions(await db.Lob.find().sort({ name: 1 }).lean(), "_id", "name");
}

// GET /quality/calls?lob&startDate&endDate&merchantId&rid
export async function getCalls({ lob, startDate, endDate, merchantId, rid }) {
  const where = {};
  if (lob) where.lob = lob;
  if (startDate && endDate) {
    where.auditedOn = {
      $gte: new Date(`${startDate}T00:00:00`),
      $lte: new Date(`${endDate}T23:59:59.999`),
    };
  }
  if (merchantId) {
    const records = await db.Record.find({ merchantId }).select("_id").lean();
    where.record = { $in: records.map((r) => r._id) };
  }
  if (rid) where.callId = rid;

  const audits = await db.Audit.find(where)
    .populate("agent", "userName teamLeaderName")
    .populate("lob", "name")
    .sort({ createdAt: -1 })
    .lean();

  return audits.map((a) => ({
    callId: a.callId,
    recordingUrl: a.recordingUrl,
    agent: a.agent?.userName ?? "",
    teamLeader: a.agent?.teamLeaderName ?? "",
    lob: a.lob?.name ?? "",
    score: a.score,
    status: a.status,
    passFail: a.passFail ?? "",
    auditedOn: a.auditedOn,
  }));
}

// GET /quality/generate-report/options
export async function getGenerateReportOptions() {
  const [teamLeaders, agents] = await Promise.all([
    db.User.find({ role: "team_leader" }).sort({ userName: 1 }).lean(),
    db.User.find({ role: "agent" }).sort({ userName: 1 }).lean(),
  ]);
  return {
    reportTypes: REPORT_TYPES,
    teamLeaders: toOptions(teamLeaders, "_id", "userName"),
    agents: toOptions(agents, "_id", "userName"),
  };
}

function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

// GET /quality/generate-report?reportType&audience&assignee&startDate&endDate&format
export async function generateReport({ reportType = "agent_quality", audience = "all", assignee, startDate, endDate, format }) {
  if (!REPORT_TYPES.some((r) => r.value === reportType)) {
    throw new ApiError(400, `Unknown report type "${reportType}"`);
  }

  const where = {};
  if (startDate || endDate) where.auditedOn = dayRange(startDate, endDate);

  if (audience === "agent" && assignee && assignee !== "all") where.agent = assignee;
  if (audience === "team_leader" && assignee && assignee !== "all") {
    const tl = await db.User.findById(assignee).lean();
    if (tl) {
      const team = await db.User.find({ teamLeaderName: tl.userName }).select("_id").lean();
      where.agent = { $in: team.map((u) => u._id) };
    }
  }

  const [audits, interactions, dispositions] = await Promise.all([
    db.Audit.find(where)
      .populate("agent", "userName teamLeaderName")
      .populate("lob", "name")
      .lean(),
    db.Interaction.find({ startedAt: where.auditedOn ?? {} })
      .populate("advisor", "userName teamLeaderName")
      .populate("activity", "name")
      .populate("disposition", "name connected closed completed")
      .lean(),
    db.Disposition.find().select("name connected closed completed").lean(),
  ]);

  let rows = [];
  switch (reportType) {
    case "agent_quality": {
      const byAdvisor = new Map();
      for (const a of audits) {
        const id = a.agent?._id ? String(a.agent._id) : "?";
        if (!byAdvisor.has(id)) byAdvisor.set(id, { advisor: a.agent?.userName ?? "?", teamLeader: a.agent?.teamLeaderName ?? "", audits: 0, scoreSum: 0, pass: 0, fail: 0, remarks: [] });
        const row = byAdvisor.get(id);
        row.audits += 1;
        row.scoreSum += a.score ?? 0;
        if (a.passFail === "Pass") row.pass += 1;
        if (a.passFail === "Fail") row.fail += 1;
        if (a.remarks) row.remarks.push(a.remarks);
      }
      rows = [...byAdvisor.values()].map((r) => ({
        advisor: r.advisor,
        teamLeader: r.teamLeader,
        audits: r.audits,
        avgScore: r.audits ? Math.round((r.scoreSum / r.audits) * 100) / 100 : 0,
        pass: r.pass,
        fail: r.fail,
        compliance: r.audits ? pct(r.pass, r.audits) : 0,
        remarks: r.remarks.slice(-1)[0] ?? "",
      }));
      break;
    }
    case "quality_data_dump":
      rows = audits.map((a) => ({
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
      break;
    case "quality_short_call":
      rows = interactions
        .filter((i) => (i.durationSeconds ?? 0) < 30)
        .map((i) => ({
          callId: String(i._id),
          date: i.startedAt,
          advisor: i.advisor?.userName ?? "",
          activity: i.activity?.name ?? "",
          disposition: i.disposition?.name ?? "",
          durationSeconds: i.durationSeconds ?? 0,
          recordingUrl: i.recordingUrl ?? "",
        }));
      break;
    case "interaction":
      rows = interactions.map((i) => ({
        callId: String(i._id),
        date: i.startedAt,
        advisor: i.advisor?.userName ?? "",
        teamLeader: i.advisor?.teamLeaderName ?? "",
        activity: i.activity?.name ?? "",
        merchantId: i.merchantId ?? "",
        disposition: i.disposition?.name ?? "",
        durationSeconds: i.durationSeconds ?? 0,
        recordingUrl: i.recordingUrl ?? "",
      }));
      break;
    case "disposition": {
      const counts = new Map();
      let total = 0;
      for (const i of interactions) {
        const name = i.disposition?.name ?? "Other";
        counts.set(name, (counts.get(name) ?? 0) + 1);
        total += 1;
      }
      rows = [...counts.entries()].map(([name, count]) => ({
        disposition: name,
        count,
        connected: dispositions.find((d) => d.name === name)?.connected ? "Yes" : "No",
        closed: dispositions.find((d) => d.name === name)?.closed ? "Yes" : "No",
        completed: dispositions.find((d) => d.name === name)?.completed ? "Yes" : "No",
        percentage: pct(count, total),
      }));
      break;
    }
    default:
      throw new ApiError(400, `Unsupported quality report type "${reportType}"`);
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    rows,
    filename: `quality-${reportType}_${startDate ?? today}_${endDate ?? today}`,
    format,
  };
}

export { sendRows };

import "dotenv/config";
import mongoose from "mongoose";
import db from "./models/index.js";

const URI = process.env.DB_URI ?? "mongodb://127.0.0.1:27017/grassroots_crm";

// Deterministic PRNG so seeding is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260803);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p) => rand() < p;

const LOB_NAMES = [
  "L-1 Reactivation",
  "L-2 Free Credits",
  "L-3 Opt-In",
  "L-4 Optimization",
  "L-5 Sale Format",
  "L-6 OOB",
  "L-7 Sales OPS",
  "L-8 Sales Free Credits",
  "L-9 APB",
  "L-10 Display Ads",
];

const ROLE_NAMES = {
  admin: "Administrator",
  team_leader: "Team Leader",
  trainer: "Trainer",
  agent: "Executive",
};

const DISPOSITIONS = [
  { name: "Callback", sub: ["Customer Requested Tomorrow", "Busy", "Requested Evening Call"], connected: true, closed: false, completed: false },
  { name: "Completed", sub: [], connected: true, closed: false, completed: true },
  { name: "No Response", sub: [], connected: false, closed: false, completed: false },
  { name: "Not Interested", sub: [], connected: true, closed: true, completed: false },
  { name: "Wrong Number", sub: [], connected: false, closed: true, completed: false },
  { name: "Sale Closed", sub: [], connected: true, closed: true, completed: true },
];

const REMARKS = [
  "Customer asked to call back later.",
  "Line busy, will retry.",
  "Customer interested in the offer.",
  "Customer not reachable.",
  "Number switched off.",
  "Customer wants details via email.",
  "Soft tone, positive response.",
  "Requested to be contacted in the evening.",
];

const QA_REMARKS = [
  "Greeting followed, verification incomplete.",
  "Process followed correctly. Minor soft-skill gap.",
  "Excellent adherence and closing.",
  "Disposition mis-selected for this outcome.",
  "Rush in conversation, needs improvement in active listening.",
  "Good clarity, compliance with the script.",
];

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600 * 1000);
}

function atHour(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, int(0, 59), int(0, 999));
  return d;
}

function dayAgoAt(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, int(0, 59), int(0, 999));
  return d;
}

function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

async function seed() {
  await mongoose.connect(URI);
  console.log(`[seed] connected ${mongoose.connection.name}`);

  const collections = [
    "users", "lobs", "activities", "records", "interactions", "dispositions",
    "subdispositions", "callbacks", "audits", "otps", "uploadjobs", "timeentries", "loginlogs",
  ];
  for (const name of collections) {
    await db.mongoose.connection.collection(name).deleteMany({});
  }
  console.log("[seed] cleared collections");

  // 1. LOBs
  const lobDocs = await db.Lob.insertMany(LOB_NAMES.map((name) => ({ name })));
  const lobs = lobDocs.map((l) => ({ _id: l._id, name: l.name }));
  console.log(`[seed] ${lobs.length} LOBs`);

  // 2. Users
  const teamLeaders = [
    { userName: "Priya Nair", alias: "priya.n", email: "priya.nair@amazon-portal.local", location: "Chennai" },
    { userName: "Ramesh Kumar", alias: "ramesh.k", email: "ramesh.kumar@amazon-portal.local", location: "Hyderabad" },
  ];
  const tlDocs = await db.User.insertMany(
    teamLeaders.map((t) => ({
      ...t,
      teamLeaderName: null,
      sipId: `9002${int(100, 999)}`,
      empId: `TL${int(1000, 9999)}`,
      lobActivity: "L-9 APB",
      fetchStrategy: "manual",
      enabled: true,
      role: "team_leader",
    })),
  );

  const advisorFirst = ["Rahul", "Priya", "Arjun", "Sneha", "Ahmed", "Divya", "Karthik", "Meera", "Vikram", "Anjali"];
  const advisorDocs = await db.User.insertMany(
    advisorFirst.map((name, i) => ({
      userName: name,
      alias: name.toLowerCase(),
      sipId: `9${int(1000000, 9999999)}`,
      empId: `E${int(10000, 99999)}`,
      email: `${name.toLowerCase()}${i}@amazon-portal.local`,
      lobActivity: lobs[i % lobs.length].name,
      fetchStrategy: i % 3 === 0 ? null : pick(["round_robin", "equal_split", "priority"]),
      enabled: true,
      role: "agent",
      location: pick(["Chennai", "Hyderabad"]),
      teamLeaderName: tlDocs[i % 2].userName,
    })),
  );

  const adminDoc = await db.User.create({
    userName: "System Admin",
    alias: "admin",
    sipId: "9000",
    empId: "ADMIN001",
    email: "admin@amazon-portal.local",
    lobActivity: null,
    fetchStrategy: null,
    enabled: true,
    role: "admin",
    location: "Chennai",
  });
  const users = [...tlDocs, ...advisorDocs, adminDoc];
  console.log(`[seed] ${users.length} users`);

  // 3. Activities
  const activityDefs = [
    { name: "A-230 GROWTH-APB", lobName: "L-9 APB", activityType: "Voice" },
    { name: "A-228 IMPROVE", lobName: "L-4 Optimization", activityType: "Voice" },
    { name: "Coach Program", lobName: "L-1 Reactivation", activityType: "Voice" },
    { name: "Prime Membership Renewal", lobName: "L-1 Reactivation", activityType: "Voice" },
    { name: "Display Ads Outreach", lobName: "L-10 Display Ads", activityType: "Voice" },
    { name: "Sales OPS Follow-up", lobName: "L-7 Sales OPS", activityType: "Voice" },
  ];
  const activityDocs = await db.Activity.insertMany(
    activityDefs.map((a) => ({
      name: a.name,
      lob: lobs.find((l) => l.name === a.lobName)._id,
      activityType: a.activityType,
      leadSource: a.lobName,
      deadlineMinutes: chance(0.6) ? int(30, 240) : null,
      autoAssignEnabled: chance(0.5),
      autoAssignStrategy: pick(["round_robin", "priority", "equal_split"]),
      autoAssignInactiveMinutes: int(20, 60),
      priorityColumn: "priority",
      enabled: true,
    })),
  );
  const activities = activityDocs.map((a) => ({ _id: a._id, name: a.name, lob: a.lob }));
  console.log(`[seed] ${activities.length} activities`);

  // 4. Dispositions per LOB
  const dispositionDocs = [];
  for (const lob of lobs) {
    for (const d of DISPOSITIONS) {
      const doc = await db.Disposition.create({ lob: lob._id, name: d.name, connected: d.connected, closed: d.closed, completed: d.completed, enabled: chance(0.9) });
      dispositionDocs.push({ ...doc.toObject(), sub: d.sub });
    }
  }
  for (const d of dispositionDocs) {
    for (const sub of d.sub) {
      await db.SubDisposition.create({ disposition: d._id, name: sub });
    }
  }
  console.log(`[seed] ${dispositionDocs.length} dispositions`);

  // 5. Records
  const statuses = ["fresh", "fresh", "fresh", "fetched", "fetched", "processed", "processed", "closed", "completed"];
  const priorities = ["P1", "P1", "P2", "P2", "P3", "P4"];
  const records = [];
  for (const activity of activities) {
    const count = int(600, 900);
    for (let i = 0; i < count; i++) {
      const merchantId = String(int(1000000000, 9999999999));
      const status = pick(statuses);
      const assigned = chance(0.8) ? pick(advisorDocs) : null;
      records.push({
        activity: activity._id,
        lob: activity.lob,
        merchantId,
        phone: `+91${int(6000000000, 9999999999)}`,
        priority: pick(priorities),
        status,
        assignedAdvisor: assigned ? assigned._id : null,
        fetchedAt: assigned && status !== "fresh" ? hoursAgo(int(1, 48)) : null,
        extra: { merchantName: `Merchant ${merchantId}`, merchant: `Merchant ${merchantId}` },
      });
    }
  }
  await db.Record.insertMany(records, { ordered: false });
  console.log(`[seed] ${records.length} records`);

  // 6. Interactions (spread across last 7 days, densest today)
  const recordsByActivity = new Map();
  for (const r of records) {
    if (!recordsByActivity.has(String(r.activity))) recordsByActivity.set(String(r.activity), []);
    recordsByActivity.get(String(r.activity)).push(r);
  }

  const interactions = [];
  const todayInteractions = [];
  const interactionsForAudit = [];
  const dispositionByLob = new Map();
  for (const lob of lobs) dispositionByLob.set(String(lob._id), dispositionDocs.filter((d) => String(d.lob) === String(lob._id)));

  for (let day = 7; day >= 0; day--) {
    const perDay = day === 0 ? int(80, 130) : int(20, 50);
    for (let i = 0; i < perDay; i++) {
      const activity = pick(activities);
      const pool = recordsByActivity.get(String(activity._id)) ?? [];
      if (pool.length === 0) continue;
      const record = pick(pool);
      const advisor = record.assignedAdvisor ? users.find((u) => String(u._id) === String(record.assignedAdvisor)) : pick(advisorDocs);
      const lobDisp = dispositionByLob.get(String(activity.lob)) ?? dispositionDocs;
      const disposition = pick(lobDisp);
      const startedAt = day === 0 ? atHour(int(9, 18)) : dayAgoAt(day, int(9, 18));
      const durationSeconds = chance(0.08) ? int(5, 29) : int(30, 900);
      const status = disposition.completed ? "completed" : disposition.closed ? "closed" : "completed";
      const interaction = {
        record: record._id,
        activity: activity._id,
        advisor: advisor._id,
        disposition: disposition._id,
        status,
        startedAt,
        endedAt: new Date(startedAt.getTime() + durationSeconds * 1000),
        durationSeconds,
        remarks: pick(REMARKS),
        recordingUrl: `https://recordings.example.com/call_${record.merchantId}_${startedAt.getTime()}.mp3`,
        merchantId: record.merchantId,
      };
      interactions.push(interaction);
      if (day === 0) todayInteractions.push(interaction);
      if (day === 0 && chance(0.4)) interactionsForAudit.push(interaction);
    }
  }
  await db.Interaction.insertMany(interactions, { ordered: false });
  console.log(`[seed] ${interactions.length} interactions`);

  // 7. Callbacks for today
  const callbacks = [];
  for (let i = 0; i < int(40, 70); i++) {
    const activity = pick(activities);
    const pool = recordsByActivity.get(String(activity._id)) ?? [];
    if (!pool.length) continue;
    const record = pick(pool);
    const advisor = record.assignedAdvisor ? users.find((u) => String(u._id) === String(record.assignedAdvisor)) : pick(advisorDocs);
    if (!advisor) continue;
    callbacks.push({
      record: record._id,
      advisor: advisor._id,
      lob: activity.lob,
      callbackTime: atHour(int(10, 19), int(0, 55)),
      type: chance(0.3) ? "RNR Callback" : "Callback",
    });
  }
  await db.Callback.insertMany(callbacks, { ordered: false });
  console.log(`[seed] ${callbacks.length} callbacks`);

  // 8. Audits (based on some interactions)
  const audits = [];
  for (const interaction of interactionsForAudit.slice(0, 90)) {
    const score = int(55, 100);
    const passed = score >= 70;
    audits.push({
      callId: `AUD-${int(10000, 99999)}`,
      recordingUrl: interaction.recordingUrl,
      agent: interaction.advisor,
      lob: activities.find((a) => String(a._id) === String(interaction.activity))?.lob ?? null,
      score,
      status: "Completed",
      auditedOn: interaction.startedAt,
      remarks: pick(QA_REMARKS),
      errorCategory: passed ? null : pick(["Disposition mismatch", "Verification skipped", "Script deviation", "Rushing the call"]),
      passFail: passed ? "Pass" : "Fail",
      qaParams: {
        greeting: chance(0.9),
        verification: chance(0.85),
        process: chance(0.8),
        softSkills: chance(0.75),
        compliance: chance(0.85),
        closing: chance(0.8),
      },
    });
  }
  await db.Audit.insertMany(audits, { ordered: false });
  console.log(`[seed] ${audits.length} audits`);

  // 9. Login logs + time entries for today (timeshare + live status)
  const loginLogs = [];
  const timeEntries = [];
  for (const advisor of advisorDocs) {
    const activity = pick(activities);
    const loginAt = atHour(int(8, 10));
    loginLogs.push({ user: advisor._id, activity: activity._id, loginAt, logoutAt: null, durationSeconds: null });

    let cursor = loginAt;
    const addEntry = (status, minutes) => {
      const start = cursor;
      const end = new Date(start.getTime() + minutes * 60000);
      timeEntries.push({
        user: advisor._id,
        activity: activity._id,
        status,
        startedAt: start,
        endedAt: end,
        durationSeconds: minutes * 60,
      });
      cursor = end;
    };

    addEntry("briefing", int(10, 20));
    addEntry("talking", int(30, 90));
    addEntry("waiting", int(10, 30));
    addEntry("tea", int(10, 15));
    addEntry("talking", int(30, 60));
    addEntry("fetch", 1);
    addEntry("idle", int(5, 20));
    addEntry("lunch", int(30, 45));
    addEntry("talking", int(40, 80));
    addEntry("bio", int(5, 10));
    addEntry("talking", int(20, 60));
  }

  // Leave a few advisors with an open entry so "Advisor Live Status" has live rows.
  const liveStates = ["talking", "idle", "fetch", "break_out", "waiting", "talking"];
  for (let i = 0; i < 6; i++) {
    const advisor = advisorDocs[i];
    timeEntries.push({
      user: advisor._id,
      activity: pick(activities)._id,
      status: liveStates[i],
      startedAt: new Date(Date.now() - int(2, 65) * 60000),
      endedAt: null,
      durationSeconds: null,
    });
  }

  await db.LoginLog.insertMany(loginLogs, { ordered: false });
  await db.TimeEntry.insertMany(timeEntries, { ordered: false });
  console.log(`[seed] ${loginLogs.length} login logs, ${timeEntries.length} time entries`);

  console.log("\n[seed] done. Summary:");
  console.log(`  LOBs: ${lobs.length}`);
  console.log(`  Users: ${users.length} (admin: admin@amazon-portal.local)`);
  console.log(`  Activities: ${activities.length}`);
  console.log(`  Records: ${records.length}`);
  console.log(`  Interactions: ${interactions.length} (${todayInteractions.length} today)`);
  console.log(`  Callbacks: ${callbacks.length}`);
  console.log(`  Audits: ${audits.length}`);
  console.log("\n  Login: OTP code is logged to the server console (no SMTP configured).");
  console.log(`  Timeshare sample login time: ${fmtDuration(int(6, 9) * 3600 + int(0, 59) * 60)}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});

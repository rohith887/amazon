import mongoose from "mongoose";

export const TIME_STATUSES = [
  "talking", // on a live customer call
  "waiting", // waiting for an inbound call
  "fetch", // fetching a new record
  "idle", // no work happening
  "lunch",
  "tea",
  "briefing",
  "training",
  "bio",
  "break_out", // out of queue (break, away, etc.)
];

const timeEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    status: { type: String, enum: TIME_STATUSES, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null }, // null = still active
    durationSeconds: { type: Number, default: null },
  },
  { timestamps: true, collection: "timeentries" },
);

timeEntrySchema.index({ user: 1, startedAt: -1 });
timeEntrySchema.index({ status: 1, startedAt: 1 });

export default mongoose.model("TimeEntry", timeEntrySchema);

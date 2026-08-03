import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    record: { type: mongoose.Schema.Types.ObjectId, ref: "Record", required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    disposition: { type: mongoose.Schema.Types.ObjectId, ref: "Disposition", default: null },
    status: { type: String, default: null }, // e.g. "completed", "closed"
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: null },
    remarks: { type: String, default: null },
    recordingUrl: { type: String, default: null },
    merchantId: { type: String, default: null }, // denormalized from Record for fast raw-data exports
  },
  { timestamps: true, collection: "interactions" },
);

interactionSchema.index({ advisor: 1, startedAt: -1 });
interactionSchema.index({ startedAt: 1, activity: 1 });
interactionSchema.index({ merchantId: 1 });

interactionSchema.index({ advisor: 1, startedAt: -1 });

export default mongoose.model("Interaction", interactionSchema);

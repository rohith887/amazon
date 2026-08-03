import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, trim: true },
    recordingUrl: { type: String, default: null },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", default: null },
    score: { type: Number, default: null },
    status: { type: String, default: "Pending" }, // "Completed" | "Pending"
    auditedOn: { type: Date, default: null },
    remarks: { type: String, default: null },
    errorCategory: { type: String, default: null },
    passFail: { type: String, default: null }, // "Pass" | "Fail"
    qaParams: { type: mongoose.Schema.Types.Mixed, default: {} }, // checklist results e.g. { greeting: true, verification: true }
  },
  { timestamps: true, collection: "audits" },
);

auditSchema.index({ lob: 1, auditedOn: -1 });

export default mongoose.model("Audit", auditSchema);

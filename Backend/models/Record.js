import mongoose from "mongoose";

export const RECORD_STATUSES = ["fresh", "fetched", "processed", "closed", "completed"];

const recordSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", required: true },
    merchantId: { type: String, required: true, trim: true },
    phone: { type: String, default: null },
    priority: { type: String, default: null },
    status: { type: String, enum: RECORD_STATUSES, default: "fresh" },
    assignedAdvisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fetchedAt: { type: Date, default: null },
    callbackTime: { type: Date, default: null },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }, // mapped extra CSV columns
  },
  { timestamps: true, collection: "records" },
);

recordSchema.index({ merchantId: 1, activity: 1 });

export default mongoose.model("Record", recordSchema);

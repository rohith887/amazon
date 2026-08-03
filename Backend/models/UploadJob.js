import mongoose from "mongoose";

export const UPLOAD_STATUSES = ["pending", "processing", "completed", "failed"];

const uploadJobSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", default: null },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    totalRecords: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    status: { type: String, enum: UPLOAD_STATUSES, default: "pending" },
  },
  { timestamps: true, collection: "uploadjobs" },
);

export default mongoose.model("UploadJob", uploadJobSchema);

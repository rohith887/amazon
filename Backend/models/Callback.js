import mongoose from "mongoose";

const callbackSchema = new mongoose.Schema(
  {
    record: { type: mongoose.Schema.Types.ObjectId, ref: "Record", required: true },
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", default: null },
    callbackTime: { type: Date, required: true },
    type: { type: String, default: "Callback" }, // e.g. "RNR Callback"
  },
  { timestamps: true, collection: "callbacks" },
);

callbackSchema.index({ callbackTime: 1 });

export default mongoose.model("Callback", callbackSchema);

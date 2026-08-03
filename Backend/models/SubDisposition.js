import mongoose from "mongoose";

const subDispositionSchema = new mongoose.Schema(
  {
    disposition: { type: mongoose.Schema.Types.ObjectId, ref: "Disposition", required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "subdispositions" },
);

export default mongoose.model("SubDisposition", subDispositionSchema);

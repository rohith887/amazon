import mongoose from "mongoose";

const dispositionSchema = new mongoose.Schema(
  {
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", required: true },
    name: { type: String, required: true, trim: true },
    connected: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "dispositions" },
);

dispositionSchema.index({ lob: 1, name: 1 }, { unique: true });

export default mongoose.model("Disposition", dispositionSchema);

import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    lob: { type: mongoose.Schema.Types.ObjectId, ref: "Lob", required: true },
    activityType: { type: String, default: "Voice" }, // Voice | Chat | Email
    leadSource: { type: String, default: null },
    deadlineMinutes: { type: Number, default: null },
    autoAssignEnabled: { type: Boolean, default: false },
    autoAssignStrategy: { type: String, default: null }, // "round_robin" | "priority" | "equal_split"
    autoAssignInactiveMinutes: { type: Number, default: null },
    priorityColumn: { type: String, default: null },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "activities" },
);

export default mongoose.model("Activity", activitySchema);

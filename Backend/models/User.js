import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    teamLeaderName: { type: String, default: null },
    userName: { type: String, required: true, trim: true },
    alias: { type: String, default: null },
    sipId: { type: String, default: null },
    empId: { type: String, default: null },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    lobActivity: { type: String, default: null },
    fetchStrategy: { type: String, default: null },
    enabled: { type: Boolean, default: true },
    role: { type: String, default: null }, // "agent" | "team_leader" | "admin"
    location: { type: String, default: null },
  },
  { timestamps: true, collection: "users" },
);

export default mongoose.model("User", userSchema);

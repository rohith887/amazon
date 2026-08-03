import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    loginAt: { type: Date, required: true },
    logoutAt: { type: Date, default: null }, // null = currently logged in
    durationSeconds: { type: Number, default: null },
  },
  { timestamps: true, collection: "loginlogs" },
);

loginLogSchema.index({ user: 1, loginAt: -1 });

export default mongoose.model("LoginLog", loginLogSchema);

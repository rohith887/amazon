import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true, length: 6 },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "otps" },
);

otpSchema.index({ email: 1, used: 1 });

export default mongoose.model("Otp", otpSchema);

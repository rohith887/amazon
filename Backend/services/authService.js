import crypto from "crypto";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { ApiError } from "../utils/apiError.js";
import { sendOtpEmail } from "./otpService.js";

const OTP_TTL_MS = 5 * 60 * 1000;

export async function requestOtp(email) {
  const user = await db.User.findOne({ email, enabled: true }).lean();
  if (!user) throw new ApiError(404, "No account found for that email");

  const code = String(crypto.randomInt(100000, 999999));
  await db.Otp.create({ email, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  await sendOtpEmail(email, code);

  return { ok: true };
}

export async function verifyOtp(email, otp) {
  const record = await db.Otp.findOne({ email, code: otp, used: false }).sort({ createdAt: -1 });
  if (!record) throw new ApiError(401, "Incorrect or expired code");
  if (new Date(record.expiresAt) < new Date()) throw new ApiError(401, "Incorrect or expired code");

  record.used = true;
  await record.save();

  const user = await db.User.findOne({ email }).lean();
  if (!user) throw new ApiError(401, "Incorrect or expired code");

  const token = jwt.sign({ userId: String(user._id), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  });

  return { token, user };
}

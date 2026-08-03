import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }
  await authService.requestOtp(email.trim().toLowerCase());
  res.json({ ok: true });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body ?? {};
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  const result = await authService.verifyOtp(email.trim().toLowerCase(), String(otp));
  res.json(result);
});

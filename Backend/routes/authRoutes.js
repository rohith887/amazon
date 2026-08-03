import { Router } from "express";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/request-otp", authController.requestOtp);
router.post("/verify-otp", authController.verifyOtp);

export default router;

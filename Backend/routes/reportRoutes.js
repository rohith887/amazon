import { Router } from "express";
import * as reportController from "../controllers/reportController.js";

const router = Router();

router.get("/generate/options", reportController.getGenerateOptions);
router.get("/generate", reportController.generateReport);
router.get("/users", reportController.listUsers);
router.post("/users", reportController.createUser);
router.patch("/users/:id", reportController.updateUser);
router.get("/callbacks", reportController.getCallbacks);
router.get("/dispositions", reportController.getDispositionDetails);
router.get("/merchant/:id", reportController.getMerchant);
router.get("/advisor-timeshare", reportController.getAdvisorTimeshare);
router.get("/activity-summary", reportController.getActivitySummary);
router.get("/advisor-live-status", reportController.getAdvisorLiveStatus);
router.get("/advisor-performance", reportController.getAdvisorPerformance);
router.get("/activity-performance", reportController.getActivityPerformance);
router.get("/agent-crm-activity/meta", reportController.getAgentCrmActivityMeta);
router.get("/agent-crm-activity", reportController.getAgentCrmActivity);

export default router;

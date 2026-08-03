import { Router } from "express";
import * as qualityController from "../controllers/qualityController.js";

const router = Router();

router.get("/lobs", qualityController.listLobs);
router.get("/calls", qualityController.getCalls);
router.get("/generate-report/options", qualityController.getGenerateReportOptions);
router.get("/generate-report", qualityController.generateReport);

export default router;

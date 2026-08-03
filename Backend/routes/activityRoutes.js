import { Router } from "express";
import { upload } from "../middleware/upload.js";
import * as activityController from "../controllers/activityController.js";

const router = Router();

router.get("/list-options", activityController.listActivities);
router.get("/list", activityController.listActivityTable);
router.get("/lobs", activityController.listLobs);
router.get("/options", activityController.getOptions);

router.post("/", upload.single("csv"), activityController.createActivity);
router.post("/upload", upload.single("file"), activityController.uploadData);
router.post("/rcp-upload", upload.single("file"), activityController.uploadRcpData);
router.get("/rcp-report", activityController.rcpReport);

router.get("/records", activityController.listRecords);
router.get("/running-check", activityController.getRunningCheck);
router.get("/advisors", activityController.listAdvisors);

router.get("/dispositions/detail", activityController.listDispositionsDetail);
router.get("/dispositions", activityController.listDispositions);
router.post("/dispositions", activityController.createDisposition);
router.patch("/dispositions/:id/status", activityController.updateDispositionStatus);
router.post("/sub-dispositions", activityController.createSubDisposition);

router.get("/generate-report/options", activityController.getGenerateReportOptions);
router.get("/generate-report", activityController.generateReport);

router.post("/:activity/auto-assign", activityController.updateAutoAssign);
router.post("/:activity/auto-assign/run", activityController.runAutoAssign);

export default router;

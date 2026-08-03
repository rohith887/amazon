import { asyncHandler } from "../utils/asyncHandler.js";
import { sendRows } from "../utils/export.js";
import * as activityService from "../services/activityService.js";

export const listLobs = asyncHandler(async (_req, res) => {
  res.json(await activityService.listLobs());
});

export const listActivities = asyncHandler(async (_req, res) => {
  res.json(await activityService.listActivities());
});

export const listActivityTable = asyncHandler(async (_req, res) => {
  res.json(await activityService.listActivityTable());
});

export const getOptions = asyncHandler(async (_req, res) => {
  res.json(await activityService.getOptions());
});

export const createActivity = asyncHandler(async (req, res) => {
  const result = await activityService.createActivity(req.body ?? {}, req.file);
  res.status(201).json(result);
});

export const uploadData = asyncHandler(async (req, res) => {
  const result = await activityService.uploadData(req.body ?? {}, req.file, { rcp: false });
  res.json(result);
});

export const uploadRcpData = asyncHandler(async (req, res) => {
  const result = await activityService.uploadData(req.body ?? {}, req.file, { rcp: true });
  res.json(result);
});

export const rcpReport = asyncHandler(async (req, res) => {
  const { rows, filename, format } = await activityService.rcpReport(req.query.lob, req.query);
  await sendRows(res, rows, { filename, format });
});

export const listRecords = asyncHandler(async (req, res) => {
  res.json(await activityService.listRecords(req.query));
});

export const getRunningCheck = asyncHandler(async (_req, res) => {
  res.json(await activityService.getRunningCheck());
});

export const listAdvisors = asyncHandler(async (_req, res) => {
  res.json(await activityService.listAdvisors());
});

export const listDispositions = asyncHandler(async (req, res) => {
  res.json(await activityService.listDispositions(req.query.lob));
});

export const listDispositionsDetail = asyncHandler(async (req, res) => {
  res.json(await activityService.listDispositionsDetail(req.query.lob));
});

export const createDisposition = asyncHandler(async (req, res) => {
  res.status(201).json(await activityService.createDisposition(req.body ?? {}));
});

export const updateDispositionStatus = asyncHandler(async (req, res) => {
  res.json(await activityService.updateDispositionStatus(req.params.id, req.body ?? {}));
});

export const createSubDisposition = asyncHandler(async (req, res) => {
  res.status(201).json(await activityService.createSubDisposition(req.body ?? {}));
});

export const getGenerateReportOptions = asyncHandler(async (_req, res) => {
  res.json(await activityService.getGenerateReportOptions());
});

export const generateReport = asyncHandler(async (req, res) => {
  const { rows, filename, format } = await activityService.generateReport(req.query);
  await sendRows(res, rows, { filename, format });
});

export const updateAutoAssign = asyncHandler(async (req, res) => {
  res.json(await activityService.updateAutoAssign(req.params.activity, req.body ?? {}));
});

export const runAutoAssign = asyncHandler(async (req, res) => {
  res.json(await activityService.runAutoAssign(req.params.activity));
});

import { asyncHandler } from "../utils/asyncHandler.js";
import { sendRows } from "../utils/export.js";
import * as reportService from "../services/reportService.js";

export const getGenerateOptions = asyncHandler(async (_req, res) => {
  res.json(await reportService.getGenerateOptions());
});

export const generateReport = asyncHandler(async (req, res) => {
  const { rows, filename, format } = await reportService.generateReport(req.query);
  await sendRows(res, rows, { filename, format });
});

export const listUsers = asyncHandler(async (_req, res) => {
  res.json(await reportService.listUsers(_req.query));
});

export const createUser = asyncHandler(async (req, res) => {
  res.status(201).json(await reportService.createUser(req.body ?? {}));
});

export const updateUser = asyncHandler(async (req, res) => {
  res.json(await reportService.updateUser(req.params.id, req.body ?? {}));
});

export const getCallbacks = asyncHandler(async (_req, res) => {
  res.json(await reportService.getCallbacks());
});

export const getDispositionDetails = asyncHandler(async (_req, res) => {
  res.json(await reportService.getDispositionDetails());
});

export const getMerchant = asyncHandler(async (req, res) => {
  res.json(await reportService.getMerchant(req.params.id));
});

export const getAdvisorTimeshare = asyncHandler(async (req, res) => {
  res.json(await reportService.getAdvisorTimeshare(req.query));
});

export const getActivitySummary = asyncHandler(async (req, res) => {
  res.json(await reportService.getActivitySummary(req.query));
});

export const getAdvisorLiveStatus = asyncHandler(async (_req, res) => {
  res.json(await reportService.getAdvisorLiveStatus());
});

export const getAdvisorPerformance = asyncHandler(async (_req, res) => {
  res.json(await reportService.getAdvisorPerformance());
});

export const getActivityPerformance = asyncHandler(async (_req, res) => {
  res.json(await reportService.getActivityPerformance());
});

export const getAgentCrmActivityMeta = asyncHandler(async (_req, res) => {
  res.json(await reportService.getAgentCrmActivityMeta());
});

export const getAgentCrmActivity = asyncHandler(async (req, res) => {
  const { rows, filename, format } = await reportService.getAgentCrmActivity(req.query);
  await sendRows(res, rows, { filename, format });
});

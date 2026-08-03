import { asyncHandler } from "../utils/asyncHandler.js";
import { sendRows } from "../utils/export.js";
import * as qualityService from "../services/qualityService.js";

export const listLobs = asyncHandler(async (_req, res) => {
  res.json(await qualityService.listLobs());
});

export const getCalls = asyncHandler(async (req, res) => {
  res.json(await qualityService.getCalls(req.query));
});

export const getGenerateReportOptions = asyncHandler(async (_req, res) => {
  res.json(await qualityService.getGenerateReportOptions());
});

export const generateReport = asyncHandler(async (req, res) => {
  const { rows, filename, format } = await qualityService.generateReport(req.query);
  await sendRows(res, rows, { filename, format });
});

import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboard } from "../services/dashboardService.js";

export const getDashboardHandler = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.query);
  res.json(data);
});

import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./utils/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import qualityRoutes from "./routes/qualityRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { syncService } from "./services/syncService.js";

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/report", requireAuth, reportRoutes);
app.use("/api/activity", requireAuth, activityRoutes);
app.use("/api/quality", requireAuth, qualityRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}/api`));

connectDb()
  .then(async () => {
    console.log("[db] ready");
    await syncService.runSync();
  })
  .catch((err) => {
    console.error("[db] connection failed:", err.message);
    console.error("[db] check DB_URI in .env");
    process.exit(1);
  });

import { ApiError } from "../utils/apiError.js";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ message: err.message });
  }
  if (err?.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  console.error("[error]", req.method, req.originalUrl, err);
  res.status(500).json({ message: "Internal server error" });
}

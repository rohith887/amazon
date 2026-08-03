import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /\.(csv|xlsx|xls)$/i;
  if (allowed.test(file.originalname)) cb(null, true);
  else cb(new Error("Only CSV, XLSX or XLS files are allowed"));
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

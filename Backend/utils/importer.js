import ExcelJS from "exceljs";
import { ApiError } from "./apiError.js";

/**
 * Parse a CSV buffer (byte-order-mark safe) into an array of row objects.
 * Handles quoted fields, escaped quotes and commas inside quotes.
 */
export function parseCsv(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field.trim());
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) pushRow();

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cells) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    return obj;
  });
}

/**
 * Parse an XLSX buffer into an array of row objects using the first worksheet.
 */
export async function parseXlsx(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rawRows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      values.push(v == null ? "" : String(v).trim());
    });
    rawRows.push({ rowNumber, values });
  });

  if (rawRows.length < 2) return [];
  const header = rawRows[0].values;
  const out = [];
  for (let i = 1; i < rawRows.length; i++) {
    const obj = {};
    let hasValue = false;
    header.forEach((h, idx) => {
      if (h === "") return;
      obj[h] = rawRows[i].values[idx] ?? "";
      if (obj[h] !== "") hasValue = true;
    });
    if (hasValue) out.push(obj);
  }
  return out;
}

/**
 * Parse an uploaded file buffer into row objects keyed by header name.
 * Supports CSV and XLSX. .xls (legacy binary) is rejected with a hint.
 */
export async function parseUploadFile(file) {
  if (!file?.buffer) throw new ApiError(400, "File is required");
  const name = String(file.originalname ?? "").toLowerCase();
  if (name.endsWith(".csv")) return parseCsv(file.buffer);
  if (name.endsWith(".xlsx")) return parseXlsx(file.buffer);
  if (name.endsWith(".xls")) {
    throw new ApiError(400, "Legacy .xls files are not supported. Please save the file as .xlsx or .csv and retry.");
  }
  throw new ApiError(400, "Only CSV, XLSX or XLS files are allowed");
}

/**
 * Map parsed rows into record documents.
 *
 * @param {Array} rows          rows as { header: value } objects
 * @param {Object} opts
 * @param {string} opts.activityId
 * @param {string} opts.lobId
 * @param {string} opts.primaryColumn   source column holding the merchant id
 * @param {string} opts.priorityColumn  source column holding the priority (optional)
 * @param {Object} opts.extraMapping    destination field -> source column, e.g. { phone: "Phone Number" }
 */
export function mapRowsToRecords(rows, { activityId, lobId, primaryColumn, priorityColumn, extraMapping = {} }) {
  const seen = new Set();
  const records = [];

  for (const row of rows) {
    const merchantId = String(row[primaryColumn] ?? "").trim();
    if (!merchantId) continue;
    if (seen.has(merchantId)) continue;
    seen.add(merchantId);

    const extra = {};
    for (const [dest, source] of Object.entries(extraMapping)) {
      const value = row[source];
      if (value !== undefined && String(value).trim() !== "") extra[dest] = String(value).trim();
    }

    records.push({
      activity: activityId,
      lob: lobId,
      merchantId,
      phone: extra.phone ?? null,
      priority: priorityColumn ? (String(row[priorityColumn] ?? "").trim() || null) : null,
      status: "fresh",
      extra,
    });
  }

  return { records };
}

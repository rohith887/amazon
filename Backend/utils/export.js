import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";

export function toCsvBuffer(rows) {
  return Buffer.from(stringify(rows, { header: true }));
}

export async function toXlsxBuffer(rows, sheetName = "Report") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow([]);
  if (rows.length > 0) {
    sheet.addRow(Object.keys(rows[0])).font = { bold: true };
    rows.forEach((row) => sheet.addRow(Object.values(row)));
  }
  sheet.views = [{ state: "frozen", ySplit: 2 }];
  return workbook.xlsx.writeBuffer();
}

// Builds a downloadable response from rows. format: "csv" | "xlsx"
export async function sendRows(res, rows, { format = "csv", filename = "report", sheetName = "Report" } = {}) {
  if (format === "xlsx") {
    const buffer = await toXlsxBuffer(rows, sheetName);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(`${filename}.xlsx`)}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(buffer));
  }
  const buffer = toCsvBuffer(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(`${filename}.csv`)}"`);
  res.setHeader("Cache-Control", "no-store");
  return res.send(buffer);
}

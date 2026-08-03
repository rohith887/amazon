import { useMemo, useState } from "react";
import { Button } from "./Button.jsx";
import { EmptyState } from "./EmptyState.jsx";

function cellValue(col, row) {
  return col.sortValue ? col.sortValue(row) : row[col.key];
}

function toCsv(columns, rows) {
  const header = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((row) => columns.map((c) => `"${String(cellValue(c, row) ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function alignClass(align) {
  if (align === "right") return "align-right";
  if (align === "center") return "align-center";
  return "";
}

export function DataTable({
  columns,
  rows = [],
  loading = false,
  searchable = true,
  exportFileName = "report",
  toolbarRight = [],
  emptyTitle,
  emptyHint,
  footerNote,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => columns.some((c) => String(cellValue(c, row) ?? "").toLowerCase().includes(q)));
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = cellValue(col, a);
      const vb = cellValue(col, b);
      if (va === vb) return 0;
      const result = va > vb ? 1 : -1;
      return sort.dir === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sort, columns]);

  function toggleSort(key) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const handleCopy = () => navigator.clipboard.writeText(toCsv(columns, sorted).replace(/,/g, "\t"));
  const handleCsv = () => downloadBlob(toCsv(columns, sorted), `${exportFileName}.csv`, "text/csv");
  const handleExcel = () => {
    const html = `<table><tr>${columns.map((c) => `<th>${c.header}</th>`).join("")}</tr>${sorted
      .map((row) => `<tr>${columns.map((c) => `<td>${String(cellValue(c, row) ?? "")}</td>`).join("")}</tr>`)
      .join("")}</table>`;
    downloadBlob(html, `${exportFileName}.xls`, "application/vnd.ms-excel");
  };
  const handlePrint = () => window.print();

  return (
    <div>
      <div className="table-toolbar">
        <div className="table-toolbar-actions">
          <Button label="Copy" variant="secondary" size="sm" onClick={handleCopy} />
          <Button label="CSV" variant="success" size="sm" onClick={handleCsv} />
          <Button label="Excel" variant="success" size="sm" onClick={handleExcel} />
          <Button label="PDF" variant="success" size="sm" onClick={handlePrint} />
          <Button label="Print" variant="secondary" size="sm" onClick={handlePrint} />
          {toolbarRight}
        </div>
        {searchable ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-500)" }}>Search:</span>
            <input className="table-search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        ) : null}
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : {}}
                  className={alignClass(c.align)}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.header}
                  {sort?.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-400)" }}>
                  Loading…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className={alignClass(c.align)}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footerNote ? <div className="table-footer-note">{footerNote}</div> : null}
    </div>
  );
}

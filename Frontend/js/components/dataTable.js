import { el, clear } from "../dom.js";
import { button } from "./button.js";
import { emptyState } from "./emptyState.js";

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

export function dataTable({
  columns,
  rows: initialRows = [],
  loading: initialLoading = false,
  searchable = true,
  exportFileName = "report",
  toolbarRight = [],
  emptyTitle,
  emptyHint,
  footerNote,
}) {
  let rows = initialRows;
  let loading = initialLoading;
  let query = "";
  let sort = null; // { key, dir }

  const searchInput = el("input", {
    class: "table-search",
    placeholder: "",
    oninput: (e) => {
      query = e.target.value;
      renderBody();
    },
  });

  const handleCopy = () => navigator.clipboard.writeText(toCsv(columns, getSorted()).replace(/,/g, "\t"));
  const handleCsv = () => downloadBlob(toCsv(columns, getSorted()), `${exportFileName}.csv`, "text/csv");
  const handleExcel = () => {
    const html = `<table><tr>${columns.map((c) => `<th>${c.header}</th>`).join("")}</tr>${getSorted()
      .map((row) => `<tr>${columns.map((c) => `<td>${String(cellValue(c, row) ?? "")}</td>`).join("")}</tr>`)
      .join("")}</table>`;
    downloadBlob(html, `${exportFileName}.xls`, "application/vnd.ms-excel");
  };
  const handlePrint = () => window.print();

  const toolbar = el("div", { class: "table-toolbar" }, [
    el("div", { class: "table-toolbar-actions" }, [
      button({ label: "Copy", variant: "secondary", size: "sm", onClick: handleCopy }),
      button({ label: "CSV", variant: "success", size: "sm", onClick: handleCsv }),
      button({ label: "Excel", variant: "success", size: "sm", onClick: handleExcel }),
      button({ label: "PDF", variant: "success", size: "sm", onClick: handlePrint }),
      button({ label: "Print", variant: "secondary", size: "sm", onClick: handlePrint }),
      ...toolbarRight,
    ]),
    searchable
      ? el("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
          el("span", { style: { fontSize: "13px", color: "var(--ink-500)" } }, ["Search:"]),
          searchInput,
        ])
      : null,
  ]);

  const tableScroll = el("div", { class: "table-scroll" });
  const footer = footerNote ? el("div", { class: "table-footer-note" }, [footerNote]) : null;

  function getFiltered() {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => columns.some((c) => String(cellValue(c, row) ?? "").toLowerCase().includes(q)));
  }

  function getSorted() {
    const filtered = getFiltered();
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
  }

  function alignClass(align) {
    if (align === "right") return "align-right";
    if (align === "center") return "align-center";
    return "";
  }

  function renderBody() {
    clear(tableScroll);
    const sorted = getSorted();

    const theadRow = el(
      "tr",
      {},
      columns.map((c) =>
        el(
          "th",
          {
            style: c.width ? { width: c.width } : {},
            class: alignClass(c.align),
            onClick: () => {
              if (!sort || sort.key !== c.key) sort = { key: c.key, dir: "asc" };
              else if (sort.dir === "asc") sort = { key: c.key, dir: "desc" };
              else sort = null;
              renderBody();
            },
          },
          [c.header + (sort?.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : "")],
        ),
      ),
    );

    let tbody;
    if (loading) {
      tbody = el("tbody", {}, [
        el("tr", {}, [el("td", { colspan: columns.length, style: { textAlign: "center", padding: "64px 0", color: "var(--ink-400)" } }, ["Loading…"])]),
      ]);
    } else if (sorted.length === 0) {
      tbody = el("tbody", {}, [el("tr", {}, [el("td", { colspan: columns.length }, [emptyState({ title: emptyTitle, hint: emptyHint })])])]);
    } else {
      tbody = el(
        "tbody",
        {},
        sorted.map((row) =>
          el(
            "tr",
            {},
            columns.map((c) => el("td", { class: alignClass(c.align) }, [c.render ? c.render(row) : String(row[c.key] ?? "")])),
          ),
        ),
      );
    }

    const table = el("table", { class: "data-table" }, [el("thead", {}, [theadRow]), tbody]);
    tableScroll.append(table);
  }

  renderBody();

  const container = el("div", {}, [toolbar, tableScroll, footer]);

  container.setData = (nextRows, nextLoading = false) => {
    rows = nextRows;
    loading = nextLoading;
    renderBody();
  };

  return container;
}

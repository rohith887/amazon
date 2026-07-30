import { el, mount, formatDateTime } from "../../dom.js";
import { api, ApiError } from "../../api.js";
import { card, cardHeader, cardBody } from "../../components/card.js";
import { textField } from "../../components/field.js";
import { button } from "../../components/button.js";
import { dataTable } from "../../components/dataTable.js";
import { emptyState } from "../../components/emptyState.js";

export async function renderSearchMerchant(container) {
  const merchantField = textField({ label: "Merchant ID", placeholder: "e.g. 8413218735" });
  const resultsWrap = el("div");

  const searchBtn = button({
    label: "Search Merchant",
    disabled: true,
    onClick: async () => {
      const id = merchantField.input.value.trim();
      if (!id) return;
      searchBtn.disabled = true;
      searchBtn.textContent = "Searching…";
      try {
        const result = await api.get(`/report/merchant/${encodeURIComponent(id)}`);
        renderResult(result);
      } catch (err) {
        renderError(err instanceof ApiError ? err.message : "No merchant found with that ID.");
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search Merchant";
      }
    },
  });

  merchantField.input.addEventListener("input", () => {
    searchBtn.disabled = !merchantField.input.value.trim();
  });
  merchantField.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });

  function renderError(message) {
    resultsWrap.innerHTML = "";
    resultsWrap.append(card([emptyState({ title: message })]));
  }

  function renderResult(result) {
    resultsWrap.innerHTML = "";
    const detailGrid = el("div", { class: "form-grid" }, [
      detailItem("Merchant Name", result.merchantName),
      detailItem("LOB", result.lob),
      detailItem("Activity", result.activity),
      detailItem("Phone", result.phone),
    ]);

    const table = dataTable({
      columns: [
        { key: "date", header: "Date", render: (r) => formatDateTime(r.date) },
        { key: "advisor", header: "Advisor" },
        { key: "activity", header: "Activity" },
        { key: "disposition", header: "Disposition" },
        { key: "remarks", header: "Remarks" },
      ],
      rows: result.interactions,
      exportFileName: `merchant-${result.merchantId}`,
    });

    resultsWrap.append(card([cardHeader(`Merchant ${result.merchantId}`), detailGrid, table]));
  }

  function detailItem(label, value) {
    return el("div", {}, [
      el("p", { style: { fontSize: "12px", color: "var(--ink-500)", margin: "0 0 2px" } }, [label]),
      el("p", { style: { fontSize: "13.5px", fontWeight: "500", color: "var(--ink-900)", margin: "0" } }, [value]),
    ]);
  }

  const searchCard = card([
    cardHeader("Merchant Details and Interactions"),
    cardBody([el("div", { style: { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" } }, [el("div", { style: { maxWidth: "280px", width: "100%" } }, [merchantField]), searchBtn])]),
  ]);

  mount(container, searchCard, resultsWrap);
}

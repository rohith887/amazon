import { el, mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, textField, setSelectOptions } from "../../components/field.js";
import { button } from "../../components/button.js";
import { toggle } from "../../components/toggle.js";

export async function renderManageDispositions(container) {
  let mode = "dispositions";
  const lobs = await api.get("/activity/lobs");

  function headerActions() {
    return [
      button({ label: "Add Dispositions", variant: mode === "dispositions" ? "primary" : "secondary", size: "sm", onClick: () => setMode("dispositions") }),
      button({ label: "Add SubDispositions", variant: mode === "sub-dispositions" ? "success" : "secondary", size: "sm", onClick: () => setMode("sub-dispositions") }),
    ];
  }

  function setMode(next) {
    mode = next;
    render();
  }

  function render() {
    container.innerHTML = "";
    if (mode === "dispositions") renderDispositionForm();
    else renderSubDispositionForm();
  }

  function renderDispositionForm() {
    const state = { lob: "", name: "", connected: false, closed: false, completed: false };

    const lobField = selectField({ label: "Select LOB", placeholder: "Select LOB", options: lobs, onChange: (v) => (state.lob = v) });
    const nameField = textField({ label: "New Disposition", onInput: (v) => (state.name = v) });
    const connectedToggle = toggle({ label: "Connected", onChange: (v) => (state.connected = v) });
    const closedToggle = toggle({ label: "Closed - Record will not come back for Reattempt", onChange: (v) => (state.closed = v) });
    const completedToggle = toggle({ label: "Completed - Record is marked as Success", onChange: (v) => (state.completed = v) });
    const messageEl = el("p", { class: "hidden", style: { fontSize: "13px", color: "var(--success-500)" } });

    const submitBtn = button({
      label: "Add New Disposition",
      disabled: true,
      onClick: async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving…";
        await api.post("/activity/dispositions", { lob: state.lob, name: state.name, connected: state.connected, closed: state.closed, completed: state.completed });
        messageEl.textContent = `Disposition "${state.name}" added.`;
        messageEl.classList.remove("hidden");
        nameField.input.value = "";
        state.name = "";
        submitBtn.textContent = "Add New Disposition";
        refreshBtn();
      },
    });

    function refreshBtn() {
      submitBtn.disabled = !state.lob || !state.name.trim();
    }
    lobField.select.addEventListener("change", refreshBtn);
    nameField.input.addEventListener("input", refreshBtn);

    mount(
      container,
      card([
        cardHeader("Add Disposition", headerActions()),
        el("div", { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "20px" } }, [
          lobField,
          el("div", { style: { borderTop: "1px solid var(--ink-100)" } }),
          nameField,
          el("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, [connectedToggle, closedToggle, completedToggle]),
          messageEl,
          submitBtn,
        ]),
      ]),
    );
  }

  function renderSubDispositionForm() {
    const state = { lob: "", disposition: "", name: "" };

    const dispositionField = selectField({ label: "Select Disposition", placeholder: "Select Disposition", options: [], disabled: true, onChange: (v) => { state.disposition = v; refreshBtn(); } });
    const lobField = selectField({
      label: "Select LOB",
      placeholder: "Select LOB",
      options: lobs,
      onChange: async (v) => {
        state.lob = v;
        state.disposition = "";
        dispositionField.select.disabled = !v;
        if (v) {
          const dispositions = await api.get("/activity/dispositions", { lob: v });
          setSelectOptions(dispositionField, dispositions, "Select Disposition");
        }
        refreshBtn();
      },
    });
    const nameField = textField({ label: "New SubDisposition", onInput: (v) => { state.name = v; refreshBtn(); } });
    const messageEl = el("p", { class: "hidden", style: { fontSize: "13px", color: "var(--success-500)" } });

    const submitBtn = button({
      label: "Add New SubDisposition",
      disabled: true,
      onClick: async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving…";
        await api.post("/activity/sub-dispositions", { lob: state.lob, disposition: state.disposition, name: state.name });
        messageEl.textContent = `Sub-disposition "${state.name}" added.`;
        messageEl.classList.remove("hidden");
        nameField.input.value = "";
        state.name = "";
        submitBtn.textContent = "Add New SubDisposition";
        refreshBtn();
      },
    });

    function refreshBtn() {
      submitBtn.disabled = !state.lob || !state.disposition || !state.name.trim();
    }

    mount(
      container,
      card([
        cardHeader("Add SubDisposition", headerActions()),
        el("div", { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "20px" } }, [lobField, dispositionField, nameField, messageEl, submitBtn]),
      ]),
    );
  }

  render();
}

import { el, mount } from "../../dom.js";
import { api } from "../../api.js";
import { card, cardHeader } from "../../components/card.js";
import { selectField, textField } from "../../components/field.js";
import { button } from "../../components/button.js";
import { toggle } from "../../components/toggle.js";

const STRATEGY_OPTIONS = [
  { label: "Round Robin", value: "round_robin" },
  { label: "Priority Based", value: "priority" },
  { label: "Equal Split", value: "equal_split" },
];

export async function renderPendingDataAutoAssign(container) {
  const activities = await api.get("/activity/list-options");
  const state = { activity: "", enabled: false, strategy: "round_robin", inactiveMinutes: "30" };

  const configWrap = el("div", { style: { display: "none", flexDirection: "column", gap: "20px" } });
  const savedMsg = el("p", { class: "hidden", style: { fontSize: "13px", color: "var(--success-500)" } });

  const activityField = selectField({
    label: "Select Activity",
    placeholder: "Select Activity",
    options: activities,
    onChange: (v) => {
      state.activity = v;
      configWrap.style.display = v ? "flex" : "none";
    },
  });

  const enabledToggle = toggle({
    label: "Enable automatic reassignment for this activity",
    onChange: (v) => {
      state.enabled = v;
      strategyField.select.disabled = !v;
      minutesField.input.disabled = !v;
    },
  });

  const strategyField = selectField({ label: "Assignment Strategy", value: state.strategy, options: STRATEGY_OPTIONS, disabled: true, onChange: (v) => (state.strategy = v) });
  const minutesField = textField({ label: "Reassign after advisor inactive for (minutes)", type: "number", value: state.inactiveMinutes, disabled: true, onInput: (v) => (state.inactiveMinutes = v) });

  const saveBtn = button({
    label: "Save Configuration",
    onClick: async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
      await api.post(`/activity/${state.activity}/auto-assign`, {
        enabled: state.enabled,
        strategy: state.strategy,
        inactiveMinutes: Number(state.inactiveMinutes),
      });
      savedMsg.classList.remove("hidden");
      setTimeout(() => savedMsg.classList.add("hidden"), 3000);
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Configuration";
    },
  });

  configWrap.append(
    el("div", { style: { borderTop: "1px solid var(--ink-100)", paddingTop: "20px" } }, [enabledToggle]),
    el("div", { class: "form-grid", style: { padding: "0" } }, [strategyField, minutesField]),
    savedMsg,
    saveBtn,
  );

  mount(
    container,
    card([
      cardHeader("Pending Data Auto Assign"),
      el("div", { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "20px" } }, [
        el("div", { style: { maxWidth: "320px" } }, [activityField]),
        configWrap,
      ]),
    ]),
  );
}

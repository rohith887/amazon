import { el } from "../dom.js";
import { icons } from "./icons.js";

export function emptyState({ title = "No data available", hint } = {}) {
  return el("div", { class: "empty-state" }, [
    el("div", { class: "empty-state-icon" }, [icons.empty()]),
    el("p", { class: "empty-state-title" }, [title]),
    hint ? el("p", { class: "empty-state-hint" }, [hint]) : null,
  ]);
}

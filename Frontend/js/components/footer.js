import { el } from "../dom.js";

export function renderFooter() {
  return el("footer", { class: "app-footer" }, ["Powered by ", el("span", { class: "brand-red" }, ["Grassroots"]), " © 2026"]);
}

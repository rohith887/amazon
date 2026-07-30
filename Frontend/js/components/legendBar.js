import { el } from "../dom.js";

export function legendBar(items) {
  return el(
    "div",
    { class: "legend-bar" },
    items.map((item) => el("span", {}, [el("strong", {}, [`${item.abbr}: `]), item.full])),
  );
}

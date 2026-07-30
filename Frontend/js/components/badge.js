import { el } from "../dom.js";

export function badge(text, tone = "neutral") {
  return el("span", { class: `badge badge-${tone}` }, [el("span", { class: "badge-dot" }), text]);
}

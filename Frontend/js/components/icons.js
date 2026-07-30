import { el } from "../dom.js";

function svg(paths, viewBox = "0 0 24 24") {
  return el("svg", { width: "18", height: "18", viewBox, fill: "none", stroke: "currentColor", "stroke-width": "1.8" }, paths);
}

export const icons = {
  dashboard: () =>
    svg([
      el("rect", { x: "3", y: "3", width: "8", height: "10", rx: "1.5" }),
      el("rect", { x: "13", y: "3", width: "8", height: "6", rx: "1.5" }),
      el("rect", { x: "13", y: "13", width: "8", height: "8", rx: "1.5" }),
      el("rect", { x: "3", y: "17", width: "8", height: "4", rx: "1.5" }),
    ]),
  report: () =>
    svg([
      el("path", { d: "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" }),
      el("path", { d: "M14 3v5h5" }),
      el("path", { d: "M9 13h6M9 17h6M9 9h2", "stroke-linecap": "round" }),
    ]),
  activity: () =>
    svg([el("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2", "stroke-linecap": "round", "stroke-linejoin": "round" })]),
  quality: () =>
    svg([
      el("path", {
        d: "M12 2l3 6.5 7 1-5.2 5 1.3 7L12 18l-6.1 3.5 1.3-7L2 9.5l7-1L12 2z",
        "stroke-linejoin": "round",
      }),
    ]),
  chevronDown: () =>
    el(
      "svg",
      { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", class: "chevron" },
      [el("path", { d: "M6 9l6 6 6-6", "stroke-linecap": "round", "stroke-linejoin": "round" })],
    ),
  menu: () =>
    svg([
      el("path", { d: "M3 6h18M3 12h18M3 18h18", "stroke-linecap": "round" }),
    ]),
  logout: () =>
    svg([
      el("path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "stroke-linecap": "round" }),
      el("path", { d: "M16 17l5-5-5-5M21 12H9", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ]),
  empty: () =>
    el(
      "svg",
      { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.5" },
      [el("path", { d: "M3 7h18M3 12h18M3 17h12", "stroke-linecap": "round" })],
    ),
};

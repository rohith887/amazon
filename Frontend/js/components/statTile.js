import { el, formatNumber } from "../dom.js";

export function statTile({ label, value, colorVar }) {
  const tile = el("div", { class: "stat-tile" }, [
    el("span", { class: "stat-icon" }, [el("span", { class: "stat-dot" })]),
    el("div", {}, [el("p", { class: "stat-label" }, [label]), el("p", { class: "stat-value" }, [formatNumber(value)])]),
  ]);
  tile.style.setProperty("--tile-accent", `var(${colorVar})`);
  return tile;
}

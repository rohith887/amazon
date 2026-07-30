import { el } from "../dom.js";

export function button({ label, variant = "primary", size = "md", onClick, disabled = false, type = "button" }) {
  const classes = ["btn", `btn-${variant}`];
  if (size === "sm") classes.push("btn-sm");
  return el("button", { class: classes.join(" "), type, onClick, disabled }, [label]);
}

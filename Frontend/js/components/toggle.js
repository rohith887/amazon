import { el } from "../dom.js";

export function toggle({ checked = false, disabled = false, label, onChange }) {
  let state = checked;

  const track = el("span", { class: `toggle-track${state ? " checked" : ""}` }, [el("span", { class: "toggle-thumb" })]);

  const wrapper = el(
    "span",
    {
      class: `toggle${disabled ? " disabled" : ""}`,
      onClick: () => {
        if (disabled) return;
        state = !state;
        track.className = `toggle-track${state ? " checked" : ""}`;
        onChange?.(state);
      },
    },
    [track, label ? el("span", { class: "toggle-text" }, [label]) : null],
  );

  wrapper.getChecked = () => state;
  return wrapper;
}

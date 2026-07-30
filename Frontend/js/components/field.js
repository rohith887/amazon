import { el } from "../dom.js";

function labelRow(label, required) {
  if (!label) return null;
  return el("span", { class: "field-label" }, [label, required ? el("span", { class: "required" }, [" *"]) : null]);
}

export function textField({ label, type = "text", value = "", placeholder, required, disabled, hint, onInput, min, autofocus }) {
  const input = el("input", {
    class: "field-control",
    type,
    value,
    placeholder,
    required,
    disabled,
    min,
    autofocus,
    oninput: onInput ? (e) => onInput(e.target.value, e) : undefined,
  });
  const wrapper = el("label", { class: "field" }, [
    labelRow(label, required),
    input,
    hint ? el("span", { class: "field-hint" }, [hint]) : null,
  ]);
  wrapper.input = input;
  return wrapper;
}

export function selectField({ label, value = "", placeholder, options = [], required, disabled, onChange, hint }) {
  const select = el(
    "select",
    { class: "field-control", required, disabled, onchange: onChange ? (e) => onChange(e.target.value, e) : undefined },
    [
      placeholder ? el("option", { value: "", disabled: Boolean(required) }, [placeholder]) : null,
      ...options.map((opt) => el("option", { value: opt.value, selected: opt.value === value }, [opt.label])),
    ],
  );
  select.value = value;
  const wrapper = el("label", { class: "field" }, [
    labelRow(label, required),
    select,
    hint ? el("span", { class: "field-hint" }, [hint]) : null,
  ]);
  wrapper.select = select;
  return wrapper;
}

export function setSelectOptions(field, options, placeholder) {
  const select = field.select;
  const previousValue = select.value;
  select.innerHTML = "";
  if (placeholder) {
    select.append(el("option", { value: "", disabled: true }, [placeholder]));
  }
  for (const opt of options) {
    select.append(el("option", { value: opt.value }, [opt.label]));
  }
  const stillExists = options.some((o) => o.value === previousValue);
  select.value = stillExists ? previousValue : "";
}

export function textAreaField({ label, value = "", placeholder, disabled, onInput, hint }) {
  const textarea = el("textarea", {
    class: "field-control",
    placeholder,
    disabled,
    oninput: onInput ? (e) => onInput(e.target.value, e) : undefined,
  });
  textarea.value = value;
  const wrapper = el("label", { class: "field" }, [
    labelRow(label, false),
    textarea,
    hint ? el("span", { class: "field-hint" }, [hint]) : null,
  ]);
  wrapper.textarea = textarea;
  return wrapper;
}

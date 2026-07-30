import { el } from "../dom.js";

export function card(children) {
  return el("div", { class: "card" }, children);
}

export function cardHeader(title, actions = []) {
  return el("div", { class: "card-header" }, [
    el("h2", {}, [el("span", { class: "card-header-accent" }), title]),
    actions.length ? el("div", { class: "card-actions" }, actions) : null,
  ]);
}

export function cardBody(children) {
  return el("div", { class: "card-body" }, children);
}

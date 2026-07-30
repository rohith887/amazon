import { el } from "../dom.js";
import { icons } from "./icons.js";
import { currentUser, logout } from "../auth.js";
import { findBreadcrumb } from "../nav.js";

export function renderTopbar(initialPath) {
  const user = currentUser();

  const breadcrumb = el("div", { class: "topbar-breadcrumb" });

  const topbar = el("header", { class: "topbar" }, [
    breadcrumb,
    el("div", { class: "topbar-right" }, [
      el("img", { class: "topbar-logo", src: "/assets/grassroots-logo.png", alt: "Grassroots" }),
      el("span", { class: "topbar-welcome" }, ["Welcome ", el("strong", {}, [user?.name ?? ""])]),
      el("span", { class: "topbar-divider" }),
      el("button", { class: "logout-btn", title: "Sign out", onClick: logout }, [icons.logout()]),
    ]),
  ]);

  topbar.updateTitle = (path) => {
    breadcrumb.innerHTML = "";
    const crumbs = findBreadcrumb(path);
    crumbs.forEach((label, i) => {
      const isLast = i === crumbs.length - 1;
      if (i > 0) breadcrumb.append(el("span", { class: "topbar-breadcrumb-sep" }, [icons.chevronDown()]));
      breadcrumb.append(el("span", { class: isLast ? "topbar-breadcrumb-current" : "topbar-breadcrumb-parent" }, [label]));
    });
  };
  topbar.updateTitle(initialPath ?? "");

  return topbar;
}

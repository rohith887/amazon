import { el } from "../dom.js";
import { NAV } from "../nav.js";
import { icons } from "./icons.js";
import { navigate } from "../router.js";

const SECTION_ICONS = {
  Dashboard: icons.dashboard,
  Report: icons.report,
  Activity: icons.activity,
  Quality: icons.quality,
};

const COLLAPSE_KEY = "grassroots_sidebar_collapsed";

export function renderSidebar(initialPath) {
  const groupState = {};
  const linkRefs = [];
  const groupRefs = [];

  for (const section of NAV) {
    if (section.children) {
      groupState[section.label] = initialPath.startsWith(section.path);
    }
  }

  function buildLink(item, isChild) {
    const link = el(
      "a",
      {
        href: `#${item.path}`,
        class: `nav-link${isChild ? "" : ""}`,
        onClick: (e) => {
          e.preventDefault();
          navigate(item.path);
        },
      },
      isChild
        ? [item.label]
        : [el("span", { class: "nav-icon" }, [SECTION_ICONS[item.label]?.()]), el("span", { class: "nav-label" }, [item.label])],
    );
    linkRefs.push({ path: item.path, el: link });
    return link;
  }

  const sections = NAV.map((section) => {
    if (!section.children) {
      return buildLink(section, false);
    }

    const childrenWrap = el(
      "div",
      { class: "nav-children" },
      section.children.map((child) => buildLink(child, true)),
    );
    childrenWrap.classList.toggle("hidden", !groupState[section.label]);

    const groupBtn = el(
      "button",
      {
        class: `nav-group-btn${groupState[section.label] ? " open" : ""}`,
        onClick: () => {
          groupState[section.label] = !groupState[section.label];
          groupBtn.classList.toggle("open", groupState[section.label]);
          childrenWrap.classList.toggle("hidden", !groupState[section.label]);
        },
      },
      [
        el("span", { class: "nav-icon" }, [SECTION_ICONS[section.label]?.()]),
        el("span", { class: "nav-label" }, [section.label]),
        icons.chevronDown(),
      ],
    );
    groupRefs.push({ path: section.path, btn: groupBtn, wrap: childrenWrap, label: section.label });

    return el("div", {}, [groupBtn, childrenWrap]);
  });

  const navBody = el("div", { class: "sidebar-nav" }, sections);

  const logo = el("div", { class: "sidebar-logo-crop" }, [
    el("img", { class: "sidebar-logo", src: "/assets/amazon-logo.png", alt: "Amazon" }),
  ]);
  const collapseBtn = el(
    "button",
    { class: "sidebar-collapse-btn", title: "Collapse sidebar", onClick: () => toggleCollapsed() },
    [icons.menu()],
  );
  const header = el("div", { class: "sidebar-header" }, [logo, collapseBtn]);

  const nav = el("aside", { class: "sidebar" }, [header, navBody]);

  function toggleCollapsed(force) {
    const collapsed = force ?? !nav.classList.contains("collapsed");
    nav.classList.toggle("collapsed", collapsed);
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }

  toggleCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");

  nav.updateActive = (path) => {
    for (const ref of linkRefs) {
      ref.el.classList.toggle("active", ref.path === path);
    }
    for (const ref of groupRefs) {
      const isActiveGroup = path.startsWith(ref.path);
      ref.btn.classList.toggle("active-group", isActiveGroup);
      if (isActiveGroup && ref.wrap.classList.contains("hidden")) {
        ref.wrap.classList.remove("hidden");
        ref.btn.classList.add("open");
      }
    }
  };

  nav.updateActive(initialPath);
  return nav;
}

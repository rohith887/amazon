import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NAV } from "../../nav.js";
import { icons } from "../ui/Icons.jsx";

const SECTION_ICONS = {
  Dashboard: icons.dashboard,
  Report: icons.report,
  Activity: icons.activity,
  Quality: icons.quality,
};

const COLLAPSE_KEY = "grassroots_sidebar_collapsed";

export default function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [manualGroups, setManualGroups] = useState(() => {
    const init = {};
    for (const section of NAV) {
      if (section.children) init[section.label] = pathname.startsWith(section.path);
    }
    return init;
  });

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  function buildLink(item) {
    const active = pathname === item.path;
    return (
      <Link key={item.path} to={item.path} className={`nav-link${active ? " active" : ""}`}>
        {item.children ? (
          <>
            <span className="nav-icon">{SECTION_ICONS[item.label]?.()}</span>
            <span className="nav-label">{item.label}</span>
          </>
        ) : (
          item.label
        )}
      </Link>
    );
  }

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-crop">
          <img className="sidebar-logo" src="/assets/amazon-logo.png" alt="Amazon" />
        </div>
        <button className="sidebar-collapse-btn" title="Collapse sidebar" onClick={toggleCollapsed}>
          {icons.menu()}
        </button>
      </div>
      <div className="sidebar-nav">
        {NAV.map((section) => {
          if (!section.children) return buildLink(section);

          const isActiveGroup = pathname.startsWith(section.path);
          const open = manualGroups[section.label] || isActiveGroup;
          return (
            <div key={section.label}>
              <button
                className={`nav-group-btn${open ? " open" : ""}${isActiveGroup ? " active-group" : ""}`}
                onClick={() => setManualGroups((prev) => ({ ...prev, [section.label]: !prev[section.label] }))}
              >
                <span className="nav-icon">{SECTION_ICONS[section.label]?.()}</span>
                <span className="nav-label">{section.label}</span>
                {icons.chevronDown()}
              </button>
              <div className={`nav-children${open ? "" : " hidden"}`}>{section.children.map((child) => buildLink(child))}</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

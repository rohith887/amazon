import { useLocation, useNavigate } from "react-router-dom";
import { icons } from "../ui/Icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { findBreadcrumb } from "../../nav.js";

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const crumbs = findBreadcrumb(pathname);

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        {crumbs.map((label, i) => (
          <span key={`${label}-${i}`} className={i === crumbs.length - 1 ? "topbar-breadcrumb-current" : "topbar-breadcrumb-parent"}>
            {i > 0 ? (
              <>
                <span className="topbar-breadcrumb-sep">{icons.chevronDown()}</span>
                {label}
              </>
            ) : (
              label
            )}
          </span>
        ))}
      </div>
      <div className="topbar-right">
        <img className="topbar-logo" src="/assets/grassroots-logo.png" alt="Grassroots" />
        <span className="topbar-welcome">
          Welcome <strong>{user?.name ?? ""}</strong>
        </span>
        <span className="topbar-divider" />
        <button
          className="logout-btn"
          title="Sign out"
          onClick={() => {
            signOut();
            navigate("/login");
          }}
        >
          {icons.logout()}
        </button>
      </div>
    </header>
  );
}

import { formatNumber } from "../../utils/format.js";

export function StatTile({ label, value, colorVar }) {
  return (
    <div className="stat-tile" style={{ "--tile-accent": `var(${colorVar})` }}>
      <span className="stat-icon">
        <span className="stat-dot" />
      </span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{formatNumber(value)}</p>
      </div>
    </div>
  );
}

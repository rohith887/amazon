import { icons } from "./Icons.jsx";

export function EmptyState({ title = "No data available", hint }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icons.empty()}</div>
      <p className="empty-state-title">{title}</p>
      {hint ? <p className="empty-state-hint">{hint}</p> : null}
    </div>
  );
}

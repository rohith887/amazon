export function Toggle({ checked = false, disabled = false, label, onChange }) {
  return (
    <span
      className={`toggle${disabled ? " disabled" : ""}`}
      onClick={() => {
        if (disabled) return;
        onChange?.(!checked);
      }}
    >
      <span className={`toggle-track${checked ? " checked" : ""}`}>
        <span className="toggle-thumb" />
      </span>
      {label ? <span className="toggle-text">{label}</span> : null}
    </span>
  );
}

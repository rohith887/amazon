export function Button({ label, variant = "primary", size = "md", onClick, disabled = false, type = "button", className = "", style }) {
  const classes = ["btn", `btn-${variant}`];
  if (size === "sm") classes.push("btn-sm");
  if (className) classes.push(className);
  return (
    <button type={type} className={classes.join(" ")} onClick={onClick} disabled={disabled} style={style}>
      {label}
    </button>
  );
}

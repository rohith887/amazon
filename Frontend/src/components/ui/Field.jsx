function FieldLabel({ label, required }) {
  if (!label) return null;
  return (
    <span className="field-label">
      {label}
      {required ? <span className="required"> *</span> : null}
    </span>
  );
}

export function TextField({ label, type = "text", value = "", placeholder, required, disabled, hint, onChange, onKeyDown, min, autoFocus }) {
  return (
    <label className="field">
      <FieldLabel label={label} required={required} />
      <input
        className="field-control"
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        autoFocus={autoFocus}
        onChange={(e) => onChange?.(e.target.value, e)}
        onKeyDown={onKeyDown}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function SelectField({ label, value = "", placeholder, options = [], required, disabled, onChange, hint }) {
  return (
    <label className="field">
      <FieldLabel label={label} required={required} />
      <select
        className="field-control"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
      >
        {placeholder ? (
          <option value="" disabled={Boolean(required)}>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, value = "", placeholder, disabled, onChange, hint }) {
  return (
    <label className="field">
      <FieldLabel label={label} required={false} />
      <textarea
        className="field-control"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

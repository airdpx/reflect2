import type React from "react";

export function SelectControl({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={typeof option === "string" ? option : option.value} value={typeof option === "string" ? option : option.value}>
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  disabled,
  hint,
  className,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  className?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={`check-row ${className || ""}`.trim()}>
      <span>
        {label}
        {hint ? (
          <>
            <br />
            <small className="muted">{hint}</small>
          </>
        ) : null}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

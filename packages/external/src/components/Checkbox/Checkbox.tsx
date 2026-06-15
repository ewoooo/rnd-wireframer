import styles from './Checkbox.module.css';

// Checkmark path from Figma node 9504:14550
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.3999 8.48077L8.14276 11.25L12.5999 6.75"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── CheckboxItem (18×18 circle) ───────────────────────────────────────────────
interface CheckboxItemProps {
  checked?: boolean;
  disabled?: boolean;
}

export function CheckboxItem({ checked = false, disabled = false }: CheckboxItemProps) {
  const checkColor = checked
    ? '#ffffff'
    : disabled
    ? 'rgba(5,0,26,0.10)'
    : 'rgba(6,12,31,0.20)';

  return (
    <div
      className={[
        styles.checkboxItem,
        checked ? styles.checkboxChecked : styles.checkboxUnchecked,
        disabled ? styles.checkboxDisabled : '',
      ].join(' ')}
    >
      <CheckIcon color={checkColor} />
    </div>
  );
}

// ── CheckboxText (CheckboxItem + label) ───────────────────────────────────────
interface CheckboxTextProps {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function CheckboxText({ label, checked = false, disabled = false, onChange }: CheckboxTextProps) {
  return (
    <label className={[styles.checkboxText, disabled ? styles.textDisabled : ''].join(' ')}>
      <input
        type="checkbox"
        className={styles.hiddenInput}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <CheckboxItem checked={checked} disabled={disabled} />
      <span className={styles.label}>{label}</span>
    </label>
  );
}

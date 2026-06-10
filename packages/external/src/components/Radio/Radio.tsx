import styles from './Radio.module.css';

// ── RadioItem (18×18) ─────────────────────────────────────────────────────────
interface RadioItemProps {
  checked?: boolean;
  disabled?: boolean;
}

export function RadioItem({ checked = false, disabled = false }: RadioItemProps) {
  return (
    <div
      className={[
        styles.radioItem,
        checked ? styles.radioChecked : styles.radioUnchecked,
        disabled ? styles.radioDisabled : '',
      ].join(' ')}
    >
      {checked && <div className={styles.radioDot} />}
    </div>
  );
}

// ── RadioText (RadioItem + label) ─────────────────────────────────────────────
interface RadioTextProps {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function RadioText({ label, checked = false, disabled = false, onChange }: RadioTextProps) {
  return (
    <label className={[styles.radioText, disabled ? styles.textDisabled : ''].join(' ')}>
      <input
        type="radio"
        className={styles.hiddenInput}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <RadioItem checked={checked} disabled={disabled} />
      <span className={styles.label}>{label}</span>
    </label>
  );
}

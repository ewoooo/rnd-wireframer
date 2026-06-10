import styles from './TextField.module.css';

type TextFieldState = 'default' | 'focused' | 'typing' | 'typed' | 'disabled';

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  value?: string;
  type?: string;
  state?: TextFieldState;
  error?: boolean;
  rightElement?: React.ReactNode;
  onChange?: (value: string) => void;
}

export function TextField({
  label,
  placeholder = '입력해주세요',
  helperText,
  value = '',
  type = 'text',
  state = 'default',
  error = false,
  rightElement,
  onChange,
}: TextFieldProps) {
  const inputClass = [
    styles.input,
    styles[state],
    error ? styles.error : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      {label && (
        <label className={[styles.label, error ? styles.labelError : ''].filter(Boolean).join(' ')}>
          {label}
        </label>
      )}
      <div className={styles.inputRow}>
        <div className={inputClass}>
          <input
            className={styles.inputField}
            type={type}
            placeholder={placeholder}
            value={value}
            disabled={state === 'disabled'}
            onChange={(e) => onChange?.(e.target.value)}
          />
        </div>
        {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
      </div>
      {helperText && (
        <p className={[styles.helperText, error ? styles.helperError : ''].filter(Boolean).join(' ')}>
          {helperText}
        </p>
      )}
    </div>
  );
}

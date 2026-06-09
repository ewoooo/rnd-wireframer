import styles from './ButtonTextUnderline.module.css';

interface ButtonTextUnderlineProps {
  label: string;
  color?: string;
  onClick?: () => void;
}

export function ButtonTextUnderline({ label, color, onClick }: ButtonTextUnderlineProps) {
  return (
    <button className={styles.btn} style={color ? { color } : undefined} onClick={onClick}>
      {label}
    </button>
  );
}

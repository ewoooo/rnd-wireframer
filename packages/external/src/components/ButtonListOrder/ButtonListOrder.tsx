import styles from './ButtonListOrder.module.css';

// Figma node 10338:55237 — dropdown chevron (16×16, fill="currentColor")
function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5195 10.7018C7.7818 10.9744 8.218 10.9744 8.4803 10.7018L11.5324 7.52998C11.9399 7.10644 11.6398 6.40106 11.052 6.40106H4.9478C4.36 6.40106 4.0598 7.10644 4.4674 7.52998L7.5195 10.7018Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ButtonListOrderProps {
  label: string;
  onClick?: () => void;
}

export function ButtonListOrder({ label, onClick }: ButtonListOrderProps) {
  return (
    <button className={styles.btn} onClick={onClick}>
      <span className={styles.label}>{label}</span>
      <ChevronDownIcon />
    </button>
  );
}

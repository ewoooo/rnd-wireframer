import styles from './Pin.module.css';

// Figma node 9793:40601 — 22×27px teardrop pin shape
function PinShape({ color }: { color: string }) {
  return (
    <svg width="22" height="27" viewBox="0 0 22 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 0C17.0751 0 22 4.74898 22 10.6071C22 20.4911 11 27 11 27C11 27 0 20.0089 0 10.6071C0 4.82143 4.92487 0 11 0Z"
        fill={color}
      />
    </svg>
  );
}

interface PinProps {
  number?: number;
  color?: string;
}

export function Pin({ number = 1, color = '#3617ce' }: PinProps) {
  return (
    <div className={styles.container}>
      <PinShape color={color} />
      <span className={styles.label}>{number}</span>
    </div>
  );
}

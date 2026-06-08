import styles from './ButtonMore.module.css';

/* Figma: ButtonMore — node 9853:49214 */
interface ButtonMoreProps {
  label?: string;
  onClick?: () => void;
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      {/* left-pointing base path, rotated -90deg = down chevron */}
      <path
        transform="translate(5, 2.67) rotate(90, 3, 5.33)"
        d="M5.138 0L6 0.862 1.391 5.333 6 9.805 5.138 10.667 -0.331 5.333z"
        fill="#05001A"
      />
    </svg>
  );
}

export function ButtonMore({ label = '상품 정보 더보기', onClick }: ButtonMoreProps) {
  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={onClick}>
        <span className={styles.label}>{label}</span>
        <ChevronDownIcon />
      </button>
    </div>
  );
}

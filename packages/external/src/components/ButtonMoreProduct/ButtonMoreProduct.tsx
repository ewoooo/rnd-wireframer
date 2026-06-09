import styles from './ButtonMoreProduct.module.css';

/* Figma: ButtonMoreProduct — node 10228:40933 */
interface ButtonMoreProductProps {
  logoColor?: string;
  label?: string;
  onClick?: () => void;
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      {/* left-pointing base, rotate 180deg = right-pointing */}
      <path
        transform="translate(5, 2.67) rotate(180, 3, 5.33)"
        d="M5.138 0L6 0.862 1.391 5.333 6 9.805 5.138 10.667 -0.331 5.333z"
        fill="#05001A"
      />
    </svg>
  );
}

export function ButtonMoreProduct({
  logoColor = '#dad2ff',
  label = 'Gifticon Best 상품 더보기',
  onClick,
}: ButtonMoreProductProps) {
  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={onClick}>
        <div className={styles.info}>
          <div className={styles.logo} style={{ background: logoColor }} />
          <span className={styles.label}>{label}</span>
        </div>
        <ChevronRightIcon />
      </button>
    </div>
  );
}

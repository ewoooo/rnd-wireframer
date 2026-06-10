import styles from './Coupon.module.css';
import cuLogo from './assets/cu-logo.svg';

/* Figma: Coupon — node 9793:40301 */
interface CouponBadge {
  label: string;
  variant?: 'default' | 'brand' | 'timer';
}

interface CouponProps {
  logoColor?: string;
  subtitle?: string;
  title?: string;
  badges?: CouponBadge[];
  actionLabel?: string;
  onAction?: () => void;
}

export function Coupon({
  logoColor = '#652d8d',
  subtitle = '모든 등급(T우주 LTE 고객 제외)',
  title = 'CU 아이스크림 1+1',
  badges = [
    { label: '혜택 브랜드 할인 쿠폰', variant: 'default' },
    { label: 'D-6', variant: 'timer' },
  ],
  actionLabel = '사용',
  onAction,
}: CouponProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.left}>
        <div className={styles.topRow}>
          <div className={styles.logo} style={{ background: logoColor }}>
            <img src={cuLogo} alt="" className={styles.logoImg} />
          </div>
          <div className={styles.cardText}>
            <p className={styles.subtitle}>{subtitle}</p>
            <p className={styles.title}>{title}</p>
          </div>
        </div>
        <div className={styles.badgeRow}>
          {badges.map((b) => (
            <span
              key={b.label}
              className={[styles.badge, b.variant === 'timer' ? styles.badgeTimer : styles.badgeDefault].join(' ')}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <button className={styles.actionBtn} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

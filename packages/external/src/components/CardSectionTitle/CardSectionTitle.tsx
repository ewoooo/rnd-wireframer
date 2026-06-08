import styles from './CardSectionTitle.module.css';
import homeIcon from './assets/home-icon.png';

/* Figma: .CardSectionTitle — 313×47, HORIZONTAL gap 8 */
interface CardSectionTitleProps {
  subtitle?: string;
  title?: string;
  badge?: string;
  onClick?: () => void;
}

export function CardSectionTitle({
  subtitle = '서브타이틀',
  title = '타이틀',
  badge = 'Badge',
  onClick,
}: CardSectionTitleProps) {
  return (
    <div className={styles.container}>
      <div className={styles.leftArea}>
        <span className={styles.subtitle}>{subtitle}</span>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          <span className={styles.badge}>{badge}</span>
        </div>
      </div>
      <button className={styles.iconBtn} onClick={onClick} aria-label="홈">
        <img src={homeIcon} alt="home" width={40} height={40} />
      </button>
    </div>
  );
}

import unionSrc from './assets/union.svg';
import union1Src from './assets/union1.svg';
import dividerSrc from './assets/divider.svg';
import styles from './ButtonSection.module.css';

interface ButtonSectionProps {
  leftIcon?: string;
  leftLabel?: string;
  rightIcon?: string;
  rightLabel?: string;
}

export function ButtonSection({
  leftIcon = unionSrc,
  leftLabel = 'T 가족모아데이터',
  rightIcon = union1Src,
  rightLabel = '데이터 함께 쓰기',
}: ButtonSectionProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.menu}>
          <img src={leftIcon} alt="" className={styles.icon} />
          <span className={styles.label}>{leftLabel}</span>
        </div>
        <div className={styles.dividerWrap}>
          <img src={dividerSrc} alt="" className={styles.divider} />
        </div>
        <div className={styles.menuRight}>
          <img src={rightIcon} alt="" className={styles.icon} />
          <span className={styles.label}>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import styles from './HomeCardCarousel.module.css';

interface HomeCardCarouselProps {
  subtitle?: string;
  titleLine1?: string;
  titleLine2?: string;
  children?: ReactNode;
}

export function HomeCardCarousel({
  subtitle = '서브 타이틀',
  titleLine1 = '메인 타이틀',
  titleLine2 = '메인 타이틀',
  children,
}: HomeCardCarouselProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.titleMain}>
        <div className={styles.titleText}>
          <span className={styles.subtitle}>{subtitle}</span>
          <div className={styles.mainTitle}>
            <span className={styles.titleLine1}>{titleLine1}</span>
            <span className={styles.titleLine2}>{titleLine2}</span>
          </div>
        </div>
      </div>
      <div className={styles.slot}>{children}</div>
    </div>
  );
}

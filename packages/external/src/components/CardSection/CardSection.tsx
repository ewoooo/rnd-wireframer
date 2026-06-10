import type { ReactNode } from 'react';
import icoHomeSrc from './assets/ico-home.svg';
import icoPlusSrc from './assets/ico-plus.svg';
import movieSrc from './assets/movie.png';
import aiIconSrc from './assets/ai-icon.svg';
import styles from './CardSection.module.css';

interface CardSectionProps {
  type?: 'Medium' | 'Large';
  subtitle?: string;
  title?: string;
  badge?: string;
  itemTitle?: string;
  itemSubtext?: string;
  itemButtonText?: string;
  aiText?: string;
  buttonText?: string;
  movieSrc?: string;
  children?: ReactNode;
}

export function CardSection({
  type = 'Medium',
  subtitle = '서브타이틀',
  title = '타이틀',
  badge = 'Badge',
  itemTitle = '왕과 사는 남자',
  itemSubtext = 'VVIP CGV 1인 무료 이용',
  itemButtonText = '버튼',
  aiText = 'T 멤버십 사용 가능 포인트 65,300P',
  buttonText = '버튼',
  movieSrc: movieImgSrc = movieSrc,
}: CardSectionProps) {
  const isMedium = type === 'Medium';
  const isLarge = type === 'Large';

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {isMedium && (
          <>
            <div className={styles.titleRow}>
              <div className={styles.leftArea}>
                <span className={styles.subtitle}>{subtitle}</span>
                <div className={styles.titleWithBadge}>
                  <span className={styles.title}>{title}</span>
                  <div className={styles.badge}>
                    <span className={styles.badgeText}>{badge}</span>
                  </div>
                </div>
              </div>
              <div className={styles.iconCombo}>
                <img src={icoHomeSrc} alt="" className={styles.icoHome} />
                <img src={icoPlusSrc} alt="" className={styles.icoPlus} />
              </div>
            </div>
            <div className={styles.listItem}>
              <div className={styles.itemInfo}>
                <img src={movieImgSrc} alt="" className={styles.movieThumb} />
                <div className={styles.itemText}>
                  <span className={styles.itemTitle}>{itemTitle}</span>
                  <span className={styles.itemSubtext}>{itemSubtext}</span>
                </div>
              </div>
              <div className={styles.grayButton}>
                <span className={styles.grayButtonText}>{itemButtonText}</span>
              </div>
            </div>
          </>
        )}
        {isLarge && (
          <>
            <div className={styles.largeTitleArea}>
              <div className={styles.leftArea}>
                <span className={styles.subtitle}>{subtitle}</span>
                <span className={styles.title}>{title}</span>
              </div>
              <div className={styles.aiRow}>
                <img src={aiIconSrc} alt="" className={styles.aiIcon} />
                <span className={styles.aiText}>{aiText}</span>
              </div>
            </div>
            <div className={styles.blueButton}>
              <span className={styles.blueButtonText}>{buttonText}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

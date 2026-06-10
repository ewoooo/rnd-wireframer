import type { ReactNode } from 'react';
import defaultImg from '../ThumbnailItem/assets/thumbnail-default.png';
import styles from './CarouselProductText.module.css';

interface BadgeIconData {
  icon: ReactNode;
  label: string;
  subLabel?: string;
}

interface CarouselProductTextProps {
  subtitle?: string;
  title?: string;
  description?: string;
  logoSrc?: string;
  badges?: BadgeIconData[];
}

export function CarouselProductText({
  subtitle = '{SubTitle}',
  title,
  description,
  logoSrc,
  badges = [],
}: CarouselProductTextProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.textInfo}>
          <span className={styles.subtitle}>{subtitle}</span>
          {title && <span className={styles.title}>{title}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
        <div className={styles.logo}>
          <img src={logoSrc ?? defaultImg} alt="" className={styles.logoImg} />
        </div>
      </div>
      {badges.length > 0 && (
        <div className={styles.badgeList}>
          {badges.map((b, i) => (
            <div key={i} className={styles.badgeItem}>
              <div className={styles.badgeMain}>
                <span className={styles.badgeIcon}>{b.icon}</span>
                <span className={styles.badgeLabel}>{b.label}</span>
              </div>
              {b.subLabel && <span className={styles.badgeSubLabel}>{b.subLabel}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import styles from './ThumbnailLogoItem.module.css';

interface ThumbnailLogoItemProps {
  logo?: ReactNode;
  bgColor?: string;
}

export function ThumbnailLogoItem({ logo, bgColor = '#FF143B' }: ThumbnailLogoItemProps) {
  return (
    <div className={styles.circle} style={{ background: bgColor }}>
      {logo && <div className={styles.logo}>{logo}</div>}
    </div>
  );
}

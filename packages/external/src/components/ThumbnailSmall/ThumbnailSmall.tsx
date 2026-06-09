import type { ReactNode } from 'react';
import styles from './ThumbnailSmall.module.css';

interface ThumbnailSmallProps {
  image?: ReactNode;
  logo?: ReactNode;
  src?: string;
}

export function ThumbnailSmall({ image, logo, src }: ThumbnailSmallProps) {
  return (
    <div className={styles.container}>
      <div className={styles.imageSlot}>
        {src ? (
          <img src={src} alt="" className={styles.img} />
        ) : image ? (
          image
        ) : (
          <div className={styles.placeholder} />
        )}
      </div>
      {logo && <div className={styles.logoSlot}>{logo}</div>}
    </div>
  );
}

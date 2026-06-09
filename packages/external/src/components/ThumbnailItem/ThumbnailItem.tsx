import defaultImg from './assets/thumbnail-default.png';
import styles from './ThumbnailItem.module.css';

type ThumbnailSize = '40' | 'movie' | '64' | '160' | '182';

interface ThumbnailItemProps {
  size?: ThumbnailSize;
  src?: string;
  alt?: string;
}

const SIZE_MAP: Record<ThumbnailSize, { width: number; height: number; radius: number }> = {
  '40':    { width: 40,  height: 40,  radius: 8  },
  'movie': { width: 56,  height: 40,  radius: 10 },
  '64':    { width: 64,  height: 64,  radius: 12 },
  '160':   { width: 160, height: 100, radius: 20 },
  '182':   { width: 182, height: 120, radius: 20 },
};

export function ThumbnailItem({ size = '40', src, alt = '' }: ThumbnailItemProps) {
  const { width, height, radius } = SIZE_MAP[size];

  return (
    <div
      className={styles.thumbnail}
      style={{ width, height, borderRadius: radius }}
    >
      <img src={src ?? defaultImg} alt={alt} className={styles.image} />
    </div>
  );
}

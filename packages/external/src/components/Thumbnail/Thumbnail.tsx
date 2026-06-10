import styles from './Thumbnail.module.css';
import productImg from './assets/product.png';
import brandImg from './assets/brand.png';
import dotActiveSvg from './assets/dot-active.svg';
import dotInactiveSvg from './assets/dot-inactive.svg';
import heartSvg from './assets/heart.svg';

interface ThumbnailProps {
  type?: 'Product' | 'Brand';
  imageSrc?: string;
  // Brand props
  brandSub?: string;
  brandName?: string;
  brandDesc?: string;
  category?: string;
  likeCount?: string;
  badges?: string[];
  // Product props
  totalDots?: number;
  activeDotIndex?: number;
}

export function Thumbnail({
  type = 'Product',
  imageSrc,
  brandSub = '씨유',
  brandName = 'CU',
  brandDesc = '여러분의 일상 가장 가까운 곳에서 \n언제 어디서나 만날 수 있는 CU',
  category = 'BUY > 편의점',
  likeCount = '4,815',
  badges = ['할인', '적립', '사용'],
  totalDots = 4,
  activeDotIndex = 0,
}: ThumbnailProps) {
  const isBrand = type === 'Brand';
  const src = imageSrc ?? (isBrand ? brandImg : productImg);

  return (
    <div className={`${styles.wrap} ${isBrand ? styles.wrapBrand : styles.wrapProduct}`}>
      <img src={src} alt="" className={styles.image} />

      {!isBrand && (
        <div className={styles.indicator}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <img
              key={i}
              src={i === activeDotIndex ? dotActiveSvg : dotInactiveSvg}
              alt=""
              className={styles.dot}
            />
          ))}
        </div>
      )}

      {isBrand && (
        <div className={styles.brandInfo}>
          <div className={styles.brandNameBlock}>
            <span className={styles.brandSub}>{brandSub}</span>
            <span className={styles.brandName}>{brandName}</span>
          </div>
          <p className={styles.brandDesc}>{brandDesc}</p>
          <div className={styles.brandMetaRow}>
            <div className={styles.subTextRow}>
              <span className={styles.subText}>{category}</span>
              <div className={styles.subDivider} />
              <div className={styles.likeRow}>
                <img src={heartSvg} alt="" className={styles.heartIcon} />
                <span className={styles.likeCount}>{likeCount}</span>
              </div>
            </div>
            <div className={styles.badgeList}>
              {badges.map((b, i) => (
                <span key={i} className={styles.badge}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import defaultImg from './assets/product.png';
import styles from './ListProductVertical.module.css';

interface ListProductVerticalProps {
  imageSrc?: string;
  subTitle?: string;
  title?: string;
  originalPrice?: string;
  discountRate?: string;
  price?: string;
  priceUnit?: string;
  badges?: string[];
}

export function ListProductVertical({
  imageSrc,
  subTitle = 'TextSub',
  title = 'TextMain',
  originalPrice,
  discountRate,
  price = '999,999원',
  priceUnit = '/12개월',
  badges = [],
}: ListProductVerticalProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img src={imageSrc ?? defaultImg} alt={title} className={styles.img} />
      </div>
      <div className={styles.info}>
        <div className={styles.textInfo}>
          {subTitle && <span className={styles.subTitle}>{subTitle}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.priceSection}>
          {originalPrice && <span className={styles.originalPrice}>{originalPrice}</span>}
          <div className={styles.priceRow}>
            {discountRate && <span className={styles.discountRate}>{discountRate}</span>}
            <span className={styles.price}>{price}</span>
            {priceUnit && <span className={styles.priceUnit}>{priceUnit}</span>}
          </div>
        </div>
        {badges.length > 0 && (
          <div className={styles.badgeGroup}>
            {badges.map((b, i) => (
              <span key={i} className={styles.badge}>{b}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

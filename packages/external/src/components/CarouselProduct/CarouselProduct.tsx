import defaultImg from '../ThumbnailItem/assets/thumbnail-default.png';
import styles from './CarouselProduct.module.css';

interface CarouselProductProps {
  imageSrc?: string;
  subTitle?: string;
  title?: string;
  originalPrice?: string;
  discountRate?: string;
  price?: string;
  priceUnit?: string;
  badges?: string[];
}

export function CarouselProduct({
  imageSrc,
  subTitle = 'TextSub',
  title = 'TextMain',
  originalPrice = '999,999원',
  discountRate = '7%',
  price = '999,999원',
  priceUnit = '/12개월',
  badges = ['Badge', 'Badge'],
}: CarouselProductProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img src={imageSrc ?? defaultImg} alt={title} className={styles.img} />
      </div>
      <div className={styles.info}>
        <div className={styles.textInfo}>
          <span className={styles.subTitle}>{subTitle}</span>
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.priceSection}>
          <span className={styles.originalPrice}>{originalPrice}</span>
          <div className={styles.priceRow}>
            <span className={styles.discountRate}>{discountRate}</span>
            <span className={styles.price}>{price}</span>
            <span className={styles.priceUnit}>{priceUnit}</span>
          </div>
        </div>
        <div className={styles.badgeGroup}>
          {badges.map((b, i) => (
            <span key={i} className={styles.badge}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

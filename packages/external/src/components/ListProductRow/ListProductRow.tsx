import defaultImg from '../ThumbnailItem/assets/thumbnail-default.png';
import styles from './ListProductRow.module.css';

interface ProductData {
  imageSrc?: string;
  subTitle?: string;
  title?: string;
  originalPrice?: string;
  discountRate?: string;
  price?: string;
  priceUnit?: string;
  badges?: string[];
}

interface ListProductRowProps {
  left?: ProductData;
  right?: ProductData;
}

function ProductCard({ data }: { data: ProductData }) {
  const { imageSrc, subTitle = 'TextSub', title = 'TextMain', originalPrice, discountRate, price = '999,999원', priceUnit = '/월', badges = [] } = data;
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

export function ListProductRow({ left = {}, right = {} }: ListProductRowProps) {
  return (
    <div className={styles.row}>
      <ProductCard data={left} />
      <ProductCard data={right} />
    </div>
  );
}

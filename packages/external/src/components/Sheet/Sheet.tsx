import styles from './Sheet.module.css';
import logoImg from './assets/logo.png';
import plusSvg from './assets/plus.svg';

interface SheetProps {
  logoSrc?: string;
  productName?: string;
  price?: string;
  priceUnit?: string;
  priceNote?: string;
}

export function Sheet({
  logoSrc = logoImg,
  productName = 'iPhone 17 Pro 코스믹 오렌지 512G',
  price = '129,797원',
  priceUnit = '/월',
  priceNote = '(부가세, 할부수수료 포함)',
}: SheetProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.leftItem}>
        <div className={styles.thumbnail}>
          <img src={logoSrc} alt={productName} className={styles.thumbnailImg} />
        </div>
        <div className={styles.textBlock}>
          <span className={styles.productName}>{productName}</span>
          <div className={styles.priceRow}>
            <div className={styles.priceGroup}>
              <span className={styles.price}>{price}</span>
              <span className={styles.priceUnit}>{priceUnit}</span>
            </div>
            <span className={styles.priceNote}>{priceNote}</span>
          </div>
        </div>
      </div>
      <div className={styles.rightItem}>
        <img src={plusSvg} alt="추가" className={styles.plusIcon} />
      </div>
    </div>
  );
}

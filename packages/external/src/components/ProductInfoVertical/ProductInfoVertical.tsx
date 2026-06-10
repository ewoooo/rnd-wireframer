import styles from './ProductInfoVertical.module.css';

/* Figma: .ProductInfoVertical — 182×136, padding l20,r20,t12,b20, VERTICAL gap 8 */
interface ProductInfoVerticalProps {
  textSub?: string;
  textMain?: string;
  originalPrice?: string;
  discountRate?: string;
  price?: string;
  priceSuffix?: string;
}

export function ProductInfoVertical({
  textSub = 'TextSub',
  textMain = 'TextMain',
  originalPrice = '999,999원',
  discountRate = '7%',
  price = '999,999원',
  priceSuffix = '/12개월',
}: ProductInfoVerticalProps) {
  return (
    <div className={styles.container}>
      <span className={styles.textSub}>{textSub}</span>
      <span className={styles.textMain}>{textMain}</span>
      <span className={styles.originalPrice}>{originalPrice}</span>
      <div className={styles.priceRow}>
        <span className={styles.discountRate}>{discountRate}</span>
        <span className={styles.price}>{price}</span>
        <span className={styles.priceSuffix}>{priceSuffix}</span>
      </div>
    </div>
  );
}

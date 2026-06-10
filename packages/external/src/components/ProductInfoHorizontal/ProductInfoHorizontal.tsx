import styles from './ProductInfoHorizontal.module.css';

/* Figma: .ProductInfoHorizontal — 274×88, VERTICAL gap 12 */
interface ProductInfoHorizontalProps {
  subtitle?: string;
  mainText?: string;
  subText?: string;
  discountLabel?: string;
  discountAmount?: string;
}

export function ProductInfoHorizontal({
  subtitle = '서브타이틀',
  mainText = '메인 텍스트',
  subText = '서브 텍스트',
  discountLabel = '최대할인',
  discountAmount = '- 999,999원',
}: ProductInfoHorizontalProps) {
  return (
    <div className={styles.container}>
      <span className={styles.subtitle}>{subtitle}</span>
      <span className={styles.mainText}>{mainText}</span>
      <span className={styles.subText}>{subText}</span>
      <div className={styles.discountRow}>
        <span className={styles.discountLabel}>{discountLabel}</span>
        <span className={styles.discountAmount}>{discountAmount}</span>
      </div>
    </div>
  );
}

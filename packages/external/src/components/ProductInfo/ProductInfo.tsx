import styles from './ProductInfo.module.css';
import arrowDownSvg from './assets/arrow-down.svg';

interface ProductInfoProps {
  subtitle?: string;
  productName?: string;
  originalPrice?: string;
  discountPercent?: string;
  price?: string;
  priceUnit?: string;
  badgeText?: string;
  buttonText?: string;
  usageLabel?: string;
  usageValue?: string;
  showBadge?: boolean;
  showButton?: boolean;
  showDiscountPercentage?: boolean;
  showOriginalPrice?: boolean;
  showUsage?: boolean;
}

export function ProductInfo({
  subtitle = 'T 우주패스 TVING & Wavve 프리미엄',
  productName = 'TVING 프리미엄, Wavve 콘텐츠 팩 프리미엄',
  originalPrice = '30,000원',
  discountPercent = '42%',
  price = '17,900원',
  priceUnit = '/1개월',
  badgeText = 'NEW',
  buttonText = '쿠폰 받기',
  usageLabel = '사용처',
  usageValue = '이마트 매장교환',
  showBadge = true,
  showButton = true,
  showDiscountPercentage = true,
  showOriginalPrice = true,
  showUsage = true,
}: ProductInfoProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.textProduct}>
        <span className={styles.subtitle}>{subtitle}</span>
        <p className={styles.productName}>{productName}</p>
      </div>

      <div className={styles.spacing12} />

      <div className={styles.priceRow}>
        <div className={styles.priceLeft}>
          <div className={styles.textPrice}>
            {showOriginalPrice && (
              <span className={styles.originalPrice}>{originalPrice}</span>
            )}
            <div className={styles.currentPriceRow}>
              {showDiscountPercentage && (
                <span className={styles.discountPercent}>{discountPercent}</span>
              )}
              <span className={styles.currentPrice}>{price}</span>
              <span className={styles.priceUnit}>{priceUnit}</span>
            </div>
          </div>
          {showBadge && (
            <div className={styles.badgeList}>
              <span className={styles.badge}>{badgeText}</span>
            </div>
          )}
        </div>

        {showButton && (
          <button className={styles.couponBtn}>
            <span className={styles.couponBtnText}>{buttonText}</span>
            <img src={arrowDownSvg} alt="" className={styles.couponBtnIcon} />
          </button>
        )}
      </div>

      <div className={styles.spacing12} />

      {showUsage && (
        <div className={styles.usageRow}>
          <span className={styles.usageText}>{usageLabel}</span>
          <div className={styles.usageDivider} />
          <span className={styles.usageText}>{usageValue}</span>
        </div>
      )}
    </div>
  );
}

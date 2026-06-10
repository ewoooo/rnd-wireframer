import styles from './PayProductListItem.module.css';
import { ButtonCloseItem } from '../ButtonCloseItem/ButtonCloseItem';
import thumbnailLogo from './assets/thumbnail-logo.png';

/* Figma: PayProductListItem — node 10312:50173
   type=Pay  : 결제 상품 (옵션 박스 + 변경 링크)
   type=Cart : 장바구니 상품 (X버튼 + 가격 박스 + 변경 링크)
*/

interface BoxOption {
  coupon?: string;
  requestLabel?: string;
  requestValue?: string;
  deliveryLabel?: string;
  deliveryValue?: string;
}

interface PriceRow {
  label: string;
  discountRate?: string;
  originalPrice?: string;
  price: string;
  isPrimary?: boolean;
}

interface PayProductListItemProps {
  type?: 'Pay' | 'Cart';
  brand?: string;
  productName?: string;
  thumbnailSrc?: string;
  showBox?: boolean;
  showChangeLink?: boolean;
  boxOption?: BoxOption;
  priceRows?: PriceRow[];
  totalLabel?: string;
  totalPeriod?: string;
  totalPrice?: string;
  onClose?: () => void;
  onChangeClick?: () => void;
}

export function PayProductListItem({
  type = 'Pay',
  brand = '티빙',
  productName = '티빙 광고형 스탠다드 이용권',
  thumbnailSrc = thumbnailLogo,
  showBox = true,
  showChangeLink = true,
  boxOption = {
    coupon: '배달의민족 5,000원 쿠폰 + 배민 3,000원 쿠폰',
    requestLabel: '추가 요청 사항',
    requestValue: '맛있게 드시길 바랍니다.',
    deliveryLabel: '첫 배송 희망일',
    deliveryValue: '2023. 05. 23',
  },
  priceRows = [
    { label: '첫 구독 할인가', discountRate: '50%', originalPrice: '10,000원', price: '5,000원' },
    { label: '첫 구독 할인가', price: '5,000원' },
  ],
  totalLabel = '이용 금액',
  totalPeriod = '1개월 /',
  totalPrice = '48,000원',
  onClose,
  onChangeClick,
}: PayProductListItemProps) {
  const isPay = type === 'Pay';
  const isCart = type === 'Cart';

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.thumbnail}>
          <img src={thumbnailSrc} alt={brand} className={styles.thumbnailImg} />
        </div>
        <div className={styles.textArea}>
          <p className={styles.brand}>{brand}</p>
          <p className={styles.productName}>{productName}</p>
          {isPay && showBox && (
            <div className={styles.boxOption}>
              {boxOption.coupon && <p className={styles.optionCoupon}>{boxOption.coupon}</p>}
              {boxOption.requestLabel && (
                <div className={styles.optionRow}>
                  <span className={styles.optionLabel}>{boxOption.requestLabel}</span>
                  <div className={styles.optionRowDivider} />
                  <span className={styles.optionValue}>{boxOption.requestValue}</span>
                </div>
              )}
              {boxOption.deliveryLabel && (
                <div className={styles.optionRow}>
                  <span className={styles.optionLabel}>{boxOption.deliveryLabel}</span>
                  <div className={styles.optionRowDivider} />
                  <span className={styles.optionValue}>{boxOption.deliveryValue}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {isCart && (
          <ButtonCloseItem onClick={onClose} aria-label="삭제" />
        )}
      </div>

      {isCart && showBox && (
        <div className={styles.boxPrice}>
          <div className={styles.priceRows}>
            {priceRows.map((row, i) => (
              <div key={i} className={styles.priceRow}>
                <span className={styles.priceRowLabel}>{row.label}</span>
                <div className={styles.priceRowRight}>
                  {row.discountRate && <span className={styles.discountRate}>{row.discountRate}</span>}
                  {row.originalPrice && <span className={styles.originalPrice}>{row.originalPrice}</span>}
                  <span className={styles.price}>{row.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.priceDivider} />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>{totalLabel}</span>
            <div className={styles.totalRight}>
              <span className={styles.totalPeriod}>{totalPeriod}</span>
              <span className={styles.totalPrice}>{totalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {showChangeLink && (
        <button className={styles.changeLink} onClick={onChangeClick}>
          상품/옵션 변경하기
        </button>
      )}
    </div>
  );
}

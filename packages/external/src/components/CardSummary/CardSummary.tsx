import iconPointSrc from './assets/icon-point.svg';
import iconDiscountSrc from './assets/icon-discount.svg';
import iconPaymentSrc from './assets/icon-payment.svg';
import iconEventSrc from './assets/icon-event.svg';
import styles from './CardSummary.module.css';

interface CardSummaryProps {
  type?: 'Text' | 'Text+RightItem' | 'Button';
  subText?: string;
  mainText?: string;
  row1Title?: string;
  row1Info?: string;
  row2Title?: string;
  row2Info?: string;
  buttonText?: string;
}

export function CardSummary({
  type = 'Text+RightItem',
  subText = 'SubText',
  mainText = 'MainText',
  row1Title = 'TitleText',
  row1Info = 'InfoText',
  row2Title = 'TitleText',
  row2Info = 'InfoText',
  buttonText = '버튼',
}: CardSummaryProps) {
  const isButton = type === 'Button';
  const showRightButton = type === 'Text+RightItem';

  return (
    <div className={styles.wrap}>
      {!isButton && (
        <>
          <div className={styles.titleRow}>
            <div className={styles.textBlock}>
              <span className={styles.subText}>{subText}</span>
              <span className={styles.mainText}>{mainText}</span>
            </div>
            {showRightButton && (
              <div className={styles.rightButton}>
                <span className={styles.rightButtonText}>{buttonText}</span>
              </div>
            )}
          </div>
          <div className={styles.list}>
            <div className={styles.listRow}>
              <span className={styles.listTitle}>{row1Title}</span>
              <span className={styles.listInfo}>{row1Info}</span>
            </div>
            <div className={styles.listRow}>
              <span className={styles.listTitle}>{row2Title}</span>
              <span className={styles.listInfo}>{row2Info}</span>
            </div>
          </div>
        </>
      )}
      {isButton && (
        <div className={styles.buttonGrid}>
          <div className={styles.gridItem}>
            <img src={iconPointSrc} alt="" className={styles.gridIcon} />
            <span className={styles.gridLabel}>포인트 내역</span>
          </div>
          <div className={styles.gridItem}>
            <img src={iconDiscountSrc} alt="" className={styles.gridIcon} />
            <span className={styles.gridLabel}>할인 내역</span>
          </div>
          <div className={styles.gridItem}>
            <img src={iconPaymentSrc} alt="" className={styles.gridIcon} />
            <span className={styles.gridLabel}>결제 내역</span>
          </div>
          <div className={styles.gridItem}>
            <img src={iconEventSrc} alt="" className={styles.gridIcon} />
            <span className={styles.gridLabel}>참여 이벤트</span>
          </div>
        </div>
      )}
    </div>
  );
}

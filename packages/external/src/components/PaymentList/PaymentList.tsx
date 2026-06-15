import styles from './PaymentList.module.css';
import radioIcon from './assets/radio.svg';
import chevronRightIcon from './assets/chevron-right.svg';
import elevenPayLogo from '../PaymentLogoItem/assets/11pay-logo.png';

/* Figma: PaymentList — node 9738:71657 */
interface PaymentListProps {
  label?: string;
  badge?: string;
  showLogo?: boolean;
  showCard?: boolean;
  cardTitle?: string;
  cardTitleHighlight?: string;
  cardSubText?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function PaymentList({
  label = '카드/계좌 간편결제',
  badge = '최근 결제',
  showLogo = true,
  showCard = true,
  cardTitle = '로 쉽고 빠르게',
  cardTitleHighlight = '11Pay',
  cardSubText = '이용을 위해 약관 동의를 진행해 주세요',
  selected = false,
  onClick,
}: PaymentListProps) {
  return (
    <div className={styles.wrap} onClick={onClick}>
      <div className={styles.radio}>
        <img src={radioIcon} alt="" width={18} height={18} />
      </div>
      <div className={styles.content}>
        <div className={styles.logoText}>
          <div className={styles.logoTextInner}>
            {showLogo && (
              <div className={styles.logoCircle}>
                <img src={elevenPayLogo} alt="11pay" width={16} height={16} className={styles.logoImg} />
              </div>
            )}
            <span className={styles.label}>{label}</span>
          </div>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
        {showCard && (
          <div className={styles.card}>
            <div className={styles.cardTexts}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleHighlight}>{cardTitleHighlight}</span>
                <span className={styles.cardTitleNormal}>{cardTitle}</span>
              </div>
              <p className={styles.cardSubText}>{cardSubText}</p>
            </div>
            <img src={chevronRightIcon} alt="" width={16} height={16} className={styles.chevron} />
          </div>
        )}
      </div>
    </div>
  );
}

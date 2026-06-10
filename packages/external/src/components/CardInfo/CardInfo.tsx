import styles from './CardInfo.module.css';
import sevenElevenLogo from './assets/seven-eleven-logo.png';
import pinShape from './assets/pin-shape.svg';

/* Figma: CardInfo — node 9793:62316
   type=Brand: 브랜드 카드 (로고 + 텍스트 + 배지)
   type=Place: 장소 카드 (핀 번호 + 텍스트 + 버튼)
*/

interface CardBadge {
  label: string;
}

interface CardInfoBrandProps {
  type: 'Brand';
  logoColor?: string;
  logoSrc?: string;
  subtitle?: string;
  title?: string;
  badges?: CardBadge[];
}

interface CardInfoPlaceProps {
  type: 'Place';
  pinNumber?: number;
  distance?: string;
  placeName?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type CardInfoProps = CardInfoBrandProps | CardInfoPlaceProps;

export function CardInfo(props: CardInfoProps) {
  if (props.type === 'Brand') {
    const {
      logoColor = '#016a41',
      logoSrc = sevenElevenLogo,
      subtitle = '편의점',
      title = '세븐일레븐',
      badges = [{ label: '할인' }, { label: '적립' }, { label: '사용' }],
    } = props as CardInfoBrandProps;

    return (
      <div className={styles.brandWrap}>
        <div className={styles.brandCardText}>
          <div className={styles.textGroup}>
            <p className={styles.subtitle}>{subtitle}</p>
            <p className={styles.title}>{title}</p>
          </div>
          <div className={styles.badgeRow}>
            {badges.map((b) => (
              <span key={b.label} className={styles.badge}>{b.label}</span>
            ))}
          </div>
        </div>
        <div className={styles.brandLogo} style={{ background: logoColor }}>
          <img src={logoSrc} alt={title} className={styles.brandLogoImg} />
        </div>
      </div>
    );
  }

  const {
    pinNumber = 1,
    distance = '47m',
    placeName = '논현럭키점',
    actionLabel = '전화',
    onAction,
  } = props as CardInfoPlaceProps;

  return (
    <div className={styles.placeWrap}>
      <div className={styles.placeLeft}>
        <div className={styles.pin}>
          <img src={pinShape} alt="" className={styles.pinShape} />
          <span className={styles.pinNumber}>{pinNumber}</span>
        </div>
        <div className={styles.cardText}>
          <p className={styles.subtitle}>{distance}</p>
          <p className={styles.title}>{placeName}</p>
        </div>
      </div>
      <button className={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
    </div>
  );
}

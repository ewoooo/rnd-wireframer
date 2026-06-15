import styles from './PaymentLogoItem.module.css';
import kakaoPayImg from './assets/kakaopay-logo.png';
import naverPayImg from './assets/naverpay-logo.png';

type PaymentType = '11pay' | 'kakaopay' | 'naverpay';
type ImageSource = string | { src: string };

interface PaymentLogoItemProps {
  type: PaymentType;
}

const LOGO_CONFIG: Record<PaymentType, { circleClass: string; imgSrc?: ImageSource; imgStyle?: React.CSSProperties; text?: string }> = {
  '11pay':    { circleClass: 'elevenPay',  text: '11' },
  'kakaopay': { circleClass: 'kakaoPay',   imgSrc: kakaoPayImg,   imgStyle: { width: 16, height: 16 } },
  'naverpay': { circleClass: 'naverPay',   imgSrc: naverPayImg,   imgStyle: { width: 16, height: 5.5 } },
};

export function PaymentLogoItem({ type }: PaymentLogoItemProps) {
  const { circleClass, imgSrc, imgStyle, text } = LOGO_CONFIG[type];
  const resolvedImgSrc = typeof imgSrc === 'string' ? imgSrc : imgSrc?.src;

  return (
    <div className={`${styles.circle} ${styles[circleClass]}`}>
      {resolvedImgSrc ? (
        <img src={resolvedImgSrc} alt={type} style={imgStyle} />
      ) : (
        <span className={styles.logoText}>{text}</span>
      )}
    </div>
  );
}

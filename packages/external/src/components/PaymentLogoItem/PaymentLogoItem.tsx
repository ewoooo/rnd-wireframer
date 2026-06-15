import styles from './PaymentLogoItem.module.css';
import elevenPayImg from './assets/11pay-logo.png';
import kakaoPayImg from './assets/kakaopay-logo.png';
import naverPayImg from './assets/naverpay-logo.png';

type PaymentType = '11pay' | 'kakaopay' | 'naverpay';

interface PaymentLogoItemProps {
  type: PaymentType;
}

const LOGO_CONFIG: Record<PaymentType, { circleClass: string; imgSrc: string; imgStyle: React.CSSProperties }> = {
  '11pay':    { circleClass: 'elevenPay',  imgSrc: elevenPayImg,  imgStyle: { width: 16, height: 16 } },
  'kakaopay': { circleClass: 'kakaoPay',   imgSrc: kakaoPayImg,   imgStyle: { width: 16, height: 16 } },
  'naverpay': { circleClass: 'naverPay',   imgSrc: naverPayImg,   imgStyle: { width: 16, height: 5.5 } },
};

export function PaymentLogoItem({ type }: PaymentLogoItemProps) {
  const { circleClass, imgSrc, imgStyle } = LOGO_CONFIG[type];
  return (
    <div className={`${styles.circle} ${styles[circleClass]}`}>
      <img src={imgSrc} alt={type} style={imgStyle} />
    </div>
  );
}

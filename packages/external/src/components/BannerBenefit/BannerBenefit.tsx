import styles from './BannerBenefit.module.css';
import cardMask from './assets/card-mask.svg';
import cardContent from './assets/card-content.png';

interface BannerBenefitProps {
  text?: string;
}

export function BannerBenefit({
  text = '최대 50% 적립 T 멤버십 라이프 신한카드',
}: BannerBenefitProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.text}>{text}</p>
      <div className={styles.imgFrame}>
        <div className={styles.imgRotate}>
          <div
            className={styles.imgMasked}
            style={{ maskImage: `url(${cardMask})`, WebkitMaskImage: `url(${cardMask})` }}
          >
            <img src={cardContent} alt="" className={styles.cardImg} />
          </div>
        </div>
      </div>
    </div>
  );
}

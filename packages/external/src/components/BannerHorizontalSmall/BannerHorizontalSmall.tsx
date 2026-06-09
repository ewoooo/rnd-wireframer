import styles from './BannerHorizontalSmall.module.css';
import { Indicator } from '../Indicator/Indicator';
import bannerBg from './assets/banner-bg.png';

interface BannerHorizontalSmallProps {
  title?: string;
  subtitle?: string;
  showIndicator?: boolean;
  totalCount?: number;
  activeIndex?: number;
}

export function BannerHorizontalSmall({
  title = 'T우주 x 신한카드 결제 혜택',
  subtitle = '우주패스 all, mini 무료 구독',
  showIndicator = true,
  totalCount = 3,
  activeIndex = 0,
}: BannerHorizontalSmallProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <img src={bannerBg} alt="" className={styles.bgImg} />
        <div className={styles.textArea}>
          <p className={styles.title}>{title}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {showIndicator && (
        <Indicator count={totalCount} activeIndex={activeIndex} />
      )}
    </div>
  );
}

import styles from './BannerHorizontalMedium.module.css';
import { Indicator } from '../Indicator/Indicator';
import bannerBg from './assets/banner-bg.png';

interface BannerHorizontalMediumProps {
  title?: string;
  subtitle?: string;
  showSubtitle?: boolean;
  showIndicator?: boolean;
  totalCount?: number;
  activeIndex?: number;
}

export function BannerHorizontalMedium({
  title = '신혼부부 프랜차이즈 무조건 할인',
  subtitle = '기다림은 짧게, 혜택은 특별하게',
  showSubtitle = true,
  showIndicator = true,
  totalCount = 6,
  activeIndex = 0,
}: BannerHorizontalMediumProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <img src={bannerBg} alt="" className={styles.bgImg} />
        <div className={styles.textArea}>
          <p className={styles.title}>{title}</p>
          {showSubtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>
      </div>
      {showIndicator && (
        <Indicator count={totalCount} activeIndex={activeIndex} />
      )}
    </div>
  );
}

import styles from './ListProductHorizontal.module.css';
import thumbImg from './assets/thumb.png';
import icon1Svg from './assets/icon1.svg';
import rectSvg from './assets/rect.svg';
import icon3Svg from './assets/icon3.svg';

interface IconBadgeItem {
  iconSrc: string;
  text: string;
}

interface ListProductHorizontalProps {
  category?: string;
  name?: string;
  description?: string;
  thumbSrc?: string;
  showThumb?: boolean;
  showBadges?: boolean;
  badges?: string[];
  showIconBadges?: boolean;
  iconBadges?: IconBadgeItem[];
}

const DEFAULT_BADGES = ['스마트폰', '일반', '안심/보험', '유료', '일반'];

const DEFAULT_ICON_BADGES: IconBadgeItem[] = [
  { iconSrc: icon1Svg, text: '{Text}' },
  { iconSrc: rectSvg, text: '{Text}' },
  { iconSrc: icon3Svg, text: '{Text}' },
  { iconSrc: rectSvg, text: '{Text}' },
  { iconSrc: rectSvg, text: '{Text}' },
];

export function ListProductHorizontal({
  category = '카페/아이스크림',
  name = '베스킨라빈스',
  description = '할인 ∙ 적립 ∙ 사용',
  thumbSrc = thumbImg,
  showThumb = true,
  showBadges = true,
  badges = DEFAULT_BADGES,
  showIconBadges = true,
  iconBadges = DEFAULT_ICON_BADGES,
}: ListProductHorizontalProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.infoArea}>
        <div className={styles.infoMain}>
          <div className={styles.textBlock}>
            <span className={styles.category}>{category}</span>
            <div className={styles.nameBlock}>
              <span className={styles.name}>{name}</span>
              <span className={styles.desc}>{description}</span>
            </div>
          </div>
          {showThumb && (
            <div className={styles.thumbWrap}>
              <img src={thumbSrc} alt={name} className={styles.thumb} />
            </div>
          )}
        </div>

        {(showBadges || showIconBadges) && (
          <div className={styles.infoSub}>
            {showBadges && (
              <div className={styles.textBadgeList}>
                {badges.map((label, i) => (
                  <span key={i} className={styles.textBadge}>{label}</span>
                ))}
              </div>
            )}
            {showIconBadges && (
              <div className={styles.iconBadgeList}>
                {iconBadges.map((item, i) => (
                  <div key={i} className={styles.iconBadge}>
                    <img src={item.iconSrc} alt="" className={styles.iconBadgeIcon} />
                    <span className={styles.iconBadgeText}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

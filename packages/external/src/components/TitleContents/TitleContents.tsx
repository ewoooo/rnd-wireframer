import styles from './TitleContents.module.css';
import chevronUp from './assets/chevron-up.svg';

/* Figma: TitleContents — node 10009:151423, 329px */
interface TitleContentsProps {
  title?: string;
  showButton?: boolean;
  onButtonClick?: () => void;
}

export function TitleContents({
  title = '타이틀',
  showButton = true,
  onButtonClick,
}: TitleContentsProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{title}</p>
      {showButton && (
        <button className={styles.btn} onClick={onButtonClick} aria-label="접기/펼치기">
          <img src={chevronUp} alt="" width={16} height={16} />
        </button>
      )}
    </div>
  );
}

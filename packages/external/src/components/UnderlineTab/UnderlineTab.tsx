import styles from './UnderlineTab.module.css';

/* Figma: UnderlineTab — node 9596:37541, 393×60px, 2탭 균등폭, 검정 액티브 */
interface UnderlineTabProps {
  items?: string[];
  activeIndex?: number;
  onChange?: (index: number) => void;
}

export function UnderlineTab({
  items = ['상품 정보', '사용 방법'],
  activeIndex = 0,
  onChange,
}: UnderlineTabProps) {
  return (
    <div className={styles.tab} role="tablist">
      {items.map((label, i) => (
        <button
          key={label}
          role="tab"
          aria-selected={i === activeIndex}
          className={[styles.tabItem, i === activeIndex ? styles.active : styles.inactive].join(' ')}
          onClick={() => onChange?.(i)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

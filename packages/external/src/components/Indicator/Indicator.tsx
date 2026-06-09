import styles from './Indicator.module.css';

interface IndicatorProps {
  count?: number;
  activeIndex?: number;
}

export function Indicator({ count = 6, activeIndex = 0 }: IndicatorProps) {
  return (
    <div className={styles.indicator}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${styles.dot} ${i === activeIndex ? styles.active : ''}`}
        />
      ))}
    </div>
  );
}

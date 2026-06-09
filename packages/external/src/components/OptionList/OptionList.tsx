import styles from './OptionList.module.css';

/* Figma: OptionList — node 10312:49816 */

interface ColorOption {
  label: string;
  subText?: string;
}

interface VolumeOption {
  value: string;
  unit: string;
  badge?: string;
  price: string;
}

interface OptionListColorProps {
  type: 'color';
  options: ColorOption[];
  activeIndex?: number;
  onChange?: (index: number) => void;
}

interface OptionListVolumeProps {
  type: 'volume';
  options: VolumeOption[];
  activeIndex?: number;
  onChange?: (index: number) => void;
}

type OptionListProps = OptionListColorProps | OptionListVolumeProps;

export function OptionList(props: OptionListProps) {
  const { type, options, activeIndex = 0, onChange } = props;

  if (type === 'color') {
    return (
      <div className={styles.colorList}>
        {(options as ColorOption[]).map((opt, i) => (
          <button
            key={opt.label}
            className={[styles.colorItem, i === activeIndex ? styles.selected : styles.unselected].join(' ')}
            onClick={() => onChange?.(i)}
          >
            <div className={styles.colorChip} />
            <span className={styles.colorLabel}>{opt.label}</span>
            {opt.subText && <span className={styles.subText}>{opt.subText}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.volumeList}>
      {(options as VolumeOption[]).map((opt, i) => (
        <button
          key={opt.value + opt.unit}
          className={[styles.volumeItem, i === activeIndex ? styles.selected : styles.unselected].join(' ')}
          onClick={() => onChange?.(i)}
        >
          <div className={styles.capacityGroup}>
            <div className={styles.capacityText}>
              <span className={styles.volumeValue}>{opt.value}</span>
              <span className={styles.volumeUnit}>{opt.unit}</span>
            </div>
            {opt.badge && <span className={styles.badge}>{opt.badge}</span>}
          </div>
          <span className={styles.price}>{opt.price}</span>
        </button>
      ))}
    </div>
  );
}

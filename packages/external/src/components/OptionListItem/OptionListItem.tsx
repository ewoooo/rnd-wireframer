import styles from './OptionListItem.module.css';
import colorChip from './assets/color-chip.svg';

/* Figma: OptionListItem — node 9793:35469
   type=Module: 색상 선택 카드 (162×100px)
   type=List:   용량 선택 행 (329px)
*/

interface OptionListItemModuleProps {
  type: 'Module';
  label: string;
  subText?: string;
  showColorChip?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

interface OptionListItemListProps {
  type: 'List';
  value: string;
  unit: string;
  badge?: string;
  price: string;
  selected?: boolean;
  onClick?: () => void;
}

type OptionListItemProps = OptionListItemModuleProps | OptionListItemListProps;

export function OptionListItem(props: OptionListItemProps) {
  const { type, selected = false, onClick } = props;
  const stateClass = selected ? styles.selected : styles.unselected;

  if (type === 'Module') {
    const { label, subText, showColorChip = true } = props as OptionListItemModuleProps;
    return (
      <button className={[styles.moduleItem, stateClass].join(' ')} onClick={onClick}>
        {showColorChip && <img src={colorChip} alt="" width={22} height={22} className={styles.chip} />}
        <span className={styles.moduleLabel}>{label}</span>
        {subText && <span className={styles.subText}>{subText}</span>}
      </button>
    );
  }

  const { value, unit, badge, price } = props as OptionListItemListProps;
  return (
    <button className={[styles.listItem, stateClass].join(' ')} onClick={onClick}>
      <div className={styles.capacityGroup}>
        <div className={styles.capacityText}>
          <span className={styles.value}>{value}</span>
          <span className={styles.unit}>{unit}</span>
        </div>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <span className={styles.price}>{price}</span>
    </button>
  );
}

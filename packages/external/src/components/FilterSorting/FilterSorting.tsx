import styles from './FilterSorting.module.css';
import sortArrow from './assets/sort-arrow.svg';
import filterIcon from './assets/filter-icon.svg';

/* Figma: FilterSorting — node 9638:92802, 393×52px */
interface FilterSortingProps {
  totalCount?: number;
  sortLabel?: string;
  showDivider?: boolean;
  onSortClick?: () => void;
  onFilterClick?: () => void;
}

export function FilterSorting({
  totalCount = 256,
  sortLabel = '인기순',
  showDivider = true,
  onSortClick,
  onFilterClick,
}: FilterSortingProps) {
  return (
    <div className={styles.wrap}>
      {showDivider && <div className={styles.topDivider} />}
      <div className={styles.inner}>
        <span className={styles.total}>
          전체<span>{totalCount}</span>개
        </span>
        <div className={styles.btnGroup}>
          <button className={styles.sortBtn} onClick={onSortClick}>
            <span className={styles.btnLabel}>{sortLabel}</span>
            <span className={styles.iconWrap}>
              <img src={sortArrow} alt="" className={styles.sortArrow} />
            </span>
          </button>
          <div className={styles.divider} />
          <button className={styles.filterBtn} onClick={onFilterClick}>
            <span className={styles.btnLabel}>필터</span>
            <span className={styles.iconWrap}>
              <img src={filterIcon} alt="" className={styles.filterIconImg} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

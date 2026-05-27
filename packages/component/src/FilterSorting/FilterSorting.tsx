import styles from "./FilterSorting.module.css";

interface FilterSortingProps {
	countLabel?: string;
	filterLabel?: string;
	sortLabel?: string;
	showFilter?: boolean;
	showSort?: boolean;
	activeFilterCount?: number;
}

export function FilterSorting({
	countLabel = "전체 0개",
	filterLabel = "필터",
	sortLabel = "추천순",
	showFilter = true,
	showSort = true,
	activeFilterCount = 0,
}: FilterSortingProps) {
	return (
		<div className={styles.filterSorting} data-cx-component="FilterSorting">
			<span className={styles.count}>{countLabel}</span>
			<div className={styles.actions}>
				{showFilter ? (
					<button type="button" className={styles.actionButton}>
						<span className={styles.filterIcon} aria-hidden="true" />
						<span>{filterLabel}</span>
						{activeFilterCount > 0 ? (
							<span className={styles.badge}>{activeFilterCount}</span>
						) : null}
					</button>
				) : null}
				{showSort ? (
					<button type="button" className={styles.actionButton}>
						<span>{sortLabel}</span>
						<span className={styles.chevron} aria-hidden="true" />
					</button>
				) : null}
			</div>
		</div>
	);
}

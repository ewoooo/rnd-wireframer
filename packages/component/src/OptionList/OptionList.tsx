import { OptionCard } from "../OptionCard";
import styles from "./OptionList.module.css";

export interface OptionListItem {
	id?: string;
	title?: string;
	description?: string;
	value?: string;
	selected?: boolean;
	disabled?: boolean;
}

interface OptionListProps {
	title?: string;
	description?: string;
	items?: OptionListItem[];
	columns?: 1 | 2 | "1" | "2";
	selectedId?: string;
}

const DEFAULT_ITEMS: OptionListItem[] = [
	{ id: "option-1", title: "색상", value: "블랙", selected: true },
	{ id: "option-2", title: "용량", value: "256GB" },
];

export function OptionList({
	title,
	description,
	items = DEFAULT_ITEMS,
	columns = 2,
	selectedId,
}: OptionListProps) {
	const safeItems = items.length > 0 ? items : DEFAULT_ITEMS;

	return (
		<section className={styles.optionList} data-cx-component="OptionList">
			{title || description ? (
				<header className={styles.header}>
					{title ? <h3 className={styles.title}>{title}</h3> : null}
					{description ? <p className={styles.description}>{description}</p> : null}
				</header>
			) : null}
			<div className={String(columns) === "1" ? styles.list : styles.grid}>
				{safeItems.map((item, index) => {
					const id = item.id ?? `option-${index}`;
					return (
						<OptionCard
							key={id}
							title={item.title}
							description={item.description}
							value={item.value}
							selected={selectedId !== undefined ? selectedId === id : item.selected}
							disabled={item.disabled}
						/>
					);
				})}
			</div>
		</section>
	);
}

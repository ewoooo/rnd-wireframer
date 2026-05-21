import styles from "./Tab.module.css";

export interface TabItem {
	key: string;
	label: string;
}

interface TabProps {
	items: TabItem[];
	activeKey: string;
	onChange: (key: string) => void;
}

export function Tab({ items, activeKey, onChange }: TabProps) {
	return (
		<div className={styles.tab} role="tablist">
			{items.map((item) => (
				<button
					type="button"
					key={item.key}
					role="tab"
					aria-selected={item.key === activeKey}
					className={[
						styles.tabItem,
						item.key === activeKey ? styles.active : styles.inactive,
					].join(" ")}
					onClick={() => onChange(item.key)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

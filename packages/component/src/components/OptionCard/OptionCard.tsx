import styles from "./OptionCard.module.css";

interface OptionCardProps {
	title?: string;
	description?: string;
	value?: string;
	selected?: boolean;
	disabled?: boolean;
}

export function OptionCard({
	title = "옵션",
	description,
	value,
	selected = false,
	disabled = false,
}: OptionCardProps) {
	return (
		<button
			type="button"
			className={`${styles.card} ${selected ? styles.selected : ""}`}
			aria-pressed={selected}
			disabled={disabled}
			data-cx-component="OptionCard"
		>
			<span className={styles.content}>
				<span className={styles.title}>{title}</span>
				{description ? <span className={styles.description}>{description}</span> : null}
			</span>
			{value ? <span className={styles.value}>{value}</span> : null}
		</button>
	);
}

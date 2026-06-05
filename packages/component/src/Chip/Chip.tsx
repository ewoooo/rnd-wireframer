import styles from "./Chip.module.css";

/** Figma: .ChipItem — Selected=Off|On, h=37, padding 10/12, radius=999, fontSize=13 */
interface ChipProps {
	selected?: boolean;
	onClick?: () => void;
	children: React.ReactNode;
}

export function Chip({ selected = false, onClick, children }: ChipProps) {
	return (
		<button
			type="button"
			className={`${styles.chip} ${selected ? styles.selected : styles.unselected}`}
			onClick={onClick}
			aria-pressed={selected}
		>
			{children}
		</button>
	);
}

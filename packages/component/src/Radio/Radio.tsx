import styles from "./Radio.module.css";

interface RadioTextProps {
	checked?: boolean;
	label: string;
	onChange?: (checked: boolean) => void;
}

export function RadioText({ checked = false, label, onChange }: RadioTextProps) {
	return (
		<label className={styles.label}>
			<input
				className={styles.input}
				type="radio"
				checked={checked}
				onChange={(event) => onChange?.(event.currentTarget.checked)}
			/>
			<span className={styles.control} aria-hidden="true" />
			<span className={styles.text}>{label}</span>
		</label>
	);
}

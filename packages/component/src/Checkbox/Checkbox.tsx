import styles from "./Checkbox.module.css";

interface CheckboxTextProps {
	checked?: boolean;
	label: string;
	onChange?: (checked: boolean) => void;
}

export function CheckboxText({ checked = false, label, onChange }: CheckboxTextProps) {
	return (
		<label className={styles.label}>
			<input
				className={styles.input}
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange?.(event.currentTarget.checked)}
			/>
			<span className={styles.control} aria-hidden="true" />
			<span className={styles.text}>{label}</span>
		</label>
	);
}

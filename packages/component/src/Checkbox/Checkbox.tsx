interface CheckboxTextProps {
	checked?: boolean;
	label: string;
	onChange?: (checked: boolean) => void;
}

export function CheckboxText({ checked = false, label, onChange }: CheckboxTextProps) {
	return (
		<label>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange?.(event.currentTarget.checked)}
			/>
			<span>{label}</span>
		</label>
	);
}

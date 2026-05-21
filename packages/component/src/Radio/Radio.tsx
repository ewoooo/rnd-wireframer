interface RadioTextProps {
	checked?: boolean;
	label: string;
	onChange?: (checked: boolean) => void;
}

export function RadioText({ checked = false, label, onChange }: RadioTextProps) {
	return (
		<label>
			<input
				type="radio"
				checked={checked}
				onChange={(event) => onChange?.(event.currentTarget.checked)}
			/>
			<span>{label}</span>
		</label>
	);
}

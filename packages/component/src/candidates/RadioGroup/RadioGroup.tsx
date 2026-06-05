import { ListSelected } from "../../components/ListSelected/ListSelected";

type RadioOption = string | { value?: string; label?: string };

interface RadioGroupProps {
	options?: RadioOption[];
	selectedValue?: string;
	label?: string;
}

function normalizeOption(option: RadioOption): { key: string; label: string } {
	if (typeof option === "string") return { key: option, label: option };
	const label = option.label ?? option.value ?? "";
	return { key: option.value ?? label, label };
}

function isSelected(option: RadioOption, selectedValue?: string): boolean {
	if (selectedValue === undefined) return false;
	if (typeof option === "string") return option === selectedValue;
	return option.value === selectedValue || option.label === selectedValue;
}

/**
 * Candidate component (not yet promoted to src/components/).
 * Single-select group: renders one selectable radio row per option (string or {value,label}).
 */
export function RadioGroup({ options = [], selectedValue }: RadioGroupProps) {
	return (
		<div className="flex flex-col">
			{options.map((option) => {
				const { key, label } = normalizeOption(option);
				return (
					<ListSelected
						key={key}
						type="radio"
						label={label}
						checked={isSelected(option, selectedValue)}
						showButton={false}
						showPrice={false}
					/>
				);
			})}
		</div>
	);
}

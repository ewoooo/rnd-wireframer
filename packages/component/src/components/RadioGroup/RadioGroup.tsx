import { ListSelected } from "../ListSelected/ListSelected";

interface RadioGroupProps {
	options?: string[];
	selectedValue?: string;
	label?: string;
}

/** Single-select group: renders one selectable radio row per option. */
export function RadioGroup({ options = [], selectedValue }: RadioGroupProps) {
	return (
		<div className="flex flex-col">
			{options.map((option) => (
				<ListSelected
					key={option}
					type="radio"
					label={option}
					checked={option === selectedValue}
					showButton={false}
					showPrice={false}
				/>
			))}
		</div>
	);
}

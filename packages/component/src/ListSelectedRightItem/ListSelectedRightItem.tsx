import { Button } from "../Button";

interface ListSelectedRightItemProps {
	label: string;
	onClick?: () => void;
	type?: "buttonXsmallSolid";
}

export function ListSelectedRightItem({ label, onClick }: ListSelectedRightItemProps) {
	return (
		<Button size="xsmall" variant="solid" onClick={onClick}>
			{label}
		</Button>
	);
}

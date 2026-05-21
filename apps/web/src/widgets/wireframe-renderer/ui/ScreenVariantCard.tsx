import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/utils";
import type {
	WireframeWorkbenchScreenVariant,
	WireframeWorkbenchScreenVariantOption,
} from "../model/workbench-store";

interface ScreenVariantCardProps {
	onSelect: (screenCode: string) => void;
	selectedScreenCode: string;
	screenVariant: WireframeWorkbenchScreenVariant;
}

export function ScreenVariantCard({
	onSelect,
	screenVariant,
	selectedScreenCode,
}: ScreenVariantCardProps) {
	return (
		<div className="flex min-w-0 justify-between gap-2 border-t bg-background/80 p-2">
			<div className="flex min-w-0 items-center gap-2">
				<span className="shrink-0 text-xs text-muted-foreground">
					{String(screenVariant.screenOrder)}
				</span>
				<span className="truncate text-xs font-medium">{screenVariant.name}</span>
			</div>
			<div className="flex flex-wrap gap-1.5">
				{screenVariant.options.map((option) => (
					<ScreenVariantOptionChip
						key={`${option.code}-${option.screenCode}`}
						isSelected={option.screenCode === selectedScreenCode}
						onSelect={onSelect}
						option={option}
					/>
				))}
			</div>
		</div>
	);
}

function ScreenVariantOptionChip({
	isSelected,
	onSelect,
	option,
}: {
	isSelected: boolean;
	onSelect: (screenCode: string) => void;
	option: WireframeWorkbenchScreenVariantOption;
}) {
	const handleSelect = () => {
		onSelect(option.screenCode);
	};

	return (
		<Badge
			variant={isSelected ? "default" : "outline"}
			className={cn(
				"h-5 min-w-6 cursor-pointer justify-center rounded-full px-2.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				isSelected && "hover:bg-primary hover:text-primary-foreground",
			)}
			role="button"
			aria-pressed={isSelected}
			title={option.name}
			onClick={handleSelect}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					handleSelect();
				}
			}}
		>
			{option.label}
		</Badge>
	);
}

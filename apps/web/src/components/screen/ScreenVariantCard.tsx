import { cn } from "@/components/utils";
import type { ScreenVariantGroup } from "@/model/workbench-view-model";

type ScreenVariantCardProps = {
	onSelectScreen: (screenId: string) => void;
	selectedScreenId?: string;
	variant: ScreenVariantGroup;
};

export function ScreenVariantCard({
	onSelectScreen,
	selectedScreenId,
	variant,
}: ScreenVariantCardProps) {
	const isSelected = variant.options.some((option) => option.screen.id === selectedScreenId);
	const primaryOption = variant.options[0];

	return (
		<div
			className={cn(
				"py-1 gap-1 flex flex-col min-w-0 cursor-pointer border-t border-sidebar-border bg-sidebar transition-colors first:border-t-0 hover:bg-sidebar-accent",
				isSelected && "bg-primary/10 hover:bg-primary/10",
			)}
		>
			<button
				type="button"
				className="flex min-w-0 items-center gap-1 px-2 text-left"
				onClick={() => {
					if (primaryOption) onSelectScreen(primaryOption.screen.id);
				}}
			>
				<span
					className={cn("shrink-0 text-xs", isSelected ? "text-primary" : "text-muted-foreground")}
				>
					{variant.order}
				</span>
				<span
					className={cn(
						"truncate text-xs",
						isSelected ? "font-semibold text-primary" : "font-medium",
					)}
				>
					{variant.name}
				</span>
			</button>
			<div className="flex flex-wrap content-start gap-1 px-2 py-2">
				{variant.options.map((option) => (
					<button
						type="button"
						key={option.screen.id}
						className={cn(
							"max-w-full cursor-pointer rounded-full border border-sidebar-border px-2 leading-none transition-colors hover:bg-background hover:text-foreground",
							option.screen.id === selectedScreenId &&
								"border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
							isSelected &&
								option.screen.id !== selectedScreenId &&
								"border-background/80 text-primary",
						)}
						onClick={(event) => {
							event.stopPropagation();
							onSelectScreen(option.screen.id);
						}}
						title={option.screen.title}
					>
						<span className="block text-xs">{option.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}

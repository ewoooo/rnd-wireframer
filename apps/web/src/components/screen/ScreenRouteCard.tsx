import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { AppScreenRoute } from "@/model/store";
import { ScreenVariantCard } from "./ScreenVariantCard";

interface ScreenRouteCardProps {
	isSelected: boolean;
	onSelectRoute: (screenRouteCode: string) => void;
	onSelectVariant: (screenCode: string) => void;
	route: AppScreenRoute;
	selectedScreenCode: string;
}

export function ScreenRouteCard({
	isSelected,
	onSelectRoute,
	onSelectVariant,
	route,
	selectedScreenCode,
}: ScreenRouteCardProps) {
	return (
		<div
			className={cn(
				"flex flex-col border bg-background transition-colors",
				isSelected && "bg-primary/5",
			)}
		>
			<SectionRouteCardHeader route={route} onSelectRoute={onSelectRoute} />
			<fieldset className="flex min-w-0 flex-col">
				<legend className="sr-only">{route.name} screen variants</legend>
				{route.screenVariants.map((variant) => (
					<ScreenVariantCard
						key={`${route.code}-${variant.screenOrder}`}
						onSelect={onSelectVariant}
						screenVariant={variant}
						selectedScreenCode={selectedScreenCode}
					/>
				))}
			</fieldset>
		</div>
	);
}

function SectionRouteCardHeader({
	route,
	onSelectRoute,
}: {
	route: AppScreenRoute;
	onSelectRoute: (screenRouteCode: string) => void;
}) {
	return (
		<div className="flex items-start justify-between p-3">
			<Button
				type="button"
				variant="ghost"
				className="h-auto min-w-0 flex-1 justify-start p-0 text-left hover:bg-transparent"
				onClick={() => onSelectRoute(route.code)}
			>
				<span className="flex min-w-0 flex-col justify-between ">
					<span className="truncate text-sm font-medium">{route.name}</span>
					<div>
						<span className="truncate text-xs font-normal text-muted-foreground">{route.code}</span>
						<span className="truncate text-xs font-normal text-muted-foreground">
							{route.screenCount} screens
						</span>
					</div>
				</span>
			</Button>
			<Badge variant="secondary">{route.module}</Badge>
		</div>
	);
}

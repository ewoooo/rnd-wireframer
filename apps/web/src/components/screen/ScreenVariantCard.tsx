import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/utils";
import type { AppScreenVariant, AppScreenVariantOption } from "@/model/store";

interface ScreenVariantCardProps {
	onSelect: (screenCode: string) => void;
	selectedScreenCode: string;
	screenVariant: AppScreenVariant;
}

export function ScreenVariantCard({
	onSelect,
	screenVariant,
	selectedScreenCode,
}: ScreenVariantCardProps) {
	const isBase = (o: AppScreenVariantOption) => o.name === o.variantName;
	const baseOption = screenVariant.options.find(isBase);
	const edgeOptions = screenVariant.options.filter((o) => !isBase(o));

	const isRowSelected = screenVariant.options.some((o) => o.screenCode === selectedScreenCode);

	const handleRowClick = () => {
		if (baseOption) onSelect(baseOption.screenCode);
	};

	return (
		<div
			className={cn(
				"flex min-w-0 cursor-pointer border-t transition-colors hover:bg-accent",
				isRowSelected && "bg-primary/10 hover:bg-primary/10",
			)}
			onClick={handleRowClick}
		>
			{/* 왼쪽 30%: 스크린 이름 */}
			<div className="flex w-[30%] min-w-0 items-center gap-1.5 p-2">
				<span className={cn("shrink-0 text-xs", isRowSelected ? "text-primary" : "text-muted-foreground")}>
					{screenVariant.order}
				</span>
				<span className={cn("truncate text-xs", isRowSelected ? "font-semibold text-primary" : "font-medium")}>
					{screenVariant.name}
				</span>
			</div>

			{/* 오른쪽 70%: 기본 + 엣지케이스 전체 (인라인 흐름) */}
			<div className="flex w-[70%] flex-wrap content-start gap-1 p-2">
				{baseOption && (
					<ScreenVariantOptionChip
						isRowSelected={isRowSelected}
						isSelected={baseOption.screenCode === selectedScreenCode}
						onSelect={onSelect}
						option={baseOption}
					/>
				)}
				{edgeOptions.map((option) => (
					<ScreenVariantOptionChip
						key={option.screenCode}
						isRowSelected={isRowSelected}
						isSelected={option.screenCode === selectedScreenCode}
						onSelect={onSelect}
						option={option}
					/>
				))}
			</div>
		</div>
	);
}

/** variant_type → 표시 라벨 매핑. 새 타입 추가 시 여기만 수정 */
const VARIANT_TYPE_LABELS: Record<string, string> = {
	base: "기본",
};

function resolveChipLabel(option: AppScreenVariantOption): string {
	const { name, variantName } = option;
	// 타이틀이 variant명과 동일 = 기본 케이스 → 타입 라벨 사용
	if (name === variantName) {
		return VARIANT_TYPE_LABELS[option.type] ?? option.type;
	}
	// 엣지케이스: "{variantName}-{케이스명}" 패턴 파싱
	const prefix = variantName + "-";
	if (name.startsWith(prefix)) return name.slice(prefix.length).trim();
	return option.label;
}

function ScreenVariantOptionChip({
	isRowSelected,
	isSelected,
	onSelect,
	option,
}: {
	isRowSelected: boolean;
	isSelected: boolean;
	onSelect: (screenCode: string) => void;
	option: AppScreenVariantOption;
}) {
	const handleSelect = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect(option.screenCode);
	};
	const chipLabel = resolveChipLabel(option);

	return (
		<Badge
			variant={isSelected ? "default" : "outline"}
			className={cn(
				"h-5 w-auto cursor-pointer rounded-full px-2 text-xs font-normal outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "hover:bg-primary hover:text-primary-foreground",
				isRowSelected && !isSelected && "!border-white",
			)}
			role="button"
			aria-pressed={isSelected}
			title={option.name}
			onClick={handleSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					onSelect(option.screenCode);
				}
			}}
		>
			{chipLabel}
		</Badge>
	);
}

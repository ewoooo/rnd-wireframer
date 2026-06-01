"use client";

import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteVariant, duplicateVariant, updateVariant } from "@/app/actions/screen-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { AppScreenVariant, AppScreenVariantOption } from "@/model/store";

interface ScreenVariantCardProps {
	isAutoEditing?: boolean;
	onAutoEditDone?: () => void;
	onDeleted: () => void;
	onSaved: () => void;
	onSelect: (screenCode: string) => void;
	selectedScreenCode: string;
	screenVariant: AppScreenVariant;
}

export function ScreenVariantCard({
	isAutoEditing,
	onAutoEditDone,
	onDeleted,
	onSaved,
	onSelect,
	screenVariant,
	selectedScreenCode,
}: ScreenVariantCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [nameValue, setNameValue] = useState(screenVariant.name);
	const [isSaving, startSaving] = useTransition();
	const [isDuplicating, startDuplicating] = useTransition();
	const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
	const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const isBase = (o: AppScreenVariantOption) => o.name === o.variantName;
	const baseOption = screenVariant.options.find(isBase);
	const edgeOptions = screenVariant.options.filter((o) => !isBase(o));
	const isRowSelected = screenVariant.options.some((o) => o.screenCode === selectedScreenCode);

	useEffect(() => {
		if (isAutoEditing && !isEditing) {
			setNameValue(screenVariant.name);
			setIsEditing(true);
			onAutoEditDone?.();
		}
	}, [isAutoEditing, isEditing, screenVariant.name, onAutoEditDone]);

	useEffect(() => {
		if (!isEditing) setNameValue(screenVariant.name);
	}, [screenVariant.name, isEditing]);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	function handleSave() {
		const trimmed = nameValue.trim();
		if (!trimmed || trimmed === screenVariant.name) {
			setIsEditing(false);
			return;
		}
		startSaving(async () => {
			await updateVariant(screenVariant.id, { name: trimmed });
			setIsEditing(false);
			onSaved();
		});
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") {
			setNameValue(screenVariant.name);
			setIsEditing(false);
		}
	}

	function handleDuplicate(e: React.MouseEvent) {
		e.stopPropagation();
		startDuplicating(async () => {
			await duplicateVariant(screenVariant.id);
			onSaved();
		});
	}

	function handleDeleteClick(e: React.MouseEvent) {
		e.stopPropagation();
		if (isDeleteConfirming) {
			if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
			setIsDeleteConfirming(false);
			deleteVariant(screenVariant.id).then(onDeleted);
		} else {
			setIsDeleteConfirming(true);
			deleteTimerRef.current = setTimeout(() => setIsDeleteConfirming(false), 2000);
		}
	}

	const handleRowClick = () => {
		const target = baseOption ?? screenVariant.options[0];
		if (target) onSelect(target.screenCode);
	};

	if (isEditing) {
		return (
			<div className={cn("border-t px-3 py-2", isRowSelected && "bg-primary/10")}>
				<div className="flex items-center gap-1">
					<span className={cn("shrink-0 text-xs tabular-nums", isRowSelected ? "text-primary" : "text-muted-foreground")}>
						{screenVariant.order}
					</span>
					<input
						ref={inputRef}
						type="text"
						value={nameValue}
						onChange={(e) => setNameValue(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={handleSave}
						disabled={isSaving}
						className="min-w-0 flex-1 bg-transparent text-xs font-medium outline-none"
					/>
					<Button type="button" size="sm" variant="default" className="h-5 px-1.5" disabled={isSaving} onClick={handleSave}>
						<Check className="size-3" />
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="h-5 px-1.5"
						disabled={isSaving}
						onClick={() => { setNameValue(screenVariant.name); setIsEditing(false); }}
					>
						<X className="size-3" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"group flex min-w-0 cursor-pointer border-t transition-colors hover:bg-accent",
				isRowSelected && "bg-primary/10 hover:bg-primary/10",
			)}
			onClick={handleRowClick}
		>
			{/* 왼쪽: order + name + pencil */}
			<div className="flex w-[30%] min-w-0 items-center gap-1 p-2">
				<span className={cn("shrink-0 text-xs tabular-nums", isRowSelected ? "text-primary" : "text-muted-foreground")}>
					{screenVariant.order}
				</span>
				<span className={cn("flex-1 truncate text-sm", isRowSelected ? "font-semibold text-primary" : "font-normal")}>
					{screenVariant.name}
				</span>
				<button
					type="button"
					className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
					onClick={(e) => { e.stopPropagation(); setNameValue(screenVariant.name); setIsEditing(true); }}
					title="이름 편집"
				>
					<Pencil className="size-3 text-muted-foreground" />
				</button>
			</div>

			{/* 오른쪽: chips + copy + trash */}
			<div className="flex w-[70%] min-w-0 items-start p-2">
				<div className="flex flex-1 flex-wrap content-start gap-1">
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
				<div className="flex shrink-0 items-center gap-0.5 pl-1">
					<button
						type="button"
						className="rounded p-0.5 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 disabled:opacity-20"
						disabled={isDuplicating}
						onClick={handleDuplicate}
						title="스크린 복제"
					>
						<Copy className="size-3 text-muted-foreground" />
					</button>
					<button
						type="button"
						className={cn(
							"rounded p-0.5 transition-all hover:bg-black/5",
							isDeleteConfirming
								? "opacity-100 text-destructive"
								: "opacity-0 group-hover:opacity-100",
						)}
						onClick={handleDeleteClick}
						title={isDeleteConfirming ? "한 번 더 클릭하면 삭제됩니다" : "스크린 삭제"}
					>
						<Trash2 className="size-3 text-current" />
					</button>
				</div>
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
	if (name === variantName) {
		return VARIANT_TYPE_LABELS[option.type] ?? option.type;
	}
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

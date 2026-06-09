"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { NewScreenRunItem } from "@/feature/inference-new-screen/types";

type NewScreenSourcePanelProps = {
	errorMessage?: string;
	isUploading?: boolean;
	onRerunSelectedSource?: () => void;
	onRunSelectedSource?: () => void;
	onSelectSource: (id: string) => void;
	onUploadSource: (file: File) => void | Promise<void>;
	runs: NewScreenRunItem[];
	selectedRunId?: string;
};

export function NewScreenSourcePanel({
	errorMessage,
	isUploading = false,
	onRerunSelectedSource,
	onRunSelectedSource,
	onSelectSource,
	onUploadSource,
	runs,
	selectedRunId,
}: NewScreenSourcePanelProps) {
	const [isDragActive, setIsDragActive] = useState(false);
	const selectedRun = runs.find((run) => run.id === selectedRunId);

	async function handleDroppedFile(file: File | null) {
		setIsDragActive(false);
		if (!file) return;
		await onUploadSource(file);
	}

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="grid gap-3 border-b border-sidebar-border p-3">
				<label
					className={cn(
						"grid min-h-32 cursor-pointer place-items-center rounded-md border border-dashed bg-sidebar p-4 text-center transition-colors",
						isDragActive && "border-primary bg-primary/[0.06]",
						isUploading && "cursor-wait opacity-70",
					)}
					onDragEnter={(event) => {
						event.preventDefault();
						setIsDragActive(true);
					}}
					onDragOver={(event) => {
						event.preventDefault();
						setIsDragActive(true);
					}}
					onDragLeave={() => setIsDragActive(false)}
					onDrop={(event) => {
						event.preventDefault();
						void handleDroppedFile(event.dataTransfer.files.item(0));
					}}
				>
					<input
						accept=".md,text/markdown,text/plain"
						className="sr-only"
						disabled={isUploading}
						onChange={(event) => {
							void handleDroppedFile(readFirstFile(event.currentTarget.files));
							event.currentTarget.value = "";
						}}
						type="file"
					/>
					<span className="grid gap-1">
						<span className="text-sm font-semibold">
							{isUploading ? "업로드 중" : "Drop Here"}
						</span>
					</span>
				</label>
				<div className="grid grid-cols-2 gap-2">
					<Button
						className="h-8 justify-center gap-1 text-xs"
						disabled={!selectedRun?.sourcePath || isUploading || !onRunSelectedSource}
						onClick={() => onRunSelectedSource?.()}
						size="sm"
						type="button"
						variant="outline"
					>
						<Play className="size-3.5" />
						Run
					</Button>
					<Button
						className="h-8 justify-center gap-1 text-xs"
						disabled={!selectedRun?.runId || isUploading || !onRerunSelectedSource}
						onClick={() => onRerunSelectedSource?.()}
						size="sm"
						type="button"
						variant="ghost"
					>
						<RotateCcw className="size-3.5" />
						rerun
					</Button>
				</div>
				{errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto py-1">
				{runs.length ? (
					<div className="flex flex-col">
						{runs.map((run) => (
							<RunListItem
								isSelected={run.id === selectedRunId}
								key={run.id}
								onSelect={() => onSelectSource(run.id)}
								run={run}
							/>
						))}
					</div>
				) : (
					<div className="px-3 py-4 text-sm text-muted-foreground">
						업로드된 screenId가 없습니다.
					</div>
				)}
			</div>
		</div>
	);
}

function readFirstFile(files: FileList | null): File | null {
	return files?.item?.(0) ?? files?.[0] ?? null;
}

function RunListItem({
	isSelected,
	onSelect,
	run,
}: {
	isSelected: boolean;
	onSelect: () => void;
	run: NewScreenRunItem;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex min-h-16 min-w-0 cursor-pointer flex-col gap-1 border-t border-sidebar-border px-3 py-2 text-left transition-colors text-neutral-400 first:border-t-0 hover:bg-sidebar-accent",
				isSelected && "bg-primary/[0.08] text-neutral-900 hover:bg-primary/[0.08]",
			)}
			onClick={onSelect}
			title={`${run.screenId} · ${run.runId ?? "not-run"}`}
		>
			<span className={cn("truncate text-[13px]", isSelected ? "font-semibold" : "font-medium")}>
				{run.title ?? run.screenId}
			</span>
			<div className="flex gap-1">
				<span className="truncate text-[10px] leading-3 text-muted-foreground">
					{run.runId ?? "not-run"}
				</span>
				<span className="truncate text-[10px] leading-3 text-muted-foreground/70">
					{run.status ?? "source-ready"}
				</span>
			</div>
		</button>
	);
}

"use client";

import { FileUp, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";

export type NewScreenSourceItem = {
	batchId: string;
	importId: string;
	latestRunId?: string;
	path: string;
	screenId: string;
};

type NewScreenSourcePanelProps = {
	errorMessage?: string;
	isUploading?: boolean;
	onRunSelectedSource?: () => void;
	onSelectSource: (path: string) => void;
	onUploadSource: (file: File) => void | Promise<void>;
	selectedSourcePath?: string;
	sources: NewScreenSourceItem[];
};

export function NewScreenSourcePanel({
	errorMessage,
	isUploading = false,
	onRunSelectedSource,
	onSelectSource,
	onUploadSource,
	selectedSourcePath,
	sources,
}: NewScreenSourcePanelProps) {
	const [isDragActive, setIsDragActive] = useState(false);
	const selectedSource = sources.find((source) => source.path === selectedSourcePath);

	async function handleDroppedFile(file: File | null) {
		setIsDragActive(false);
		if (!file) return;
		await onUploadSource(file);
	}

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-3">
				<div className="flex min-w-0 items-center gap-1.5">
					<FileUp className="size-3.5 text-muted-foreground" data-icon="inline-start" />
					<p className="truncate text-xs font-semibold text-sidebar-foreground">새 화면</p>
				</div>
				<span className="shrink-0 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
					{sources.length}
				</span>
			</div>
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
							{isUploading ? "업로드 중" : "Markdown 드롭"}
						</span>
						<span className="text-xs leading-5 text-muted-foreground">
							data/client-imports 형식으로 저장합니다.
						</span>
					</span>
				</label>
				<div className="grid grid-cols-2 gap-2">
					<Button
						className="h-8 justify-center gap-1 text-xs"
						disabled={!selectedSource || isUploading || !onRunSelectedSource}
						onClick={() => onRunSelectedSource?.()}
						size="sm"
						type="button"
						variant="secondary"
					>
						<Play className="size-3.5" />
						Run
					</Button>
					<Button
						className="h-8 justify-center gap-1 text-xs"
						disabled
						size="sm"
						type="button"
						variant="outline"
					>
						<RotateCcw className="size-3.5" />
						rerun
					</Button>
				</div>
				{errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto py-1">
				{sources.length ? (
					<div className="flex flex-col">
						{sources.map((source) => (
							<SourceListItem
								isSelected={source.path === selectedSourcePath}
								key={source.path}
								onSelect={() => onSelectSource(source.path)}
								source={source}
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

function SourceListItem({
	isSelected,
	onSelect,
	source,
}: {
	isSelected: boolean;
	onSelect: () => void;
	source: NewScreenSourceItem;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex min-h-16 min-w-0 cursor-pointer flex-col gap-1 border-t border-sidebar-border px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-sidebar-accent",
				isSelected && "bg-primary/[0.08] text-primary hover:bg-primary/[0.08]",
			)}
			onClick={onSelect}
			title={`${source.screenId} · ${source.path}`}
		>
			<span className={cn("truncate text-[13px]", isSelected ? "font-semibold" : "font-medium")}>
				{source.screenId}
			</span>
			<span className="truncate text-[10px] leading-3 text-muted-foreground">{source.path}</span>
			<span className="truncate text-[10px] leading-3 text-muted-foreground/70">
				{source.importId}/{source.batchId}
			</span>
		</button>
	);
}

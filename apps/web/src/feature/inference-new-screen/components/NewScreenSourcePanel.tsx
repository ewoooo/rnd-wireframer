"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { NewScreenRunItem } from "@/feature/inference-new-screen/types";

type SourcePanelActions = {
	onRerunSelectedSource?: () => void;
	onRunSelectedSource?: () => void;
	onSelectSource: (id: string) => void;
	onUploadSource: (file: File) => void | Promise<void>;
};

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
	const selectedRun = runs.find((run) => run.id === selectedRunId);
	const actions: SourcePanelActions = {
		onRerunSelectedSource,
		onRunSelectedSource,
		onSelectSource,
		onUploadSource,
	};

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<RunListPanel actions={actions} runs={runs} selectedRunId={selectedRunId} />
			<SourceImportPanel
				actions={actions}
				errorMessage={errorMessage}
				isUploading={isUploading}
				selectedRun={selectedRun}
			/>
		</div>
	);
}

function readFirstFile(files: FileList | null): File | null {
	return files?.item?.(0) ?? files?.[0] ?? null;
}

function SourceImportPanel({
	actions,
	errorMessage,
	isUploading,
	selectedRun,
}: {
	actions: SourcePanelActions;
	errorMessage?: string;
	isUploading: boolean;
	selectedRun?: NewScreenRunItem;
}) {
	const [isDragActive, setIsDragActive] = useState(false);

	async function handleDroppedFile(file: File | null) {
		setIsDragActive(false);
		if (!file) return;
		await actions.onUploadSource(file);
	}

	return (
		<div className="grid gap-3 border-t border-sidebar-border p-3">
			<SourceDropZone
				isDragActive={isDragActive}
				isUploading={isUploading}
				onDragActiveChange={setIsDragActive}
				onFile={handleDroppedFile}
			/>
			<SourceActionButtons actions={actions} isUploading={isUploading} selectedRun={selectedRun} />
			{errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
		</div>
	);
}

function SourceDropZone({
	isDragActive,
	isUploading,
	onDragActiveChange,
	onFile,
}: {
	isDragActive: boolean;
	isUploading: boolean;
	onDragActiveChange: (isActive: boolean) => void;
	onFile: (file: File | null) => void | Promise<void>;
}) {
	return (
		<label
			className={cn(
				"grid min-h-32 cursor-pointer place-items-center rounded-md border border-dashed bg-sidebar p-4 text-center transition-colors",
				isDragActive && "border-primary bg-primary/[0.06]",
				isUploading && "cursor-wait opacity-70",
			)}
			onDragEnter={(event) => {
				event.preventDefault();
				onDragActiveChange(true);
			}}
			onDragOver={(event) => {
				event.preventDefault();
				onDragActiveChange(true);
			}}
			onDragLeave={() => onDragActiveChange(false)}
			onDrop={(event) => {
				event.preventDefault();
				void onFile(event.dataTransfer.files.item(0));
			}}
		>
			<input
				accept=".md,text/markdown,text/plain"
				className="sr-only"
				disabled={isUploading}
				onChange={(event) => {
					void onFile(readFirstFile(event.currentTarget.files));
					event.currentTarget.value = "";
				}}
				type="file"
			/>
			<span className="grid gap-1">
				<span className="text-sm font-semibold">{isUploading ? "업로드 중" : "Drop Here"}</span>
			</span>
		</label>
	);
}

function SourceActionButtons({
	actions,
	isUploading,
	selectedRun,
}: {
	actions: SourcePanelActions;
	isUploading: boolean;
	selectedRun?: NewScreenRunItem;
}) {
	return (
		<div className="grid grid-cols-2 gap-2">
			<Button
				className="h-8 justify-center gap-1 text-xs"
				disabled={!selectedRun?.sourcePath || isUploading || !actions.onRunSelectedSource}
				onClick={() => actions.onRunSelectedSource?.()}
				size="sm"
				type="button"
				variant="outline"
			>
				<Play className="size-3.5" />
				Run
			</Button>
			<Button
				className="h-8 justify-center gap-1 text-xs"
				disabled={!selectedRun?.runId || isUploading || !actions.onRerunSelectedSource}
				onClick={() => actions.onRerunSelectedSource?.()}
				size="sm"
				type="button"
				variant="ghost"
			>
				<RotateCcw className="size-3.5" />
				rerun
			</Button>
		</div>
	);
}

function RunListPanel({
	actions,
	runs,
	selectedRunId,
}: {
	actions: Pick<SourcePanelActions, "onSelectSource">;
	runs: NewScreenRunItem[];
	selectedRunId: string | undefined;
}) {
	const runItems = runs.filter((run) => run.runId);
	const sourceItems = runs.filter((run) => !run.runId);

	return (
		<div className="min-h-0 flex-1 overflow-y-auto py-1">
			{runs.length ? (
				<div className="flex flex-col">
					<RunListSection
						actions={actions}
						runs={runItems}
						selectedRunId={selectedRunId}
						title="생성 큐"
					/>
					<RunListSection
						actions={actions}
						runs={sourceItems}
						selectedRunId={selectedRunId}
						title="원본 소스"
					/>
				</div>
			) : (
				<div className="px-3 py-4 text-sm text-muted-foreground">업로드된 screenId가 없습니다.</div>
			)}
		</div>
	);
}

function RunListSection({
	actions,
	runs,
	selectedRunId,
	title,
}: {
	actions: Pick<SourcePanelActions, "onSelectSource">;
	runs: NewScreenRunItem[];
	selectedRunId: string | undefined;
	title: string;
}) {
	if (runs.length === 0) return null;
	return (
		<section className="flex flex-col">
			<div className="border-t border-sidebar-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:border-t-0">
				{title}
			</div>
			{runs.map((run) => (
				<RunListItem
					isSelected={run.id === selectedRunId}
					key={run.id}
					onSelect={() => actions.onSelectSource(run.id)}
					run={run}
				/>
			))}
		</section>
	);
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

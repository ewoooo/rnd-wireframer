"use client";

import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import { GitCompare, ListChecks, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { RenderedScreen } from "@/components/screen/RenderedScreen";
import { Button } from "@/components/ui/button";
import { diffRenderTrees } from "@/lib/render-tree-diff";
import type { SmokeRunSummary } from "@/lib/smoke-runs";

type SmokeRunExplorerProps = {
	runs: SmokeRunSummary[];
};

export function SmokeRunExplorer({ runs }: SmokeRunExplorerProps) {
	const [leftRunId, setLeftRunId] = useState(runs[0]?.id ?? "");
	const [rightRunId, setRightRunId] = useState(runs[1]?.id ?? runs[0]?.id ?? "");
	const [activeApplyKey, setActiveApplyKey] = useState("");
	const [applyMessages, setApplyMessages] = useState<Record<string, string>>({});
	const leftRun = runs.find((run) => run.id === leftRunId) ?? runs[0];
	const rightRun = runs.find((run) => run.id === rightRunId) ?? runs[1] ?? runs[0];
	const diff = diffRenderTrees(leftRun?.finalResult, rightRun?.finalResult);

	async function handleApply(runId: string, write: boolean) {
		const key = `${runId}:${write ? "write" : "dry"}`;
		setActiveApplyKey(key);
		try {
			const response = await fetch("/api/smoke-runs/apply", {
				body: JSON.stringify({ runId, write }),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const payload = (await response.json()) as
				| { changed?: Record<string, number>; error?: string; mode?: string; warnings?: string[] }
				| undefined;
			if (!response.ok) throw new Error(payload?.error ?? "Apply failed.");

			const changed = payload?.changed ?? {};
			const changedTotal = Object.values(changed).reduce((sum, value) => sum + value, 0);
			const warningCount = payload?.warnings?.length ?? 0;
			setApplyMessages({
				...applyMessages,
				[runId]: `${payload?.mode ?? "dry-run"} changed ${changedTotal}, warnings ${warningCount}`,
			});
		} catch (error) {
			setApplyMessages({
				...applyMessages,
				[runId]: error instanceof Error ? error.message : "Apply failed.",
			});
		} finally {
			setActiveApplyKey("");
		}
	}

	return (
		<main className="grid h-svh grid-cols-[320px_minmax(0,1fr)] overflow-hidden bg-sidebar text-foreground">
			<aside className="min-h-0 overflow-y-auto border-r border-sidebar-border bg-background">
				<div className="sticky top-0 border-b bg-background px-4 py-3">
					<h1 className="text-base font-semibold">Smoke Runs</h1>
					<p className="mt-1 text-xs text-muted-foreground">data/runs/screen-generation</p>
				</div>
				<div className="flex flex-col gap-2 p-3">
					{runs.length === 0 ? <EmptyRunList /> : null}
					{runs.map((run) => (
						<RunButton
							key={run.id}
							isLeft={run.id === leftRunId}
							isRight={run.id === rightRunId}
							onPickLeft={() => setLeftRunId(run.id)}
							onPickRight={() => setRightRunId(run.id)}
							onDryRun={() => handleApply(run.id, false)}
							onWrite={() => handleApply(run.id, true)}
							applyMessage={applyMessages[run.id]}
							activeApplyKey={activeApplyKey}
							run={run}
						/>
					))}
				</div>
			</aside>
			<section className="min-h-0 overflow-hidden">
				<div className="flex h-14 items-center justify-between border-b bg-background px-5">
					<div className="min-w-0">
						<h2 className="truncate text-sm font-semibold">Run Compare</h2>
						<p className="truncate text-xs text-muted-foreground">
							{leftRun?.id ?? "left"} ↔ {rightRun?.id ?? "right"}
						</p>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<GitCompare className="size-4" />
						<span>shared {diff.sharedNodeCount}</span>
						<span>layout Δ {diff.changedLayoutCount}</span>
						<span>props Δ {diff.changedPropCount}</span>
					</div>
				</div>
				<div className="grid h-[calc(100svh-3.5rem)] grid-rows-[minmax(0,1fr)_176px]">
					<div className="grid min-h-0 grid-cols-2 gap-4 overflow-auto bg-secondary/50 p-5">
						<RunPreview title="Baseline" run={leftRun} />
						<RunPreview title="Candidate" run={rightRun} />
					</div>
					<div className="grid grid-cols-4 gap-3 border-t bg-background p-4">
						<Metric label="Left nodes" value={diff.leftNodeCount} />
						<Metric label="Right nodes" value={diff.rightNodeCount} />
						<Metric label="Missing left" value={diff.missingInLeftCount} />
						<Metric label="Missing right" value={diff.missingInRightCount} />
					</div>
				</div>
			</section>
		</main>
	);
}

function EmptyRunList() {
	return (
		<div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
			<ListChecks className="size-5" />
			<p>저장된 smoke run이 없습니다.</p>
		</div>
	);
}

function RunButton({
	activeApplyKey,
	applyMessage,
	isLeft,
	isRight,
	onDryRun,
	onPickLeft,
	onPickRight,
	onWrite,
	run,
}: {
	activeApplyKey: string;
	applyMessage?: string;
	isLeft: boolean;
	isRight: boolean;
	onDryRun: () => void;
	onPickLeft: () => void;
	onPickRight: () => void;
	onWrite: () => void;
	run: SmokeRunSummary;
}) {
	const dryKey = `${run.id}:dry`;
	const writeKey = `${run.id}:write`;

	return (
		<div className="rounded-md border bg-sidebar p-3">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{run.id}</p>
					<p className="mt-1 truncate text-xs text-muted-foreground">{run.manifest.sourcePath}</p>
				</div>
				<span className="shrink-0 rounded-sm bg-background px-1.5 py-0.5 text-xs">
					{run.manifest.summary.validationOk ? "ok" : "check"}
				</span>
			</div>
			<div className="mt-3 grid grid-cols-2 gap-2">
				<Button size="sm" variant={isLeft ? "default" : "outline"} onClick={onPickLeft}>
					Left
				</Button>
				<Button size="sm" variant={isRight ? "default" : "outline"} onClick={onPickRight}>
					Right
				</Button>
			</div>
			<div className="mt-2 grid grid-cols-2 gap-2">
				<Button disabled={activeApplyKey.length > 0} size="sm" variant="outline" onClick={onDryRun}>
					{activeApplyKey === dryKey ? <Loader2 className="size-3 animate-spin" /> : null}
					Dry
				</Button>
				<Button disabled={activeApplyKey.length > 0} size="sm" onClick={onWrite}>
					{activeApplyKey === writeKey ? (
						<Loader2 className="size-3 animate-spin" />
					) : (
						<Upload className="size-3" />
					)}
					Apply
				</Button>
			</div>
			{applyMessage ? (
				<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{applyMessage}</p>
			) : null}
		</div>
	);
}

function RunPreview({ run, title }: { run?: SmokeRunSummary; title: string }) {
	const screenNode = getScreenNode(run?.finalResult);

	return (
		<div className="flex min-h-0 flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="min-w-0">
					<h3 className="truncate text-sm font-semibold">{title}</h3>
					<p className="truncate text-xs text-muted-foreground">{run?.id ?? "No run"}</p>
				</div>
				<div className="text-right text-xs text-muted-foreground">
					<p>nodes {run?.quality.nodeCount ?? 0}</p>
					<p>placeholder {run?.quality.placeholderCount ?? 0}</p>
				</div>
			</div>
			<div className="flex min-h-0 justify-center overflow-auto">
				<RenderedScreen node={screenNode} />
			</div>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-md border bg-sidebar px-3 py-2">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-xl font-semibold">{value}</p>
		</div>
	);
}

function getScreenNode(renderTree: RenderTree | undefined): RenderTreeScreenNode | undefined {
	return renderTree?.children.find((node) => node.type === "Screen") as
		| RenderTreeScreenNode
		| undefined;
}

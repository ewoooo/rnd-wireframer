"use client";

import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import { GitCompare, Layers3, ListChecks } from "lucide-react";
import { useState } from "react";
import { NavigationRail } from "@/components/layout/NavigationRail";
import { RenderedScreen } from "@/components/screen/RenderedScreen";
import { diffRenderTrees } from "@/lib/render-tree-diff";
import type { SmokeRunManifestLayer, SmokeRunSummary } from "@/lib/smoke-runs";

type SmokeRunExplorerProps = {
	runs: SmokeRunSummary[];
};

export function SmokeRunExplorer({ runs }: SmokeRunExplorerProps) {
	const [leftRunId, setLeftRunId] = useState(runs[0]?.id ?? "");
	const [rightRunId, setRightRunId] = useState(runs[1]?.id ?? runs[0]?.id ?? "");
	const leftRun = runs.find((run) => run.id === leftRunId) ?? runs[0];
	const rightRun = runs.find((run) => run.id === rightRunId) ?? runs[1] ?? runs[0];
	const diff = diffRenderTrees(leftRun?.finalResult, rightRun?.finalResult);

	return (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar text-foreground">
			<NavigationRail activeHref="/smoke" />
			<div className="grid min-w-0 flex-1 grid-cols-[clamp(220px,32vw,320px)_minmax(0,1fr)] overflow-hidden">
				<aside className="flex min-h-0 min-w-0 flex-col  overflow-hidden border-r border-sidebar-border bg-background">
					<div className="border-b px-3 py-2">
						<h1 className="text-sm font-semibold">Smoke Runs</h1>
						<p className="truncate text-xs text-muted-foreground">
							{leftRun?.id ?? "none"} ↔ {rightRun?.id ?? "none"}
						</p>
					</div>
					<div className="grid min-h-0 flex-1 grid-rows-2">
						<RunPickerPane
							onSelectRun={setLeftRunId}
							runs={runs}
							selectedRun={leftRun}
							selectedRunId={leftRunId}
							title="Left"
						/>
						<RunPickerPane
							onSelectRun={setRightRunId}
							runs={runs}
							selectedRun={rightRun}
							selectedRunId={rightRunId}
							title="Right"
						/>
					</div>
				</aside>
				<section className="min-h-0 min-w-0 overflow-hidden">
					<div className="grid h-full grid-rows-[minmax(0,1fr)_100px] border-r-2">
						<div className="grid min-h-0 grid-cols-2 gap-4 overflow-auto bg-secondary/50">
							<RunPreview title="Left" run={leftRun} />
							<RunPreview title="Right" run={rightRun} />
						</div>
						<div className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-1 border-t bg-background p-4">
							<div className="flex min-w-0 items-center gap-2 rounded-md border bg-sidebar px-3 py-2">
								<GitCompare className="size-4 shrink-0 text-muted-foreground" />
								<p className="truncate text-sm font-medium">
									{leftRun?.id ?? "none"} ↔ {rightRun?.id ?? "none"}
								</p>
							</div>
							<Metric label="Left nodes" value={diff.leftNodeCount} />
							<Metric label="Missing left" value={diff.missingInLeftCount} />
							<Metric label="Right nodes" value={diff.rightNodeCount} />
							<Metric label="Missing right" value={diff.missingInRightCount} />
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}

function RunPickerPane({
	onSelectRun,
	runs,
	selectedRun,
	selectedRunId,
	title,
}: {
	onSelectRun: (runId: string) => void;
	runs: SmokeRunSummary[];
	selectedRun?: SmokeRunSummary;
	selectedRunId: string;
	title: string;
}) {
	return (
		<section
			className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b last:border-b-0"
			aria-label={`${title} runs`}
		>
			<div className="min-w-0 border-b bg-background px-3 py-2">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h2 className="text-sm font-semibold">{title}</h2>
						<p className="truncate text-xs text-muted-foreground">
							{selectedRun?.id ?? "No run selected"}
						</p>
					</div>
				</div>
			</div>
			<div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto p-3">
				{runs.length === 0 ? <EmptyRunList /> : null}
				{runs.map((run) => (
					<RunListItem
						key={run.id}
						isSelected={run.id === selectedRunId}
						onSelect={() => onSelectRun(run.id)}
						run={run}
					/>
				))}
			</div>
		</section>
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

function RunListItem({
	isSelected,
	onSelect,
	run,
}: {
	isSelected: boolean;
	onSelect: () => void;
	run: SmokeRunSummary;
}) {
	return (
		<button
			type="button"
			className={`w-full min-w-0 rounded-md border p-3 text-left transition-colors ${
				isSelected ? "border-primary bg-primary/5" : "bg-sidebar hover:bg-accent"
			}`}
			onClick={onSelect}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{run.id}</p>
					<p className="mt-1 truncate text-xs text-muted-foreground">{run.manifest.sourcePath}</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					{isSelected ? <SelectedBadge /> : null}
				</div>
			</div>
		</button>
	);
}

function SelectedBadge() {
	return (
		<span className="flex size-5 items-center justify-center rounded-sm bg-primary/10 text-xs font-semibold text-primary">
			on
		</span>
	);
}

function RunPreview({ run, title }: { run?: SmokeRunSummary; title: string }) {
	const screenNode = getScreenNode(run?.finalResult);

	return (
		<div className="flex min-h-0 flex-col gap-3 border-r-1">
			<div className="flex items-center justify-between p-5">
				<div className="min-w-0">
					<h3 className="truncate text-sm font-semibold">{title}</h3>
					<p className="truncate text-xs text-muted-foreground">{run?.id ?? "No run"}</p>
				</div>
			</div>
			{run ? <RunLayerSummary run={run} /> : null}
			<div className="grid h-full place-content-center overflow-auto">
				<RenderedScreen node={screenNode} />
			</div>
		</div>
	);
}

function RunLayerSummary({ run }: { run: SmokeRunSummary }) {
	const layers = getLayerGroups(run);
	const compositionPlan = run.compositionPlan;
	const selectedSkill = run.trace?.designSkillSelection?.selectedSkill;

	return (
		<div className="mx-5 grid gap-2 rounded-md border bg-background p-3">
			<div className="flex items-center gap-2 text-xs font-semibold">
				<Layers3 className="size-4 text-muted-foreground" />
				<span>Inference Layers</span>
			</div>
			<div className="grid grid-cols-3 gap-2">
				{layers.map((layer) => (
					<LayerBadge key={layer.layer} layer={layer.layer} value={layer.artifactCount} />
				))}
			</div>
			{selectedSkill ? (
				<div className="grid gap-1 border-t pt-2 text-xs">
					<p className="truncate">
						<span className="text-muted-foreground">Skill</span> {selectedSkill.id ?? "-"}
					</p>
					<p className="truncate">
						<span className="text-muted-foreground">Docs</span>{" "}
						{selectedSkill.requiredDesignDocs?.length ?? 0}
					</p>
					<p className="truncate">
						<span className="text-muted-foreground">Gates</span>{" "}
						{selectedSkill.qualityGates?.join(", ") ?? "-"}
					</p>
				</div>
			) : null}
			{compositionPlan ? (
				<div className="grid gap-1 border-t pt-2 text-xs">
					<p className="truncate">
						<span className="text-muted-foreground">Hierarchy</span>{" "}
						{compositionPlan.visualHierarchy ?? "-"}
					</p>
					<p className="truncate">
						<span className="text-muted-foreground">Action</span>{" "}
						{compositionPlan.primaryUserAction ?? "-"}
					</p>
					<p className="truncate">
						<span className="text-muted-foreground">Density</span> {compositionPlan.density ?? "-"}
					</p>
				</div>
			) : null}
		</div>
	);
}

function LayerBadge({ layer, value }: { layer: SmokeRunManifestLayer; value: number }) {
	return (
		<div className="rounded-sm border bg-sidebar px-2 py-1">
			<p className="text-[10px] font-medium uppercase text-muted-foreground">{layer}</p>
			<p className="text-sm font-semibold">{value}</p>
		</div>
	);
}

function getLayerGroups(run: SmokeRunSummary): Array<{
	artifactCount: number;
	layer: SmokeRunManifestLayer;
}> {
	const manifestLayers = run.manifest.stageLayers;
	if (manifestLayers?.length) {
		return manifestLayers.map((layer) => ({
			artifactCount: layer.artifacts.length,
			layer: layer.layer,
		}));
	}

	return [
		{ artifactCount: run.trace?.layers?.understand?.artifacts?.length ?? 0, layer: "understand" },
		{ artifactCount: run.trace?.layers?.compose?.artifacts?.length ?? 0, layer: "compose" },
		{ artifactCount: run.trace?.layers?.revise?.artifacts?.length ?? 0, layer: "revise" },
	];
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

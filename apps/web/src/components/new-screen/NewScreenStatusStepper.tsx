"use client";

import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";

export function NewScreenStatusStepper({ status }: { status?: ScreenInferenceRunStatus }) {
	const layers = status?.layers ?? [
		{ label: "Understand", layer: "understand", status: "pending" },
		{ label: "Compose", layer: "compose", status: "pending" },
		{ label: "Revise", layer: "revise", status: "pending" },
	];
	const statusLabel =
		status?.error?.message ?? status?.currentMessage ?? status?.status ?? "source-ready";

	return (
		<div className="flex min-w-0 shrink-0 items-center gap-1.5">
			{layers.map((layer) => (
				<span
					className={readLayerClassName(layer.status)}
					key={layer.layer}
					title={`${layer.label}: ${layer.status}${readLayerDescription(layer) ? ` · ${readLayerDescription(layer)}` : ""}`}
				>
					{layer.label}
				</span>
			))}
			<span className="truncate text-[10px] font-medium text-muted-foreground">{statusLabel}</span>
		</div>
	);
}

function readLayerDescription(layer: unknown): string {
	if (
		typeof layer === "object" &&
		layer !== null &&
		"summary" in layer &&
		typeof layer.summary === "object" &&
		layer.summary !== null &&
		"description" in layer.summary &&
		typeof layer.summary.description === "string"
	) {
		return layer.summary.description;
	}
	return "";
}

function readLayerClassName(status: string) {
	const baseClassName =
		"rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 transition-colors";
	if (status === "completed") return `${baseClassName} border-emerald-500/40 text-emerald-700`;
	if (status === "running")
		return `${baseClassName} border-primary/50 bg-primary/[0.08] text-primary`;
	if (status === "failed") return `${baseClassName} border-destructive/50 text-destructive`;
	if (status === "skipped") return `${baseClassName} border-muted text-muted-foreground/60`;
	return `${baseClassName} border-sidebar-border text-muted-foreground`;
}

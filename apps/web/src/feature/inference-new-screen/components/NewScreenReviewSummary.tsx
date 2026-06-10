"use client";

import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";

const EXPORT_READY_RUN_STATUSES = new Set<ScreenInferenceRunStatus["status"]>([
	"applied",
	"applying",
	"approved",
	"waiting-review",
]);

export type NewScreenReviewData = {
	quality?: QualityInspectionContract;
	status?: ScreenInferenceRunStatus;
	validation?: ValidationReportContract;
};

type NewScreenReviewSummaryProps = {
	review: NewScreenReviewData;
};

export function NewScreenReviewSummary({ review }: NewScreenReviewSummaryProps) {
	const validation = review.validation;
	const quality = review.quality;

	return (
		<div className="grid gap-3 p-3">
			<ReviewBlock
				description={readValidationDescription(validation)}
				state={validation?.ok ? "ok" : validation ? "issue" : "pending"}
				title="Validation"
			/>
			<ReviewBlock
				description={readQualityDescription(quality)}
				state={quality ? readQualityState(quality) : "pending"}
				title="Quality"
			/>
			{quality?.findings?.length ? (
				<div className="grid gap-2">
					<p className="text-xs font-semibold text-muted-foreground">Issue highlights</p>
					<div className="grid gap-1.5">
						{quality.findings.slice(0, 4).map((finding) => (
							<p
								className="rounded-md border border-sidebar-border px-2 py-1.5 text-xs leading-5 text-sidebar-foreground"
								key={`${finding.code}:${finding.message}`}
							>
								{finding.message}
							</p>
						))}
					</div>
				</div>
			) : null}
			<TsxExportButton status={review.status} />
		</div>
	);
}

function TsxExportButton({ status }: { status?: ScreenInferenceRunStatus }) {
	const jobId = status?.runId;
	const isExportReady = !!jobId && EXPORT_READY_RUN_STATUSES.has(status.status);

	if (!isExportReady) {
		return (
			<Button
				className="h-8 justify-center gap-1 text-xs"
				disabled
				size="sm"
				type="button"
				variant="outline"
			>
				<Download className="size-3.5" />
				TSX Export
			</Button>
		);
	}

	return (
		<Button asChild className="h-8 justify-center gap-1 text-xs" size="sm" variant="outline">
			<a download href={`/api/inference/${encodeURIComponent(jobId)}/export`}>
				<Download className="size-3.5" />
				TSX Export
			</a>
		</Button>
	);
}

function ReviewBlock({
	description,
	state,
	title,
}: {
	description: string;
	state: "issue" | "ok" | "pending";
	title: string;
}) {
	return (
		<div className="grid gap-1 rounded-md border border-sidebar-border p-3" data-state={state}>
			<p className="truncate text-sm font-semibold">{title}</p>
			<p className="text-xs leading-5 text-muted-foreground">{description}</p>
		</div>
	);
}

function readValidationDescription(validation?: ValidationReportContract): string {
	if (!validation) return "final-result 검증 대기 중";
	const summary = readReviewSummary(validation.summary);
	return `${summary.errorCount} errors · ${summary.warningCount} warnings`;
}

function readQualityDescription(quality?: QualityInspectionContract): string {
	if (!quality) return "quality-review 대기 중";
	const summary = readReviewSummary(quality.summary);
	return `${summary.errorCount} errors · ${summary.warningCount} warnings`;
}

function readQualityState(quality: QualityInspectionContract): "issue" | "ok" {
	return readReviewSummary(quality.summary).errorCount > 0 ? "issue" : "ok";
}

function readReviewSummary(summary: { errorCount?: number; warningCount?: number } | undefined) {
	return {
		errorCount: summary?.errorCount ?? 0,
		warningCount: summary?.warningCount ?? 0,
	};
}

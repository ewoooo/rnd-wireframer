"use client";

import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";

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
			<p className="text-[11px] leading-4 text-muted-foreground">
				{review.status?.status ?? "run을 시작하면 검수 요약이 표시됩니다."}
			</p>
		</div>
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
	const Icon = state === "ok" ? CheckCircle2 : state === "issue" ? CircleAlert : CircleDashed;

	return (
		<div className="grid gap-1 rounded-md border border-sidebar-border p-3">
			<div className="flex min-w-0 items-center gap-2">
				<Icon className="size-4 text-muted-foreground" data-icon="inline-start" />
				<p className="truncate text-sm font-semibold">{title}</p>
			</div>
			<p className="text-xs leading-5 text-muted-foreground">{description}</p>
		</div>
	);
}

function readValidationDescription(validation?: ValidationReportContract): string {
	if (!validation) return "final-result 검증 대기 중";
	return `${validation.summary.errorCount} errors · ${validation.summary.warningCount} warnings`;
}

function readQualityDescription(quality?: QualityInspectionContract): string {
	if (!quality) return "quality-review 대기 중";
	return `${quality.summary.errorCount} errors · ${quality.summary.warningCount} warnings`;
}

function readQualityState(quality: QualityInspectionContract): "issue" | "ok" {
	return quality.summary.errorCount > 0 ? "issue" : "ok";
}

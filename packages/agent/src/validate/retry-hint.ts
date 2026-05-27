import type { ValidationIssue } from "@cx/types/validation";
import type { RetryHint, RetryScope } from "./types";

/**
 * 위반 이슈들을 재시도 범위별로 묶어 RetryHint[] 로 변환한다.
 * 호출자(재시도 runner)는 이걸 보고 좁힌 LLM 프롬프트를 구성한다.
 *
 * 분류 규칙:
 * - issue.nodeId가 decision id면 → decision scope
 * - issue.path가 areas[*]로 시작하면 → area scope (areaId는 data.areaId 또는 path[1])
 * - 그 외 → screen scope
 */

const SCREEN_FALLBACK_ID = "__screen__";

interface PartitionedIssues {
	byDecision: Map<string, ValidationIssue[]>;
	byArea: Map<string, ValidationIssue[]>;
	screen: ValidationIssue[];
}

function partition(issues: ValidationIssue[]): PartitionedIssues {
	const byDecision = new Map<string, ValidationIssue[]>();
	const byArea = new Map<string, ValidationIssue[]>();
	const screen: ValidationIssue[] = [];

	for (const issue of issues) {
		const decisionId = readDecisionId(issue);
		if (decisionId) {
			pushTo(byDecision, decisionId, issue);
			continue;
		}
		const areaId = readAreaId(issue);
		if (areaId) {
			pushTo(byArea, areaId, issue);
			continue;
		}
		screen.push(issue);
	}

	return { byDecision, byArea, screen };
}

function readDecisionId(issue: ValidationIssue): string | undefined {
	const fromData = issue.data?.decisionId;
	if (typeof fromData === "string") return fromData;
	if (issue.nodeId && issue.path?.[0] === "decisions") return issue.nodeId;
	return undefined;
}

function readAreaId(issue: ValidationIssue): string | undefined {
	const fromData = issue.data?.areaId;
	if (typeof fromData === "string") return fromData;
	if (issue.path?.[0] === "areas" && typeof issue.path[1] === "string") {
		return issue.path[1];
	}
	return undefined;
}

function pushTo<K>(map: Map<K, ValidationIssue[]>, key: K, issue: ValidationIssue): void {
	const list = map.get(key);
	if (list) {
		list.push(issue);
	} else {
		map.set(key, [issue]);
	}
}

function formatPromptFragment(
	scope: RetryScope,
	targetIds: string[],
	issues: ValidationIssue[],
): string {
	const header = `[retry scope=${scope}, targets=${targetIds.join(", ")}]`;
	const lines = issues.map((issue) => {
		const path = issue.path?.join(".") ?? "";
		const data = issue.data ? `\n  data: ${JSON.stringify(issue.data)}` : "";
		return `- (${issue.code}) ${issue.message}${path ? ` @${path}` : ""}${data}`;
	});
	return [header, ...lines].join("\n");
}

export function buildRetryHints(issues: ValidationIssue[]): RetryHint[] {
	const errors = issues.filter((issue) => issue.severity === "error");
	if (errors.length === 0) return [];

	const { byDecision, byArea, screen } = partition(errors);
	const hints: RetryHint[] = [];

	for (const [decisionId, group] of byDecision) {
		hints.push({
			scope: "decision",
			targetIds: [decisionId],
			issues: group,
			promptFragment: formatPromptFragment("decision", [decisionId], group),
		});
	}
	for (const [areaId, group] of byArea) {
		hints.push({
			scope: "area",
			targetIds: [areaId],
			issues: group,
			promptFragment: formatPromptFragment("area", [areaId], group),
		});
	}
	if (screen.length > 0) {
		hints.push({
			scope: "screen",
			targetIds: [SCREEN_FALLBACK_ID],
			issues: screen,
			promptFragment: formatPromptFragment("screen", [SCREEN_FALLBACK_ID], screen),
		});
	}

	return hints;
}

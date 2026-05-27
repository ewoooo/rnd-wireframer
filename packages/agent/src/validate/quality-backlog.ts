import type { QualityBacklog, QualityBacklogItem, QualityIssue, QualityReport } from "@cx/types";

const BACKLOG_OWNERS = new Set<QualityBacklogItem["owner"]>(["catalog", "component", "pattern"]);

const SEVERITY_RANK: Record<QualityIssue["severity"], number> = {
	error: 3,
	warning: 2,
	info: 1,
};

export interface CreateQualityBacklogInput {
	reports: QualityReport[];
	generatedAt: string;
	minOccurrences?: number;
}

export function createQualityBacklog(input: CreateQualityBacklogInput): QualityBacklog {
	const minOccurrences = input.minOccurrences ?? 2;
	const grouped = new Map<string, QualityBacklogItem>();

	for (const report of input.reports) {
		for (const issue of report.issues) {
			if (!isBacklogIssue(issue)) continue;
			const key = getIssueKey(issue);
			const item = grouped.get(key);
			if (item) {
				item.occurrences += 1;
				addUnique(item.sourceIds, report.sourceId);
				addUnique(item.originalCodes, issue.originalCodes?.[0]);
				addUnique(item.messages, issue.message);
				addUnique(item.nodeIds, issue.nodeId);
				if (SEVERITY_RANK[issue.severity] > SEVERITY_RANK[item.severity]) {
					item.severity = issue.severity;
				}
				continue;
			}

			grouped.set(key, {
				id: `quality-backlog-${String(grouped.size + 1).padStart(3, "0")}`,
				status: "candidate",
				owner: issue.owner,
				category: issue.category,
				severity: issue.severity,
				occurrences: 1,
				sourceIds: compact([report.sourceId]),
				originalCodes: compact([issue.originalCodes?.[0]]),
				messages: [issue.message],
				nodeIds: compact([issue.nodeId]),
			});
		}
	}

	const items: QualityBacklogItem[] = [...grouped.values()]
		.map(
			(item): QualityBacklogItem => ({
				...item,
				status: item.occurrences >= minOccurrences ? "ready" : "candidate",
			}),
		)
		.sort(compareBacklogItems);

	return {
		schemaVersion: "quality-backlog.v1",
		generatedAt: input.generatedAt,
		minOccurrences,
		summary: summarizeBacklog(items),
		items,
	};
}

function isBacklogIssue(issue: QualityIssue): issue is QualityIssue & {
	owner: QualityBacklogItem["owner"];
} {
	return BACKLOG_OWNERS.has(issue.owner as QualityBacklogItem["owner"]);
}

function getIssueKey(issue: QualityIssue) {
	return [
		issue.owner,
		issue.category,
		issue.originalCodes?.[0] ?? "unknown-code",
		normalizeMessage(issue.message),
	].join(":");
}

function normalizeMessage(message: string) {
	return message.trim().replace(/\s+/g, " ").toLowerCase();
}

function addUnique(values: string[], value: string | undefined) {
	if (!value || values.includes(value)) return;
	values.push(value);
}

function compact(values: Array<string | undefined>) {
	return values.filter((value): value is string => Boolean(value));
}

function compareBacklogItems(left: QualityBacklogItem, right: QualityBacklogItem) {
	return (
		statusRank(right.status) - statusRank(left.status) ||
		right.occurrences - left.occurrences ||
		SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity] ||
		left.owner.localeCompare(right.owner) ||
		left.id.localeCompare(right.id)
	);
}

function statusRank(status: QualityBacklogItem["status"]) {
	return status === "ready" ? 1 : 0;
}

function summarizeBacklog(items: QualityBacklogItem[]): QualityBacklog["summary"] {
	const summary: QualityBacklog["summary"] = {
		candidateCount: 0,
		readyCount: 0,
		owners: {},
	};

	for (const item of items) {
		if (item.status === "ready") {
			summary.readyCount += 1;
		} else {
			summary.candidateCount += 1;
		}
		summary.owners[item.owner] = (summary.owners[item.owner] ?? 0) + 1;
	}

	return summary;
}

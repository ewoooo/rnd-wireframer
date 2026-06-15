// component-proposal artifact 백로그 — 잡들이 남긴 비파괴 제안을 모아 빈도순으로 출력한다.
// 승격 결정의 입력이다: 빈도가 높은 제안부터 .claude/skills/promote-proposal 절차로 검토한다.
//
// 사용법: pnpm proposal:backlog [--json]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateComponentProposal } from "../../packages/validation/src/public/validators";
import { aggregateProposals, type ProposalDocument } from "../proposal-aggregation/aggregate";

const ROOT = resolve(import.meta.dirname, "..", "..");
const JOBS_ROOT = join(ROOT, ".data", "inference-jobs");

type CollectedDocument = { jobId: string; document: ProposalDocument };

function collectProposalDocuments(): { collected: CollectedDocument[]; invalid: string[] } {
	if (!existsSync(JOBS_ROOT)) return { collected: [], invalid: [] };
	const collected: CollectedDocument[] = [];
	const invalid: string[] = [];
	for (const jobId of readdirSync(JOBS_ROOT)) {
		const artifactPath = join(JOBS_ROOT, jobId, "context", "component-proposal.json");
		if (!existsSync(artifactPath)) continue;
		const document = JSON.parse(readFileSync(artifactPath, "utf8")) as ProposalDocument;
		// 스키마/품질 rule(개수 상한 등)을 위반한 artifact는 백로그에서 제외하고 보고만 한다.
		const report = validateComponentProposal(document);
		if (report.issues.some((issue) => issue.severity === "error")) {
			invalid.push(jobId);
			continue;
		}
		collected.push({ jobId, document });
	}
	return { collected, invalid };
}

function main() {
	const asJson = process.argv.includes("--json");
	const { collected, invalid } = collectProposalDocuments();
	const backlog = aggregateProposals(collected.map((item) => item.document));

	if (asJson) {
		console.log(JSON.stringify({ backlog, invalidJobs: invalid, scannedJobs: collected.length }));
		return;
	}

	console.log(
		`proposal-backlog: ${collected.length} jobs with proposals, ${backlog.length} distinct types` +
			(invalid.length > 0 ? `, ${invalid.length} invalid artifacts skipped` : ""),
	);
	for (const entry of backlog) {
		console.log(`\n${entry.proposedComponentType}  ×${entry.count}`);
		console.log(`  kind: ${entry.kinds.join(", ") || "-"}`);
		console.log(`  nearest: ${entry.nearestCatalogMatches.join(", ") || "-"}`);
		console.log(`  source evidence: ${entry.evidence.slice(0, 5).join(", ") || "-"}`);
		console.log(`  reference evidence: ${entry.referenceEvidence.slice(0, 5).join(", ") || "-"}`);
		if (entry.rationales[0]) console.log(`  rationale: ${entry.rationales[0]}`);
	}
	if (backlog.length === 0) console.log("(no proposals yet — run inference jobs first)");
}

main();

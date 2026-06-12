// candidate(kiki-draft) → stable(kiki-barrel) 승격.
// 정본은 packages/external/src/catalog.source.ts의 source 필드이며, 이 스크립트는
// 그 필드를 바꾸고 `pnpm sync:catalog`로 catalog/registry 생성물을 재생성한다.
//
// 사용법:
//   pnpm promote:component               # candidate 목록
//   pnpm promote:component kiki.<Name>   # 해당 컴포넌트 승격

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
	getComponentCatalogStatus,
	listCandidateComponentEntries,
} from "../packages/external/src/resolver";

const ROOT = resolve(import.meta.dirname, "..");
const CATALOG_SOURCE = join(ROOT, "packages", "external", "src", "catalog.source.ts");

function listCandidates(): void {
	const candidates = listCandidateComponentEntries();
	console.log(`Candidate (kiki-draft) components: ${candidates.length}`);
	for (const entry of candidates) {
		console.log(`- ${entry.type}\t${entry.label}`);
	}
}

function promote(type: string): void {
	const status = getComponentCatalogStatus(type);
	if (status === undefined) {
		console.error(`'${type}' is not in the catalog. Add it to catalog.source.ts first.`);
		process.exitCode = 1;
		return;
	}
	if (status === "stable") {
		console.error(`'${type}' is already stable.`);
		process.exitCode = 1;
		return;
	}

	const source = readFileSync(CATALOG_SOURCE, "utf8");
	// serializer/biome 출력 형태: `type: "kiki.X",` 다음 줄이 `source: "kiki-draft",`.
	const escaped = JSON.stringify(type).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`(type: ${escaped},\\s*\\n\\s*source: )"kiki-draft"`);
	if (!pattern.test(source)) {
		console.error(
			`Could not locate 'source: "kiki-draft"' for '${type}' in catalog.source.ts — promote manually.`,
		);
		process.exitCode = 1;
		return;
	}
	writeFileSync(CATALOG_SOURCE, source.replace(pattern, `$1"kiki-barrel"`));
	execFileSync("pnpm", ["sync:catalog"], { cwd: ROOT, stdio: "inherit" });

	const regenerated = readFileSync(
		join(ROOT, "packages", "external", "src", "catalog.generated.ts"),
		"utf8",
	);
	const name = type.replace(/^kiki\./, "");
	if (!regenerated.includes(`label: "[kiki] ${name}"`)) {
		throw new Error(
			`Promotion of '${type}' did not land in catalog.generated.ts — check sync output.`,
		);
	}
	console.log(`Promoted ${type}: kiki-draft -> kiki-barrel (stable).`);
}

const type = process.argv[2];
if (type) promote(type);
else listCandidates();

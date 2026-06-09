// NOTE: 카탈로그 mutation/promote는 자동생성 + source 유도 status 체제로 전환되며 폐기되었다.
// candidate→stable promote의 진짜 재작성(kiki 소스 draft→barrel, sync 레이어)은
// scripts/sync-catalog 생성기 도입 후 별도 계획에서 수행한다. (spec 2·3·10절)
// 현재 이 스크립트는 read-only candidate 리스터로만 유지한다.

import { getComponentCatalogStatus, listCandidateComponentEntries } from "@cx/external/resolver";

/**
 * Read-only candidate (kiki-draft) lister.
 * Promotion (candidate -> stable) now happens at the sync layer (deferred);
 * this command no longer mutates the catalog.
 */
function main() {
	const type = process.argv[2];
	if (type) {
		const status = getComponentCatalogStatus(type);
		if (status === undefined) {
			console.error(`'${type}' is not in the catalog.`);
		} else {
			console.error(
				`'${type}' status: ${status}. Promotion is no longer performed here — ` +
					"it happens at the sync layer (kiki draft -> barrel), which is deferred.",
			);
		}
		process.exitCode = 1;
		return;
	}

	const candidates = listCandidateComponentEntries();
	console.log(`Candidate (kiki-draft) components: ${candidates.length}`);
	for (const entry of candidates) {
		console.log(`- ${entry.type}\t${getComponentCatalogStatus(entry.type)}\t${entry.label}`);
	}
}

main();

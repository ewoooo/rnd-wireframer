/**
 * 로컬 @cx/external 에서 cmp 하나를 제거한다.
 *
 *   tsx scripts/sync-catalog/delete-component.ts <kiki.Name|Name>
 *
 * 컴포넌트 디렉터리 삭제 → catalog.source 엔트리 prune → catalog.generated/registry 재생성.
 * sync:kiki(kiki→repo)의 역연산이며, round-trip 검증용: 삭제 후 pnpm sync:kiki 로 복원된다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { catalogSource } from "../../packages/external/src/catalog.source";
import { buildCatalogSourceModule } from "./lib.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const EXTERNAL_SRC = join(REPO_ROOT, "packages", "external", "src");

const arg = process.argv[2];
if (!arg) {
	console.error("usage: tsx scripts/sync-catalog/delete-component.ts <kiki.Name|Name>");
	process.exit(1);
}

const key = arg.startsWith("kiki.") ? arg : `kiki.${arg}`;
const name = key.slice("kiki.".length);
if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
	console.error(`잘못된 컴포넌트 이름: ${arg}`);
	process.exit(1);
}
if (!catalogSource[key]) {
	console.error(`catalog.source 에 엔트리 없음: ${key}`);
	process.exit(1);
}

// 0) 의존성 가드 — 다른 컴포넌트가 import 중이면 삭제 시 dangling import로 빌드가 터진다.
//    (kiki 컴포넌트끼리 형제 import: `from "../<Name>/..."`) → 차단하고 의존처를 알려준다.
const componentsDir = join(EXTERNAL_SRC, "components");
const importRe = new RegExp(`from\\s+["']\\.\\./${name}/`);
const dependents = readdirSync(componentsDir, { withFileTypes: true })
	.filter((d) => d.isDirectory() && d.name !== name)
	.filter((d) => {
		const tsx = join(componentsDir, d.name, `${d.name}.tsx`);
		return existsSync(tsx) && importRe.test(readFileSync(tsx, "utf8"));
	})
	.map((d) => d.name);
if (dependents.length > 0) {
	console.error(`삭제 불가: ${name}은(는) 다음 컴포넌트가 사용 중입니다 — ${dependents.join(", ")}`);
	process.exit(2);
}

// 1) 컴포넌트 디렉터리 삭제
const dir = join(EXTERNAL_SRC, "components", name);
if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });

// 2) catalog.source 엔트리 prune (나머지는 그대로 보존)
const next = Object.fromEntries(Object.entries(catalogSource).filter(([k]) => k !== key));
const sourcePath = join(EXTERNAL_SRC, "catalog.source.ts");
writeFileSync(sourcePath, buildCatalogSourceModule(next));
execFileSync("pnpm", ["exec", "biome", "check", "--write", sourcePath], {
	cwd: REPO_ROOT,
	stdio: "ignore",
});

// 3) catalog.generated.ts + registry.generated.ts 재생성 (추론·렌더가 읽는 catalog 갱신)
execFileSync("pnpm", ["sync:catalog"], { cwd: REPO_ROOT, stdio: "inherit" });

console.log(`✓ 삭제 완료 — ${key}`);

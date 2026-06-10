import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// consumer boundary 고정: 폐기된 layout subpath를 외부 패키지가 import하지 않는다.
// vitest는 워크트리 루트에서 실행되므로 cwd가 repo root.
const REPO_ROOT = process.cwd();
const FORBIDDEN = /@cx\/layout\/(catalog|components|mutations|contract)\b/;
const SCAN_DIRS = ["packages", "apps"];
const SKIP = new Set(["node_modules", ".next", "dist", ".turbo", "layout"]);

function walk(dir: string, out: string[]): string[] {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return out;
	}
	for (const name of entries) {
		if (SKIP.has(name)) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			// packages/layout 자체는 제외 (내부 상대경로 사용)
			if (full.includes(`${join("packages", "layout")}`)) continue;
			walk(full, out);
		} else if (/\.(ts|tsx)$/.test(name)) {
			out.push(full);
		}
	}
	return out;
}

describe("external-thin: consumer boundary", () => {
	it("외부 소비자가 폐기 subpath(@cx/layout/{catalog,components,mutations,contract})를 import하지 않는다", () => {
		const files = SCAN_DIRS.flatMap((d) => walk(join(REPO_ROOT, d), []));
		const offenders = files.filter((f) => FORBIDDEN.test(readFileSync(f, "utf8")));
		expect(offenders.map((f) => f.replace(REPO_ROOT, ""))).toEqual([]);
	});
});

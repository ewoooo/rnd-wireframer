import type { ComponentType } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";
import { listRegisteredLayoutPatternComponents } from "../components/patterns/registry";

describe("area variant dedup report", () => {
	it("prints duplicate groups", () => {
		const entries = listRegisteredLayoutPatternComponents();
		// 3 children so divider:"contents" inserts divider rows BETWEEN children —
		// a single child masks divider/section differences and over-groups.
		const children = [
			createElement("div", { key: "a", "data-fixture": "a" }, "A"),
			createElement("div", { key: "b", "data-fixture": "b" }, "B"),
			createElement("div", { key: "c", "data-fixture": "c" }, "C"),
		];
		const byKey = new Map<string, string[]>();
		for (const entry of entries) {
			if (!entry.layoutId.startsWith("layout.area.")) continue;
			const Comp = entry.component as ComponentType<Record<string, unknown>>;
			let markup = "";
			try {
				markup = renderToStaticMarkup(
					createElement(Comp, { metadata: { id: "fx", title: "T" }, props: {} }, ...children),
				);
			} catch (e) {
				console.log("RENDER ERROR:", entry.layoutId, String(e));
				continue;
			}
			const propKeys = Object.keys(entry.pattern?.props ?? {})
				.sort()
				.join(",");
			const key = `${markup}::props[${propKeys}]`;
			byKey.set(key, [...(byKey.get(key) ?? []), entry.layoutId]);
		}
		for (const [, ids] of byKey) {
			if (ids.length > 1) console.log("DUP GROUP:", ids.join("  "));
		}
	});
});

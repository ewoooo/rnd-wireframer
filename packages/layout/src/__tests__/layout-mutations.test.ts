import {
	createLayoutPattern,
	deleteLayoutPattern,
	readLayoutPattern,
	updateLayoutPattern,
	upsertLayoutPattern,
} from "@cx/layout/mutations";
import type { PatternStore, PatternStorePattern } from "@cx/layout/types";
import { describe, expect, it } from "vitest";

describe("@cx/layout mutations", () => {
	it("creates, reads, updates, upserts, and deletes patterns without mutating input store", () => {
		const emptyStore: PatternStore = { patterns: [] };
		const pattern = testPattern("layout.area.testArea");

		const created = createLayoutPattern(emptyStore, pattern);
		expect(created.ok).toBe(true);
		if (!created.ok) throw new Error("create failed");
		expect(emptyStore.patterns).toHaveLength(0);
		expect(created.store.patterns).toHaveLength(1);
		expect(created.changes).toHaveLength(1);
		expect(created.changes[0]).toMatchObject({ type: "create", id: "layout.area.testArea" });

		const read = readLayoutPattern(created.store, { id: "layout.area.testArea", target: "area" });
		expect(read.ok).toBe(true);
		if (!read.ok) throw new Error("read failed");
		expect(read.pattern.name).toBe("Test area");

		const updated = updateLayoutPattern(created.store, {
			id: "layout.area.testArea",
			patch: {
				name: "Updated test area",
				variants: {
					default: {
						direction: "horizontal",
						gap: 8,
					},
				},
			},
		});
		expect(updated.ok).toBe(true);
		if (!updated.ok) throw new Error("update failed");
		expect(updated.store.patterns[0]?.name).toBe("Updated test area");
		expect(created.store.patterns[0]?.name).toBe("Test area");
		expect(updated.changes[0]).toMatchObject({ type: "update", id: "layout.area.testArea" });

		const upserted = upsertLayoutPattern(updated.store, {
			...pattern,
			name: "Upserted test area",
		});
		expect(upserted.ok).toBe(true);
		if (!upserted.ok) throw new Error("upsert failed");
		expect(upserted.pattern?.name).toBe("Upserted test area");
		expect(upserted.changes[0]).toMatchObject({ type: "upsert", id: "layout.area.testArea" });

		const deleted = deleteLayoutPattern(upserted.store, { id: "layout.area.testArea" });
		expect(deleted.ok).toBe(true);
		if (!deleted.ok) throw new Error("delete failed");
		expect(deleted.store.patterns).toHaveLength(0);
		expect(upserted.store.patterns).toHaveLength(1);
		expect(deleted.changes[0]).toMatchObject({ type: "delete", id: "layout.area.testArea" });
	});

	it("returns typed issues for duplicate, missing, and schema-invalid mutations", () => {
		const pattern = testPattern("layout.area.testArea");
		const store: PatternStore = { patterns: [pattern] };

		const duplicate = createLayoutPattern(store, pattern);
		expect(duplicate.ok).toBe(false);
		if (duplicate.ok) throw new Error("duplicate unexpectedly succeeded");
		expect(duplicate.issues[0]?.code).toBe("duplicate-pattern-id");

		const missing = updateLayoutPattern(store, {
			id: "layout.area.missingArea",
			patch: { name: "Missing" },
		});
		expect(missing.ok).toBe(false);
		if (missing.ok) throw new Error("missing update unexpectedly succeeded");
		expect(missing.issues[0]?.code).toBe("pattern-not-found");

		const invalid = createLayoutPattern(
			{ patterns: [] },
			{
				...testPattern("layout.area.badArea"),
				defaultVariant: "compact",
			},
		);
		expect(invalid.ok).toBe(false);
		if (invalid.ok) throw new Error("invalid create unexpectedly succeeded");
		expect(invalid.issues[0]?.code).toBe("schema-invalid");
		expect(invalid.issues[0]?.path).toContain("defaultVariant");
	});
});

function testPattern(id: string): PatternStorePattern {
	return {
		id,
		target: "area",
		name: "Test area",
		defaultVariant: "default",
		variants: {
			default: {
				direction: "vertical",
				gap: 12,
			},
		},
	};
}

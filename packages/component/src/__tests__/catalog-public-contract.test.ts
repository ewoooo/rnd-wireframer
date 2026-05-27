import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import {
	componentCatalog,
	createComponentCatalogEntry,
	deleteComponentCatalogEntry,
	promoteComponentCatalogEntry,
	readComponentCatalogEntry,
	updateComponentCatalogEntry,
	upsertComponentCatalogEntry,
} from "../catalog";
import { assembleComponentCatalog } from "../internal/assembly";
import type { ComponentCatalogEntry, InternalComponentCatalog } from "../public/types";

describe("@cx/components public catalog contract", () => {
	it("assembles stable and candidate registries into one status-free catalog", () => {
		const registry = {
			StableCard: {
				type: "StableCard",
				source: "react-component",
				version: "1.0.0",
				description: "Approved card.",
				props: {},
				status: "stable",
			},
			GeneratedCard: {
				type: "GeneratedCard",
				source: "react-component",
				version: "0.1.0",
				description: "Generated card candidate.",
				props: {},
				status: "candidate",
			},
		} satisfies InternalComponentCatalog;

		const publicCatalog = assembleComponentCatalog(registry);

		expect(Object.keys(publicCatalog).sort()).toEqual(["GeneratedCard", "StableCard"]);
		expect(publicCatalog.StableCard).not.toHaveProperty("status");
		expect(publicCatalog.GeneratedCard).not.toHaveProperty("status");
	});

	it("does not expose status metadata from the public component catalog", () => {
		for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
			expect(entry).not.toHaveProperty("status");
		}
	});

	it("keeps enum props explicit about allowed values", () => {
		for (const [componentType, entry] of Object.entries(componentCatalog)) {
			for (const [propName, prop] of Object.entries(entry.props)) {
				if (prop.type !== "enum") continue;

				expect(prop.values, `${componentType}.${propName} must define enum values`).toBeDefined();
				expect(
					prop.values?.length,
					`${componentType}.${propName} must define enum values`,
				).toBeGreaterThan(0);
			}
		}
	});

	it("does not expose implementation status directories as package subpaths", () => {
		const exportedSubpaths = Object.keys(packageJson.exports);

		expect(exportedSubpaths).toContain("./catalog");
		expect(exportedSubpaths).toContain("./mutations");
		expect(exportedSubpaths).toContain("./resolver");
		expect(exportedSubpaths).toContain("./types");
		expect(exportedSubpaths).not.toContain("./components");
		expect(exportedSubpaths).not.toContain("./candidates");
	});

	it("manages entries through pure CRUD mutation results", () => {
		const emptyRegistry: InternalComponentCatalog = {};
		const entry: ComponentCatalogEntry = {
			type: "GeneratedCard",
			source: "react-component",
			version: "0.1.0",
			description: "Generated card candidate.",
			props: {
				variant: {
					type: "enum",
					role: "styleVariant",
					values: ["default", "highlight"],
				},
			},
		};

		const created = createComponentCatalogEntry(emptyRegistry, {
			status: "candidate",
			entry,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) throw new Error("create failed");
		expect(emptyRegistry.GeneratedCard).toBeUndefined();
		expect(created.registry.GeneratedCard?.status).toBe("candidate");
		expect(created.catalog.GeneratedCard).not.toHaveProperty("status");
		expect(created.changes[0]).toMatchObject({
			type: "create",
			componentType: "GeneratedCard",
		});

		const duplicate = createComponentCatalogEntry(created.registry, {
			status: "candidate",
			entry,
		});
		expect(duplicate.ok).toBe(false);
		if (duplicate.ok) throw new Error("duplicate unexpectedly succeeded");
		expect(duplicate.issues[0]?.code).toBe("duplicate-component-type");

		const read = readComponentCatalogEntry(created.registry, { type: "GeneratedCard" });
		expect(read.ok).toBe(true);
		if (!read.ok) throw new Error("read failed");
		expect(read.entry.status).toBe("candidate");

		const updated = updateComponentCatalogEntry(created.registry, {
			type: "GeneratedCard",
			patch: {
				description: "Updated generated card candidate.",
			},
		});
		expect(updated.ok).toBe(true);
		if (!updated.ok) throw new Error("update failed");
		expect(updated.entry?.description).toBe("Updated generated card candidate.");
		expect(updated.entry?.status).toBe("candidate");

		const promoted = promoteComponentCatalogEntry(updated.registry, { type: "GeneratedCard" });
		expect(promoted.ok).toBe(true);
		if (!promoted.ok) throw new Error("promote failed");
		expect(promoted.entry?.status).toBe("stable");
		expect(promoted.catalog.GeneratedCard).not.toHaveProperty("status");

		const stablePromote = promoteComponentCatalogEntry(promoted.registry, {
			type: "GeneratedCard",
		});
		expect(stablePromote.ok).toBe(false);
		if (stablePromote.ok) throw new Error("stable promote unexpectedly succeeded");
		expect(stablePromote.issues[0]?.code).toBe("status-not-candidate");

		const upserted = upsertComponentCatalogEntry(promoted.registry, {
			status: "candidate",
			entry: {
				...entry,
				description: "Upserted candidate.",
			},
		});
		expect(upserted.ok).toBe(true);
		if (!upserted.ok) throw new Error("upsert failed");
		expect(upserted.entry?.description).toBe("Upserted candidate.");
		expect(upserted.entry?.status).toBe("candidate");

		const deleted = deleteComponentCatalogEntry(upserted.registry, { type: "GeneratedCard" });
		expect(deleted.ok).toBe(true);
		if (!deleted.ok) throw new Error("delete failed");
		expect(deleted.registry.GeneratedCard).toBeUndefined();
		expect(deleted.changes[0]).toMatchObject({
			type: "delete",
			componentType: "GeneratedCard",
		});
	});

	it("returns schema issues from CRUD mutations without changing the registry", () => {
		const emptyRegistry: InternalComponentCatalog = {};
		const invalid = createComponentCatalogEntry(emptyRegistry, {
			status: "candidate",
			entry: {
				type: "InvalidCard",
				source: "react-component",
				version: "0.1.0",
				props: {
					variant: {
						type: "string",
						role: "styleVariant",
						variantTokens: {
							default: { surface: "color.surface" },
						},
					},
				},
			},
		});

		expect(invalid.ok).toBe(false);
		if (invalid.ok) throw new Error("invalid create unexpectedly succeeded");
		expect(invalid.issues[0]?.code).toBe("variantTokens.requires-enum");
		expect(emptyRegistry.InvalidCard).toBeUndefined();
	});
});

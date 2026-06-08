import { describe, expect, it } from "vitest";
import { prepareSourceFile } from "@/server/source-file";

describe("prepareSourceFile", () => {
	it("prepares uploaded markdown sources from data/client-imports", async () => {
		const prepared = await prepareSourceFile({
			source: {
				path: "data/client-imports/web-upload/20260604/NOVA-PRDD-PG-007-0.md",
			},
		});

		expect(prepared?.source).toEqual({
			path: "data/client-imports/web-upload/20260604/NOVA-PRDD-PG-007-0.md",
		});
		expect(prepared?.rawMarkdown).toContain("PRDD");
		expect(prepared?.sourceSpec).toMatchObject({
			schemaVersion: "source-spec.v0.1",
			sourceImport: {
				importId: "web-upload",
				sourceKind: "prdd-markdown-bundle",
			},
		});
	});

	it("rejects non client-import paths", async () => {
		await expect(
			prepareSourceFile({
				source: {
					path: "README.md",
				},
			}),
		).rejects.toThrow("source.path must be under data/client-imports");
	});
});

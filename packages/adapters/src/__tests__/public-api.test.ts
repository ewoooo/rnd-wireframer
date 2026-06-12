import {
	ADAPTER_PACKAGE_NAME,
	ADAPTER_PUBLIC_SUBPATHS,
	type AdapterPublicSubpath,
} from "@cx/adapters";
import { describe, expect, it } from "vitest";

describe("@cx/adapters public API", () => {
	it("exposes only bounded adapter subpath names from the root", () => {
		const puckSubpath: AdapterPublicSubpath = "puck";

		expect(ADAPTER_PACKAGE_NAME).toBe("@cx/adapters");
		expect(ADAPTER_PUBLIC_SUBPATHS).toEqual(["markdown", "table", "puck"]);
		expect(puckSubpath).toBe("puck");
	});
});

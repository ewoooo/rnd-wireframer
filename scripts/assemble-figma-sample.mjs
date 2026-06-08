// Spike: assemble a self-contained .generated.js for the bridge plugin (JSON → Figma tab).
// Reuses generator-core.js from the previous repo's figma-screen-sync plugin.
// Builds ONE sample screen (NOVA-PRDD-PG-001-0) as: page frame > area frames > leaf instances.
// Run: node scripts/assemble-figma-sample.mjs
import { readFileSync, writeFileSync } from "node:fs";

const GENERATOR_CORE = new URL("../packages/figma-screen-sync/generator-core.js", import.meta.url);
const core = readFileSync(GENERATOR_CORE, "utf8");

// No token bindings in this spike — raw values only. Instances don't need tokens.
// Exception: generator-core's FILL fallback resolves this token transiently while a
// FILL-width frame has no parent yet (it's re-applied to FILL after append).
const DS_TOKENS = {
	foundation: { dimension: { size: { "screen-content-width": { value: 375 } } } },
};

const group = (id, layout, children) => ({ kind: "group", id, layout, visual: { cornerRadius: 0, fill: null, stroke: null, shadow: null }, children });
const ref = (id, component, props) => ({ kind: "ref", id, component, props });

const col = (extra = {}) => ({
	mode: "VERTICAL",
	primaryAxisSizingMode: "AUTO",
	counterAxisSizingMode: "AUTO",
	primaryAxisAlignItems: "MIN",
	counterAxisAlignItems: "MIN",
	paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
	itemSpacing: 0,
	width: "FILL",
	height: "HUG",
	...extra,
});

const COMPONENT_SPEC = {
	$schema: "component-spec-v1",
	name: "page/nova-prdd-pg-001-0",
	category: "page",
	description: "Spike: 상품 상세 핵심 요약 탐색",
	base: {
		layout: { mode: "VERTICAL", primaryAxisSizingMode: "FIXED", counterAxisSizingMode: "FIXED", primaryAxisAlignItems: "MIN", counterAxisAlignItems: "MIN", paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, itemSpacing: 0, width: 375, height: 812 },
		visual: { cornerRadius: 0, fill: "#ffffff", stroke: null, shadow: null },
		children: [
			// props = real Figma variant axes (from introspect). Text content deferred (option a).
			group("NOVA-PRDD-PG-001-0__area0", col(), [
				// AppBar variant axes: LeftItem/Title/Logo/RightItem (On/Off)
				ref("d-appbar-1", "AppBar", { LeftItem: "On", Title: "On", Logo: "Off" }),
			]),
			group("screen-contents-section-1", col({ paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, itemSpacing: 12 }), [
				group("NOVA-PRDD-PG-001-0__area1", col({ itemSpacing: 12 }), [
					// CardSummary: not in DS → auto fallback to plain frame layer (props ignored)
					ref("d-card-summary-1", "CardSummary", {}),
					ref("d-badge-status-1", "Badge", { Type: "Blue" }),
					// TextButton: only "Property 1" variant exists; label/underline have no mapping
					ref("d-text-button-origin-1", "TextButton", {}),
					ref("d-list-text-info-1", "ListText", { Table: "on" }),
				]),
			]),
		],
	},
};

const out = [
	"// AUTO-GENERATED spike — paste into bridge plugin (JSON → Figma) and Run.",
	`const DS_TOKENS = ${JSON.stringify(DS_TOKENS, null, 2)};`,
	`const COMPONENT_SPEC = ${JSON.stringify(COMPONENT_SPEC, null, 2)};`,
	"",
	core,
	"",
	"(async () => {",
	"  try {",
	"    await generateComponentSet(COMPONENT_SPEC, DS_TOKENS);",
	"    figma.notify('✓ sample screen exported');",
	"  } catch (e) {",
	"    console.error('export error:', e);",
	"    figma.notify('export error: ' + (e && e.message ? e.message : e), { error: true });",
	"  }",
	"})();",
	"",
].join("\n");

const dest = "/Users/plusx/Documents/GitHub/rnd-wireframer/scripts/figma-export-sample.generated.js";
writeFileSync(dest, out, "utf8");
console.log("written:", dest, "(" + out.length + " bytes)");

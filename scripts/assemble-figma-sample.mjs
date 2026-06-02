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
			group("NOVA-PRDD-PG-001-0__area0", col(), [
				ref("d-appbar-1", "AppBar", { title: "상품 상세 핵심 요약 탐색", showBack: true, showLogo: false }),
			]),
			group("screen-contents-section-1", col({ paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, itemSpacing: 12 }), [
				group("NOVA-PRDD-PG-001-0__area1", col({ itemSpacing: 12 }), [
					ref("d-card-summary-1", "CardSummary", { title: "iPhone 16 Pro", subText: "Apple / 스마트폰 / 월 50,000원" }),
					ref("d-badge-status-1", "Badge", { variant: "blue" }),
					ref("d-text-button-origin-1", "TextButton", { label: "상품정보 자세히 보기", underline: true }),
					ref("d-list-text-info-1", "ListText", { title: "혜택", subText: "T 우주패스 제휴 혜택 제공", table: "on" }),
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

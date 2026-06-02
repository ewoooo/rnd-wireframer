// Regenerate apps/web/src/lib/figma-export/generator-core-source.ts from the plugin's
// generator-core.js (embeds it as a string so the app can assemble plugin build code).
// Run: node scripts/gen-generator-core-source.mjs
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("../packages/figma-screen-sync/generator-core.js", import.meta.url), "utf8");
const out =
	"// AUTO-GENERATED from packages/figma-screen-sync/generator-core.js — do not edit by hand.\n" +
	"// Regenerate: node scripts/gen-generator-core-source.mjs\n" +
	"export const GENERATOR_CORE_SOURCE = " + JSON.stringify(src) + ";\n";
writeFileSync(new URL("../apps/web/src/lib/figma-export/generator-core-source.ts", import.meta.url), out);
console.log("wrote generator-core-source.ts:", out.length, "bytes");

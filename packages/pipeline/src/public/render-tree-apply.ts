import type { RenderTreeContract } from "@cx/schema";
import {
	type RenderTreeToTablesOptions,
	renderTreeToTableGenerationResult,
} from "./render-tree-to-tables";
import {
	type GenerationTableData,
	type MergeGeneratedTablesOptions,
	type MergeGeneratedTablesResult,
	mergeTableGenerationResultIntoTables,
} from "./table-merge";

export type MergeRenderTreeIntoTablesOptions = MergeGeneratedTablesOptions &
	RenderTreeToTablesOptions;

export type MergeRenderTreeIntoTablesResult = MergeGeneratedTablesResult & {
	warnings: string[];
};

export function mergeRenderTreeIntoTables(
	tables: GenerationTableData,
	renderTree: RenderTreeContract,
	options: MergeRenderTreeIntoTablesOptions = {},
): MergeRenderTreeIntoTablesResult {
	const decomposed = renderTreeToTableGenerationResult(renderTree, options);
	const merged = mergeTableGenerationResultIntoTables(
		tables,
		decomposed.tableGenerationResult,
		options,
	);

	return {
		...merged,
		warnings: decomposed.warnings,
	};
}

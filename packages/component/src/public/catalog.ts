import { assembleComponentCatalog } from "../internal/assembly";
import { auditComponentCatalog as auditCatalog } from "../internal/audit";
import { internalComponentCatalog } from "../internal/registry";
import { createComponentCatalogEntry } from "./mutations";
import { getComponentCatalogEntry } from "./resolver";
import type { ComponentCatalogListOptions, CreateComponentCandidateInput } from "./types";

export type { CatalogAuditIssue } from "../internal/audit";
export {
	createComponentCatalogEntry,
	deleteComponentCatalogEntry,
	promoteComponentCatalogEntry,
	readComponentCatalogEntry,
	updateComponentCatalogEntry,
	upsertComponentCatalogEntry,
} from "./mutations";
export {
	componentCatalogAliases,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
	getComponentPropContract,
	listCandidateComponentEntries,
} from "./resolver";
export type {
	ComponentCatalog,
	ComponentCatalogChange,
	ComponentCatalogChangeType,
	ComponentCatalogEntry,
	ComponentCatalogIssue,
	ComponentCatalogIssueCode,
	ComponentCatalogListOptions,
	ComponentCatalogMutationResult,
	ComponentCatalogReadResult,
	ComponentCatalogSource,
	ComponentCatalogStatus,
	ComponentPropContract,
	ComponentPropRole,
	ComponentPropType,
	ComponentUsageContract,
	CreateComponentCandidateInput,
	CreateComponentCatalogEntryInput,
	DeleteComponentCatalogEntryInput,
	InternalComponentCatalog,
	InternalComponentCatalogEntry,
	PromoteComponentCatalogEntryInput,
	ReadComponentCatalogEntryInput,
	RenderTreeNodeKind,
	TokenRole,
	TokenSlot,
	UpdateComponentCatalogEntryInput,
	UpsertComponentCatalogEntryInput,
} from "./types";

export const componentCatalog = assembleComponentCatalog(internalComponentCatalog);

export function createCandidate(input: CreateComponentCandidateInput) {
	return createComponentCatalogEntry(internalComponentCatalog, {
		status: "candidate",
		entry: input.entry,
	});
}

export function getEntry(id: string) {
	return getComponentCatalogEntry(id);
}

export function listCatalog(options: ComponentCatalogListOptions = {}) {
	const catalog = assembleComponentCatalog(filterRegistry(options));
	return Object.values(catalog);
}

export function listCatalogIds(options: ComponentCatalogListOptions = {}) {
	return Object.keys(filterRegistry(options)).sort();
}

export function auditComponentCatalog() {
	return auditCatalog(componentCatalog);
}

function filterRegistry(options: ComponentCatalogListOptions) {
	if (!options.status) return internalComponentCatalog;
	return Object.fromEntries(
		Object.entries(internalComponentCatalog).filter(([, entry]) => entry.status === options.status),
	);
}

import { assembleComponentCatalog } from "../internal/assembly";
import { auditComponentCatalog as auditCatalog } from "../internal/audit";
import { internalComponentCatalog } from "../internal/registry";

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
	ComponentCatalogMutationResult,
	ComponentCatalogReadResult,
	ComponentCatalogSource,
	ComponentCatalogStatus,
	ComponentPropContract,
	ComponentPropRole,
	ComponentPropType,
	ComponentUsageContract,
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

export function auditComponentCatalog() {
	return auditCatalog(componentCatalog);
}

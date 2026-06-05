import type {
	ComponentCatalogChange,
	ComponentCatalogEntry,
	ComponentCatalogIssue,
	ComponentCatalogMutationResult,
	ComponentCatalogReadResult,
	CreateComponentCatalogEntryInput,
	DeleteComponentCatalogEntryInput,
	InternalComponentCatalog,
	InternalComponentCatalogEntry,
	PromoteComponentCatalogEntryInput,
	ReadComponentCatalogEntryInput,
	UpdateComponentCatalogEntryInput,
	UpsertComponentCatalogEntryInput,
} from "../public/types";
import { assembleComponentCatalog } from "./assembly";
import { auditComponentCatalog, failure } from "./audit";

export function readEntry(
	registry: InternalComponentCatalog,
	input: ReadComponentCatalogEntryInput,
): ComponentCatalogReadResult {
	const entry = registry[input.type];
	if (!entry) {
		return failure("component-not-found", `component '${input.type}' was not found`);
	}
	return { ok: true, entry };
}

export function createEntry(
	registry: InternalComponentCatalog,
	input: CreateComponentCatalogEntryInput,
): ComponentCatalogMutationResult {
	if (registry[input.entry.type]) {
		return failure("duplicate-component-type", `component '${input.entry.type}' already exists`);
	}

	const parsed = validateEntry(input.entry);
	if (parsed.ok === false) return { ok: false, issues: parsed.issues };

	const nextEntry = { ...parsed.entry, status: input.status };
	const nextRegistry = { ...registry, [nextEntry.type]: nextEntry };
	return mutationSuccess(nextRegistry, nextEntry, {
		type: "create",
		componentType: nextEntry.type,
		after: nextEntry,
	});
}

export function updateEntry(
	registry: InternalComponentCatalog,
	input: UpdateComponentCatalogEntryInput,
): ComponentCatalogMutationResult {
	const before = registry[input.type];
	if (!before) {
		return failure("component-not-found", `component '${input.type}' was not found`);
	}

	const nextPublicEntry = { ...before, ...input.patch, type: before.type };
	const parsed = validateEntry(nextPublicEntry);
	if (parsed.ok === false) return { ok: false, issues: parsed.issues };

	const nextEntry = { ...parsed.entry, status: before.status };
	const nextRegistry = { ...registry, [before.type]: nextEntry };
	return mutationSuccess(nextRegistry, nextEntry, {
		type: "update",
		componentType: before.type,
		before,
		after: nextEntry,
	});
}

export function deleteEntry(
	registry: InternalComponentCatalog,
	input: DeleteComponentCatalogEntryInput,
): ComponentCatalogMutationResult {
	const before = registry[input.type];
	if (!before) {
		return failure("component-not-found", `component '${input.type}' was not found`);
	}

	const { [input.type]: _removed, ...nextRegistry } = registry;
	return mutationSuccess(nextRegistry, undefined, {
		type: "delete",
		componentType: before.type,
		before,
	});
}

export function promoteEntry(
	registry: InternalComponentCatalog,
	input: PromoteComponentCatalogEntryInput,
): ComponentCatalogMutationResult {
	const before = registry[input.type];
	if (!before) {
		return failure("component-not-found", `component '${input.type}' was not found`);
	}
	if (before.status !== "candidate") {
		return failure("status-not-candidate", `component '${input.type}' is not a candidate`);
	}

	const nextEntry = { ...before, status: "stable" as const };
	const nextRegistry = { ...registry, [before.type]: nextEntry };
	return mutationSuccess(nextRegistry, nextEntry, {
		type: "promote",
		componentType: before.type,
		before,
		after: nextEntry,
	});
}

export function upsertEntry(
	registry: InternalComponentCatalog,
	input: UpsertComponentCatalogEntryInput,
): ComponentCatalogMutationResult {
	const before = registry[input.entry.type];
	if (!before) {
		return createEntry(registry, input);
	}

	const parsed = validateEntry(input.entry);
	if (parsed.ok === false) return { ok: false, issues: parsed.issues };

	const nextEntry = { ...parsed.entry, status: input.status };
	const nextRegistry = { ...registry, [nextEntry.type]: nextEntry };
	return mutationSuccess(nextRegistry, nextEntry, {
		type: "upsert",
		componentType: nextEntry.type,
		before,
		after: nextEntry,
	});
}

function validateEntry(
	entry: ComponentCatalogEntry,
): { ok: true; entry: ComponentCatalogEntry } | { ok: false; issues: ComponentCatalogIssue[] } {
	const issues: ComponentCatalogIssue[] = [];
	if (!entry.type) issues.push(schemaIssue("type", "component type is required"));
	if (!entry.source) issues.push(schemaIssue("source", "component source is required"));
	if (!entry.version) issues.push(schemaIssue("version", "component version is required"));
	if (!entry.props || typeof entry.props !== "object") {
		issues.push(schemaIssue("props", "component props contract is required"));
	}

	const auditIssues = auditComponentCatalog({ [entry.type]: entry });
	if (issues.length > 0 || auditIssues.length > 0) {
		return { ok: false, issues: [...issues, ...auditIssues] };
	}

	return { ok: true, entry };
}

function mutationSuccess(
	registry: InternalComponentCatalog,
	entry: InternalComponentCatalogEntry | undefined,
	change: ComponentCatalogChange,
): ComponentCatalogMutationResult {
	const catalog = assembleComponentCatalog(registry);
	const issues = auditComponentCatalog(catalog);
	if (issues.length > 0) return { ok: false, issues };
	return { ok: true, registry, catalog, entry, changes: [change] };
}

function schemaIssue(path: string, message: string): ComponentCatalogIssue {
	return { code: "schema-invalid", message, path: [path] };
}

import type {
	ComponentCatalog,
	ComponentCatalogIssue,
	ComponentCatalogIssueCode,
	ComponentPropContract,
} from "../public/types";
import { isTokenRole } from "../public/types";

export type CatalogAuditIssue = ComponentCatalogIssue;

/**
 * Catalog 자가 검증. variantTokens 키가 values에 포함되는지,
 * 선언된 TokenRole이 어휘 안에 있는지 검사한다.
 */
export function auditComponentCatalog(catalog: ComponentCatalog): CatalogAuditIssue[] {
	const issues: CatalogAuditIssue[] = [];
	for (const [type, entry] of Object.entries(catalog)) {
		for (const [propName, contract] of Object.entries(entry.props)) {
			auditVariantTokens(issues, type, propName, contract);
		}
	}
	return issues;
}

function auditVariantTokens(
	issues: CatalogAuditIssue[],
	type: string,
	propName: string,
	contract: ComponentPropContract,
) {
	const variantTokens = contract.variantTokens;
	if (!variantTokens) return;
	if (contract.type !== "enum" || !contract.values) {
		issues.push({
			type,
			propName,
			code: "variantTokens.requires-enum",
			message: `${type}.${propName} has variantTokens but is not an enum with values`,
		});
		return;
	}
	const allowed = new Set(contract.values);
	for (const [variantKey, slots] of Object.entries(variantTokens)) {
		if (!allowed.has(variantKey)) {
			issues.push({
				type,
				propName,
				code: "variantTokens.unknown-variant",
				message: `${type}.${propName} variantTokens has key "${variantKey}" not in values`,
			});
		}
		for (const role of Object.values(slots ?? {})) {
			if (typeof role !== "string") continue;
			if (!isTokenRole(role)) {
				issues.push({
					type,
					propName,
					code: "variantTokens.invalid-token-role",
					message: `${type}.${propName} variantTokens[${variantKey}] uses unknown token role "${role}"`,
				});
			}
		}
	}
}

export function failure<T extends ComponentCatalogIssueCode>(
	code: T,
	message: string,
): { ok: false; issues: ComponentCatalogIssue[] } {
	return { ok: false, issues: [{ code, message }] };
}

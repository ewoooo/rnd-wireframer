import type {
	ValidationCode,
	ValidationIssue,
	ValidationLayer,
	ValidationSeverity,
} from "@cx/types";

export interface IssueExtras {
	severity?: ValidationSeverity;
	path?: ReadonlyArray<string | number>;
	nodeId?: string;
	nodeType?: string;
	data?: Record<string, unknown>;
}

export function makeIssue(
	code: ValidationCode,
	layer: ValidationLayer,
	message: string,
	extras: IssueExtras = {},
): ValidationIssue {
	return {
		code,
		layer,
		message,
		severity: extras.severity ?? "error",
		path: extras.path,
		nodeId: extras.nodeId,
		nodeType: extras.nodeType,
		data: extras.data,
	};
}

import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import {
	RerunConflictError,
	rerunInferenceJob,
	UnknownRerunStepError,
} from "@/server/inference-runtime";

export const runtime = "nodejs";

// Must match the ContextStore key rule (context/{key}.json).
const CONTEXT_KEY = /^[a-z0-9-]+$/;

type InferenceRerunRouteContext = {
	params: Promise<{
		jobId: string;
	}>;
};

export async function POST(request: Request, context: InferenceRerunRouteContext) {
	try {
		const { jobId } = await context.params;
		const body = await readBody(request);
		const startFromStepId = readStartFromStepId(body);
		const contextOverrides = readContextOverrides(body);
		const job = await rerunInferenceJob(jobId, {
			...(startFromStepId ? { startFromStepId } : {}),
			...(contextOverrides ? { contextOverrides } : {}),
		});
		return NextResponse.json(
			{
				job,
				ok: true,
				startFromStepId,
				...(contextOverrides ? { overriddenContextKeys: Object.keys(contextOverrides) } : {}),
			},
			{ status: 202 },
		);
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to rerun inference job.") },
			{ status: readErrorStatus(error) },
		);
	}
}

async function readBody(request: Request): Promise<Record<string, unknown> | undefined> {
	const body = await request.json().catch(() => undefined);
	return body && typeof body === "object" && !Array.isArray(body)
		? (body as Record<string, unknown>)
		: undefined;
}

function readStartFromStepId(body: Record<string, unknown> | undefined): string | undefined {
	const value = body?.startFromStepId;
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readContextOverrides(
	body: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
	if (!body || !("contextOverrides" in body)) return undefined;
	const value = body.contextOverrides;
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new InvalidRerunRequestError("contextOverrides must be an object of contextKey → value");
	}
	const overrides = value as Record<string, unknown>;
	for (const key of Object.keys(overrides)) {
		if (!CONTEXT_KEY.test(key)) {
			throw new InvalidRerunRequestError(
				`Invalid context key '${key}' — keys must match ${CONTEXT_KEY}`,
			);
		}
	}
	return Object.keys(overrides).length > 0 ? overrides : undefined;
}

class InvalidRerunRequestError extends Error {}

function readErrorStatus(error: unknown): number {
	if (error instanceof InvalidRerunRequestError) return 400;
	if (error instanceof UnknownRerunStepError) return 400;
	if (error instanceof RerunConflictError) return 409;
	if (isNodeError(error) && error.code === "ENOENT") return 404;
	return 500;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}

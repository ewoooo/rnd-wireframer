# Claude `--json-schema` Structured Output for the Inference Runner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make claude inference steps emit schema-conformant JSON by passing the step's output-contract JSON Schema to the `claude` CLI's `--json-schema` flag and reading the envelope's `structured_output` field, while hardening the pipeline so a non-JSON model response closes the step as `failed` (not left `running`).

**Architecture:** The runner `createClaudeAgentSdkRunner` (`packages/agent/src/claude/claude-agent-sdk-runner.ts`) shells out to `claude --print --output-format json ...` via `execFile` (despite the "AgentSdk" name, it is a CLI shell-out, not the API SDK). The output-contract JSON Schema already reaches the runner at `request.input.context.jsonSchema` (claude-engine injects it; `runAgentTask` forwards `input` verbatim). We add `--json-schema <schema>` when that schema is present, prefer the envelope's `structured_output` (the parsed, schema-constrained object) over text parsing, keep `run-step.ts`'s existing post-hoc `validateJsonSchema`, and wrap the engine call so a throw becomes a `failed` step.

**Tech Stack:** TypeScript, pnpm monorepo (no build step), Vitest (globals), Biome, the `claude` CLI (`--json-schema` confirmed in `claude --help`).

---

## Verified facts (do not re-investigate)

- `claude --print --output-format json --json-schema '<schema>' "<prompt>"` returns an envelope with a top-level **`structured_output`** field (the parsed object) in addition to the `result` string. Confirmed by probe.
- `request.input.context.jsonSchema` is available to the runner (forwarded by `runAgentTask`; set by `claude-engine.execute`). `AgentTaskInput.context` is typed `unknown` — read with a guard.
- `run-step.ts` already calls `validateJsonSchema(outputContract.data.jsonSchema, result.raw)` and returns `status:"failed"` on `!report.ok`. `run-inference-job.ts` closes a step as `failed` only when `runStep` RETURNS `status:"failed"`.
- **Gap:** if the runner throws (e.g. `parseClaudeJsonResult` → `JSON.parse` on prose), `runStep` has no try/catch → the throw propagates to `run-inference-job`'s outer catch, which marks the JOB failed but leaves the current STEP `running`.
- **Official docs (verified via claude-code-guide, 2026-06-08):**
  - `--json-schema <schema>` is documented (print-mode only): "Get validated JSON output matching a JSON Schema after agent completes." Source: code.claude.com/docs/en/cli-reference.
  - The result envelope includes a documented **`structured_output`** field with the schema-conformant object. Source: code.claude.com/docs/en/agent-sdk/structured-outputs.
  - Output is **grammar-constrained (guaranteed conformance)** — not best-effort. Only refusal / `max_tokens` can break it.
  - **Failure is signaled via `subtype`**, NOT `is_error`: success → `subtype: "success"` with `structured_output` present; failure → `subtype: "error_max_structured_output_retries"` with `structured_output` omitted/null.
  - **Supported schema features: basic types, enum, const, $ref/$def, anyOf/allOf, string formats.** **NOT supported: recursive schemas, external $ref URLs, length/numeric constraints (minLength/maxLength/minimum/maximum).**

## Schema probe results (Task 1 EXECUTED 2026-06-08)

Probed each contract's real schema against `claude --json-schema`. **Root cause of empty `structured_output` found:** the CLI's structured-output extraction silently no-ops when the schema carries the meta keys **`$schema` / `$id` / `title`** (confirmed: stripping them flips `structured_output` from null → populated). After stripping those three keys:

| contract | structured_output after strip | action |
| --- | --- | --- |
| `screen-intent` | ✅ populated | use `--json-schema` |
| `composition-plan` | ✅ populated | use `--json-schema` |
| `quality-inspection` | ✅ populated | use `--json-schema` |
| `render-tree` | ❌ envelope returns non-JSON (rejected — recursive schema) | opt out; fall back |

**Required by this finding:** the runner MUST strip `$schema`, `$id`, `title` from the schema before passing it to `--json-schema`. And it MUST tolerate a rejected schema (render-tree): the `claude` stdout is then NOT valid JSON, so `JSON.parse(stdout)` throws — the runner must catch that and re-run WITHOUT `--json-schema` (falling back to today's text parse). `$defs`/`$ref` themselves are fine (verified); only recursion + meta keys are the issues.

## Risk to de-risk first (Task 1) — recursion is the likely blocker

Per the docs above, **recursive schemas are NOT supported**. The RenderTree contract schema IS recursive (a node contains children of the same node type), so `04-render-tree` — the highest-drift target — is the one MOST likely to be REJECTED by `--json-schema`. The realistic wins are the NON-recursive contracts (`screen-intent`, `composition-plan`, `quality-inspection`) if they avoid recursion/unsupported constraints. **Task 1 probes the REAL contract schemas to learn exactly which are accepted.** Rejected contracts opt out (fall back to today's prompt+validate path); the runner must degrade gracefully, not hard-fail. If render-tree is rejected (expected), structured output does NOT help it — a separate strategy (schema de-recursion, or keep prompt+validate + the Task 3 fail-close) is needed and is out of scope here.

---

## Task 1: Probe real contract schemas against `--json-schema`

**Files:** none (investigation; record results in this plan under `## Schema probe results`).

- [ ] **Step 1: Dump each claude step's contract schema to temp files**

```bash
mkdir -p /tmp/cx-schema-probe
node -e '
const { resolveOutputContractForInference } = require("./packages/schema/src/index.ts");
' 2>/dev/null || true
# schema package has no build; use tsx to resolve contracts the same way the pipeline does:
pnpm exec tsx -e '
import { resolveOutputContractForInference } from "@cx/schema";
import { writeFileSync } from "node:fs";
for (const id of ["screen-intent","composition-plan","render-tree","quality-inspection"]) {
  const c = resolveOutputContractForInference(id);
  writeFileSync(`/tmp/cx-schema-probe/${id}.json`, JSON.stringify(c.data.jsonSchema));
  console.log(id, "bytes:", JSON.stringify(c.data.jsonSchema).length);
}
'
```

- [ ] **Step 2: Run `claude --json-schema` with each schema and a trivial prompt; record accept/reject**

```bash
for id in screen-intent composition-plan render-tree quality-inspection; do
  echo "=== $id ==="
  timeout 120 claude --print --output-format json --no-session-persistence --tools "" \
    --json-schema "$(cat /tmp/cx-schema-probe/$id.json)" \
    "Produce a minimal valid instance of the provided schema. Output only the structured object." \
    2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('subtype:', d.get('subtype'), '| has structured_output:', d.get('structured_output') is not None, '| api_error:', d.get('api_error_status'))" 2>&1 | head -3
done
```

A REJECTED schema may surface as a non-zero CLI exit / error envelope at submit time (schema validation), or as `subtype: "error_max_structured_output_retries"` with null `structured_output`. Recursion rejection (expected for `render-tree`) typically shows as a submit-time schema error — capture whichever occurs.

- [ ] **Step 3: Record which contracts are accepted**

Write `## Schema probe results` into this plan: per contract id, `ACCEPTED` (structured_output present, is_error false) or `REJECTED` (with the error). Contracts that are REJECTED are excluded from `--json-schema` in Task 2 (the runner falls back for them). `render-tree` is the one to watch.

## Task 2: Pass `--json-schema` and prefer `structured_output` in the runner

**Files:**
- Modify: `packages/agent/src/claude/claude-agent-sdk-runner.ts`
- Test: `packages/agent/src/claude/__tests__/claude-agent-sdk-runner.test.ts` (create if absent)

- [ ] **Step 1: Write a failing test with a fake `claudeBin`**

The runner accepts `options.claudeBin`. Point it at a tiny fake script that echoes a fixed envelope, and assert (a) `--json-schema` appears in argv when a schema is present, (b) the runner returns `structured_output` as `payload`.

```ts
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createClaudeAgentSdkRunner } from "../claude-agent-sdk-runner";

function fakeClaude(envelope: object): string {
  const dir = mkdtempSync(join(tmpdir(), "fakeclaude-"));
  const bin = join(dir, "claude");
  // Echo argv to a sidecar file, then print the fixed envelope.
  writeFileSync(
    bin,
    `#!/usr/bin/env node\nrequire("node:fs").writeFileSync(process.env.ARGV_OUT, JSON.stringify(process.argv.slice(2)));\nprocess.stdout.write(${JSON.stringify(JSON.stringify(envelope))});\n`,
  );
  chmodSync(bin, 0o755);
  return bin;
}

it("passes --json-schema and returns structured_output", async () => {
  const argvOut = join(mkdtempSync(join(tmpdir(), "argv-")), "argv.json");
  process.env.ARGV_OUT = argvOut;
  const bin = fakeClaude({ result: "ignored prose", structured_output: { ok: true } });
  const run = createClaudeAgentSdkRunner({ claudeBin: bin });
  const res = await run({
    taskKind: "screen-generation",
    input: { query: "q", context: { jsonSchema: { type: "object" } } },
    prompt: { system: "s", user: "u", metadata: {} },
  } as never);
  expect(res.payload).toEqual({ ok: true });
  const argv = JSON.parse(require("node:fs").readFileSync(argvOut, "utf8")) as string[];
  expect(argv).toContain("--json-schema");
});
```

Run: `pnpm exec vitest run packages/agent/src/claude/__tests__/claude-agent-sdk-runner.test.ts` → FAIL (no `--json-schema` yet; payload comes from text parse).

- [ ] **Step 2: Implement schema extraction + arg + structured_output preference**

Replace the body of `createClaudeAgentSdkRunner`'s returned function:

```ts
return async (request) => {
  const prompt = [
    request.prompt.user,
    "",
    "Context JSON:",
    JSON.stringify(request.prompt.metadata ?? {}, null, 2),
  ].join("\n");

  const schema = extractOutputSchema(request.input); // meta keys already stripped

  const baseArgs = [
    "--print",
    "--output-format",
    "json",
    "--no-session-persistence",
    "--tools",
    "",
    "--system-prompt",
    request.prompt.system,
    "--model",
    model,
  ];

  const runClaude = async (withSchema: boolean): Promise<string> => {
    const args = [...baseArgs];
    if (withSchema && schema) args.push("--json-schema", JSON.stringify(schema));
    args.push(prompt);
    const { stdout } = await execFileAsync(options.claudeBin ?? "claude", args, {
      maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10,
    });
    return stdout.trim();
  };

  const parseEnvelope = (stdout: string) =>
    JSON.parse(stdout) as { result?: unknown; structured_output?: unknown };

  let payload: unknown;
  if (schema) {
    try {
      const stdout = await runClaude(true);
      const envelope = parseEnvelope(stdout);
      // structured_output is the schema-constrained object (preferred). On the rare
      // "accepted but not extracted" case it's null → fall back to result text.
      payload =
        envelope.structured_output !== undefined && envelope.structured_output !== null
          ? envelope.structured_output
          : parseClaudeJsonResult(
              typeof envelope.result === "string" ? envelope.result : stdout,
            ).payload;
    } catch {
      // Schema rejected (e.g. recursive render-tree) → CLI stdout is not valid JSON.
      // Re-run WITHOUT --json-schema and text-parse, exactly as before this feature.
      const stdout = await runClaude(false);
      const envelope = parseEnvelope(stdout);
      payload = parseClaudeJsonResult(
        typeof envelope.result === "string" ? envelope.result : stdout,
      ).payload;
    }
  } else {
    const stdout = await runClaude(false);
    const envelope = parseEnvelope(stdout);
    payload = parseClaudeJsonResult(
      typeof envelope.result === "string" ? envelope.result : stdout,
    ).payload;
  }

  return {
    payload,
    session: {
      mode: request.session?.mode ?? "new",
      sessionId: request.session?.sessionId,
    },
    taskKind: request.taskKind,
  };
};
```

Add near the bottom of the file — note it STRIPS the meta keys that silently disable structured extraction (proven in Task 1):

```ts
function extractOutputSchema(input: { context?: unknown }): Record<string, unknown> | undefined {
  const context = input.context;
  if (!context || typeof context !== "object") return undefined;
  const raw = (context as { jsonSchema?: unknown }).jsonSchema;
  if (!raw || typeof raw !== "object") return undefined;
  // $schema/$id/title silently disable the CLI's structured_output extraction — drop them.
  const { $schema, $id, title, ...rest } = raw as Record<string, unknown>;
  void $schema;
  void $id;
  void title;
  return rest;
}
```

Delete the now-unused `extractClaudeResultText` helper (its logic moved inline). The catch-and-retry-without-schema branch makes the runner self-adapting: no denylist needed — a rejected (recursive) schema simply falls back to the text path.

- [ ] **Step 3: Run the test → PASS, then typecheck + lint**

```bash
pnpm exec vitest run packages/agent/src/claude/__tests__/claude-agent-sdk-runner.test.ts
pnpm exec tsc --noEmit --pretty false --incremental false
pnpm exec biome check --write packages/agent/src/claude/claude-agent-sdk-runner.ts packages/agent/src/claude/__tests__/claude-agent-sdk-runner.test.ts
pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add packages/agent/src/claude
git commit -m "feat(agent): pass output schema to claude --json-schema, prefer structured_output"
```

## Task 3: Retry-once, then fail-close a step

A step fails today in two ways: (a) the engine throws (e.g. non-JSON model response → `JSON.parse` in the runner) — currently propagates past `run-step` and leaves `step.json` stuck `running`; (b) `validateJsonSchema` returns `!ok`. We make `run-step` **re-attempt the engine call once** (2 attempts total) covering BOTH failure modes — claude is non-deterministic so a format-drift miss often succeeds on retry (the realistic recovery path for the recursive `render-tree` step, which `--json-schema` can't constrain) — and only return `status:"failed"` after all attempts are exhausted. Resolve inputs/references/contract ONCE, loop only the engine call + validation. Retries are internal (no extra job events). No new contract types — this is a local loop, not the removed feedback/skip machinery.

**Files:**
- Modify: `packages/inference/src/pipeline/run-step.ts`
- Test: `packages/inference/src/__tests__/run-step.test.ts`

- [ ] **Step 1: Write failing tests — throw and validation-miss both retry, then fail-close; transient miss recovers**

```ts
it("returns failed (does not throw) after retrying when the engine always throws", async () => {
  let calls = 0;
  const ctx = {
    engines: {
      claude: { execute: async () => { calls++; throw new Error("boom"); } },
      function: {} as never,
    },
    resolveInput: async () => ({}),
    resolveReference: async () => ({}),
    resolveOutputContract: async () => ({ id: "x", data: { jsonSchema: { type: "object" }, dtoName: "X" } }),
  } as never;
  const exec = await runStep(CLAUDE_STEP, ctx);
  expect(exec.status).toBe("failed");
  expect(exec.error?.code).toBe("engine_execution_failed");
  expect(calls).toBe(2); // 1 try + 1 retry
});

it("succeeds on the second attempt after a transient throw", async () => {
  let calls = 0;
  const ctx = {
    engines: {
      claude: { execute: async () => { calls++; if (calls === 1) throw new Error("transient"); return { raw: { ok: true } }; } },
      function: {} as never,
    },
    resolveInput: async () => ({}),
    resolveReference: async () => ({}),
    resolveOutputContract: async () => ({ id: "x", data: { jsonSchema: { type: "object" }, dtoName: "X" } }),
  } as never;
  const exec = await runStep(CLAUDE_STEP, ctx);
  expect(exec.status).toBe("succeeded");
  expect(calls).toBe(2);
});
```

Where `CLAUDE_STEP` is a minimal claude step def with an `output.contractRef` (reuse the test file's existing fixture or define one). Run → FAIL (no retry; throw propagates).

- [ ] **Step 2: Implement the retry loop in run-step.ts**

Replace the single engine-call + validation block (current lines ~11-35) with:

```ts
const engine = context.engines[step.engine];
const prompt = step.prompt;
const MAX_ATTEMPTS = 2; // 1 retry

let lastError: { code: string; message: string } = {
  code: "engine_execution_failed",
  message: "engine did not run",
};
let lastRaw: unknown;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    const result = await engine.execute({ prompt, run: step.run, inputs, references, outputContract });
    lastRaw = result.raw;
    const report = validateJsonSchema(outputContract.data.jsonSchema, result.raw);
    if (report.ok) {
      return {
        status: "succeeded",
        inputs,
        references,
        outputContract,
        prompt,
        raw: result.raw,
        contextWrites: step.output.writeToContext
          ? { [step.output.writeToContext]: result.raw }
          : undefined,
      };
    }
    lastError = {
      code: "output_contract_validation_failed",
      message: report.issues.map((issue) => issue.message).join("; "),
    };
  } catch (error) {
    lastRaw = undefined;
    lastError = {
      code: "engine_execution_failed",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

return {
  status: "failed",
  inputs,
  references,
  outputContract,
  prompt,
  raw: lastRaw,
  error: lastError,
};
```

This subsumes the previous standalone `validateJsonSchema` fail-close (now inside the loop). Keep `resolveInputs`/`resolveReferences` calls above the loop unchanged — they run once.

- [ ] **Step 3: Run tests → PASS; confirm run-inference-job closes the step**

Run: `pnpm exec vitest run packages/inference/src/__tests__/run-step.test.ts` → PASS.
`run-inference-job.ts` already marks the step `failed` + emits `step_failed` when `runStep` RETURNS `status:"failed"`. Step 2 guarantees a RETURN (never a throw) after retries, so `step.json` no longer stays `running`. Verify the `execution.status === "failed"` branch in `run-inference-job.ts` is intact.

- [ ] **Step 4: typecheck + lint + commit**

```bash
pnpm exec tsc --noEmit --pretty false --incremental false
pnpm exec biome check --write packages/inference/src/pipeline/run-step.ts packages/inference/src/__tests__/run-step.test.ts
git add packages/inference/src/pipeline/run-step.ts packages/inference/src/__tests__/run-step.test.ts
git commit -m "feat(inference): retry a step once, then fail-close (no stuck running)"
```

## Task 4: End-to-end verification

**Files:** none (verification).

- [ ] **Step 1: Full suites**

```bash
pnpm exec vitest run packages/agent packages/inference
pnpm exec tsc --noEmit --pretty false --incremental false
```
Expected: all pass, tsc exit 0.

- [ ] **Step 2: Live e2e — confirm render-tree comes back structured**

Run the existing demo path (`POST /api/inference {"screenCode":"DEMO"}` against `apps/web`, or the e2e harness used previously) to a `succeeded` job. Then inspect the `04-render-tree` step output:

```bash
JOB=<jobId>
cat .data/inference-jobs/$JOB/steps/04-render-tree/raw-response.json | python3 -m json.tool | head -5
```
Expected: valid JSON object (not prose/markdown), schema-valid.

- [ ] **Step 3: Negative check — a forced bad output closes the step failed**

Temporarily point a claude step at a fake `claudeBin` that prints `{"result":"sorry, here is some prose","structured_output":null}` (no schema match), run one job, and confirm the step's `step.json` ends `failed` (not `running`) and the job is `failed`. Revert the fake afterward.

- [ ] **Step 4: Record in AGENTS_HISTORY (if that file is not mid-edit by another session) and finish via finishing-a-development-branch**

## Notes / non-goals

- `--json-schema` constrains FORMAT only. Semantically-wrong-but-schema-valid output is still caught (or not) by `quality-review` + `validateJsonSchema`, not by this change.
- No `AgentRunner` contract change is required — the schema rides on `request.input.context.jsonSchema`. (Optional later cleanup: surface a typed `request.input.outputSchema` instead of the `unknown` context bag.)
- Keep the runner's graceful fallback: when no schema / a REJECTED schema / no `structured_output`, behave exactly as today (text parse). This change must not regress steps that work now (e.g. `02-screen-intent`).

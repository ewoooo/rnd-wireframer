# @cx/smoke

`@cx/smoke` is a developer-facing integration app for running generation smoke flows across workspace packages.

It is not a production runtime package. It reads local inputs, calls public package APIs, and writes smoke artifacts for inspection.

## Responsibility

- Run repeatable integration smoke flows.
- Provide a single public function for each smoke flow.
- Keep CLI scripts thin by moving execution harness logic here.
- Record intermediate artifacts for debugging and regression checks.

## Non-Goals

- Markdown parsing rules
- validation rules
- Claude runner implementation
- renderer implementation
- catalog or token ownership

## Public Usage

```ts
import { runGenerationSmoke } from "@cx/smoke/generation";

const result = await runGenerationSmoke(
	"data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
	{
		useAI: false,
		runId: "stable-smoke-run",
	},
);

console.log(result.summary);
```

`useAI: false` uses the fake smoke runner. `useAI: true` calls the local Claude runner through `@cx/agent`.

## CLI

Use the root script for the common path:

```bash
npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

Or call the app workspace directly:

```bash
npm --workspace @cx/smoke run generation -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

Use `--use-ai` to call the real local Claude runner.

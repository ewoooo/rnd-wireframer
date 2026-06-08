# Reference Skills

Reference skills package source-backed design evidence for Compose and Review stages.

They do not define runtime schema, component contracts, or orchestration policy. Those remain in `@cx/schema`, `@cx/components`, `@cx/layout`, and `@cx/inference`.

## Structure

```text
reference-skills/
  sot/
    <reference-id>/
      manifest.json
      USAGE.md
      nodes.md
      component-inventory.md
      source/
        evidence.md
```

## Responsibilities

- Record which SOT file and nodes should be inspected before writing a design skill.
- Preserve source-backed observations separately from inferred design rules.
- Link SOT references to related design skills and review skills.
- Provide stable reference ids that can be written into inference trace artifacts.

## Non-Responsibilities

- Do not store RenderTree examples as runtime fixtures.
- Do not define component prop contracts.
- Do not duplicate foundation token or layout contract details from `references/design/`.

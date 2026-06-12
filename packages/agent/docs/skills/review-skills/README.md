# Review Skills

Review skills are Revise-stage checklists for evaluating generated CompositionPlan and RenderTree output.

They do not execute validation themselves. Runtime validation belongs to `@cx/validation`, and orchestration belongs to `@cx/inference`.

## Structure

```text
review-skills/
  <review-skill-id>/
    README.md
```

## Initial Review Skill Categories

- `source-fidelity-review`
- `visual-hierarchy-review`
- `density-fit-review`
- `action-clarity-review`
- `pattern-fit-review`
- `state-coverage-review`
- `anti-slop-review`

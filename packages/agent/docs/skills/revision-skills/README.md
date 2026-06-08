# Revision Skills

Revision skills describe targeted fixes to apply after review or schema validation finds a known failure pattern.

They do not own orchestration, retry policy, or file artifacts. Those remain in `@cx/inference`.

## Structure

```text
revision-skills/
  <revision-skill-id>/
    README.md
```

## Initial Revision Skill Categories

- `fix-invalid-layout-id`
- `fix-source-ref-loss`
- `fix-bottom-cta-gating`
- `fix-section-rhythm`
- `fix-density-overload`
- `fix-state-coverage-gap`
- `fix-component-contract-violation`

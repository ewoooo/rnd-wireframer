# Quality Review Bundle

Bundle id: `quality-review`

Source docs:

- `packages/agent/docs/quality-review/checklist.md`
- `packages/agent/docs/screen-generation/checklist.md`
- `docs/design/SECTION_PATTERNS.md`
- `docs/design/INTERACTION_PATTERNS.md`

Agent-facing rules:

- Separate schema/contract failures from design quality concerns.
- Report findings using bounded, revision-ready messages.
- Treat missing source refs, source-less metrics, placeholder copy, invented component roles, state coverage gaps, and misplaced bottom actions as reviewable defects.
- Prefer targeted fixes to full regeneration.
- If repeated failures or warning-only uncertainty remain, leave enough context for human review instead of inventing answers.

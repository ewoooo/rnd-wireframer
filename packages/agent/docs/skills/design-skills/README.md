# Design Skills

Design skills are bounded Compose-stage references. They guide `CompositionPlan`, component/layout proposal, and quality review gates without owning runtime execution or schema contracts.

Each skill lives in its own folder:

```text
design-skills/<skill-id>/
  README.md
  source/      # optional: source fundamentals or supporting source docs owned by this skill
  references/
    README.md
```

Each skill `README.md` should define:

- `Applies To`
- `Required Design Docs`
- `Required SOT References`
- `Composition Rules`
- `Component/Layout Proposal Rules`
- `Good CompositionPlan Example`
- `Bad CompositionPlan Example`
- `Quality Gates`
- `Revision Hints`

Current design skills:

- `design-fundamentals` — common semantic design rules with source fundamentals in `design-fundamentals/source/`
- `detail-confirmation-screen`
- `form-entry-screen`
- `list-selection-screen`

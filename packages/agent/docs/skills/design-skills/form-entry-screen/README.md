# form-entry-screen

## Applies To

Use this skill when the screen contains editable fields, required agreements, verification, validation, or submit/request flows.

## Required Design Docs

- `packages/agent/docs/skills/design-skills/design-fundamentals/source/SECTION_PATTERNS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/INTERACTION_PATTERNS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/LAYOUT_SPACING_CONTRACT.md`

## Required SOT References

- None registered yet.

## Composition Rules

- `visualHierarchy`: explain the form purpose before field groups and helper/error text.
- `primaryUserAction`: identify the submit, request, verify, or continue action and its enabled/disabled expectation.
- `sectionRhythm`: group related fields, validation hints, required agreements, and final action separately.
- `density`: use `high` only when source evidence contains many fields or agreements.
- `patternRationale`: explain why editable input evidence requires form composition.
- `rejectedPatterns`: reject detail confirmation when the user must provide data before continuing.

## Component/Layout Proposal Rules

- Keep field rows in a form or field stack area.
- Keep required agreements or validation messages near the affected field group.
- Use source-backed state roles for disabled, validation, loading, or error states.

## Good CompositionPlan Example

```json
{
  "visualHierarchy": "Form purpose first, required field group second, validation guidance third, submit action last.",
  "primaryUserAction": "Submit the completed input after required validation passes.",
  "sectionRhythm": "Header, grouped fields, validation/helper text, bottom submit action.",
  "density": "high",
  "patternRationale": "The source contains editable TextField and required validation evidence.",
  "rejectedPatterns": [
    { "pattern": "detail-confirmation-screen", "reason": "The user must enter or verify data before confirmation." }
  ]
}
```

## Bad CompositionPlan Example

```json
{
  "visualHierarchy": "Show fields.",
  "primaryUserAction": "Next",
  "sectionRhythm": "Fields and button.",
  "density": "medium",
  "patternRationale": "Has inputs.",
  "rejectedPatterns": []
}
```

## Quality Gates

- `section-rhythm`: field groups and validation/help text are not flattened.
- `density-fit`: spacing and grouping fit the number of fields.
- `action-clarity`: submit/verify action states are clear.
- `source-fidelity`: required and validation evidence remains visible.

## Revision Hints

- If density is too high, split fields into clearer groups before changing copy.
- If source fidelity is weak, restore required, disabled, loading, or validation state evidence.

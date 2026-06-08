# detail-confirmation-screen

## Applies To

Use this skill when the screen presents a summary or detail body and asks the user to confirm, continue, subscribe, request, or complete a primary action.

## Required Design Docs

- `docs/design/COMPOSITION_LAYERS.md`
- `docs/design/SCREEN_PATTERN_SUMMARY.md`
- `docs/design/INTERACTION_PATTERNS.md`

## Composition Rules

- `visualHierarchy`: put the decision-critical summary before supporting rows and before the action.
- `primaryUserAction`: describe the bottom or final CTA in terms of user outcome, not just button text.
- `sectionRhythm`: keep header context, content evidence, and bottom action as separate beats.
- `density`: prefer `medium` unless the source has many repeated detail rows.
- `patternRationale`: explain why a detail or confirmation pattern fits better than list or form.
- `rejectedPatterns`: reject `form-entry-screen` when there is no editable input; reject `list-selection-screen` when rows are informative rather than selectable.

## Component/Layout Proposal Rules

- Prefer stable `Screen.Header`, `Screen.Contents`, and `Screen.Bottom` rails.
- Put decision evidence in contents and the decisive CTA in bottom when source evidence exists.
- Do not introduce decorative components that are not supported by source refs or catalog contracts.

## Good CompositionPlan Example

```json
{
  "visualHierarchy": "Summary card first, supporting details second, primary confirmation action last.",
  "primaryUserAction": "Confirm the selected plan and continue.",
  "sectionRhythm": "Header context, summary evidence, detail rows, bottom CTA.",
  "density": "medium",
  "patternRationale": "The source has a detail summary and one decisive action, so detail-confirmation is stronger than list selection.",
  "rejectedPatterns": [
    { "pattern": "form-entry-screen", "reason": "No editable input fields are present." }
  ]
}
```

## Bad CompositionPlan Example

```json
{
  "visualHierarchy": "Use a nice card layout.",
  "primaryUserAction": "Button",
  "sectionRhythm": "Normal",
  "density": "medium",
  "patternRationale": "Looks good.",
  "rejectedPatterns": []
}
```

## Quality Gates

- `visual-hierarchy`: decision summary is visible before detail rows.
- `action-clarity`: primary CTA outcome is clear and positioned as the flow close.
- `pattern-fit`: the chosen pattern is not a form or selectable list unless source evidence says so.

## Revision Hints

- If hierarchy is weak, move or emphasize the source-backed summary before secondary details.
- If action clarity is weak, revise CTA grouping and bottom action placement before changing content.

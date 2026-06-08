# list-selection-screen

## Applies To

Use this skill when the screen contains repeated rows, options, agreement lists, selectable items, comparison choices, or checklist-like content.

## Required Design Docs

- `packages/agent/docs/skills/references/design/SECTION_PATTERNS.md`
- `packages/agent/docs/skills/references/design/COMPONENT_INVENTORY.md`
- `packages/agent/docs/skills/references/design/LAYOUT_SPACING_CONTRACT.md`

## Required SOT References

- TBD

## Composition Rules

- `visualHierarchy`: put list purpose and selected/required status before repeated row details.
- `primaryUserAction`: identify the row selection, all-agree, compare, choose, or continue action.
- `sectionRhythm`: separate list heading, repeated rows, supporting guidance, and bottom action.
- `density`: derive density from row count and row copy length.
- `patternRationale`: explain why repeated selectable or comparable evidence needs list composition.
- `rejectedPatterns`: reject detail confirmation when repeated rows are the main task, not supporting evidence.

## Component/Layout Proposal Rules

- Use list, checkbox, or message stack area patterns according to row semantics.
- Use dividers for stack rows when rows need scanning; avoid extra dividers inside already framed groups.
- Preserve required row labels and row-level affordance evidence from source refs.

## Good CompositionPlan Example

```json
{
  "visualHierarchy": "List title and requirement first, selectable rows second, continue action last.",
  "primaryUserAction": "Select required items and continue.",
  "sectionRhythm": "Header, list section, optional guidance, bottom action.",
  "density": "medium",
  "patternRationale": "The source has repeated agreement rows with selectable affordance.",
  "rejectedPatterns": [
    { "pattern": "detail-confirmation-screen", "reason": "The repeated rows are the primary task, not secondary details." }
  ]
}
```

## Bad CompositionPlan Example

```json
{
  "visualHierarchy": "Rows.",
  "primaryUserAction": "Continue",
  "sectionRhythm": "List",
  "density": "low",
  "patternRationale": "There are items.",
  "rejectedPatterns": []
}
```

## Quality Gates

- `visual-hierarchy`: list purpose and required status are clear.
- `section-rhythm`: repeated rows are grouped under the correct list section.
- `density-fit`: row spacing and dividers fit row count.
- `pattern-fit`: selection/list pattern is justified by source evidence.

## Revision Hints

- If pattern fit is weak, check whether rows are selectable, comparable, or merely supporting details.
- If separation is weak, revise stack area divider usage before changing component copy.

---
id: visual-hierarchy-review
kind: skill
family: review
stages:
  - compose
  - review
tasks:
  - composition-planning
  - quality-review
role: visual-hierarchy
priority: recommended
whenToUse: "Use when checking whether content, decision context, and primary action have clear priority."
tags:
  - visual-hierarchy
  - composition
  - quality-review
---

# visual-hierarchy-review

Checks whether the rendered structure has a clear priority order for title, decision context, primary content, and primary action.

## Inputs

- CompositionPlan `visualHierarchy`
- RenderTree screen/area structure
- Related design skill

## Checks

- Primary content appears before supporting detail.
- Primary user action is visually and structurally clear.
- Dense supporting content does not compete with the main decision.

## Outputs

- Pass/fail
- Hierarchy conflicts
- Suggested section reorder or emphasis change

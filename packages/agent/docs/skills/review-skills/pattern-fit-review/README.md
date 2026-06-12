---
id: pattern-fit-review
kind: skill
family: review
stages:
  - compose
  - review
tasks:
  - intent-composition
  - composition-planning
  - quality-review
role: pattern-fit
priority: recommended
whenToUse: "Use when checking whether the selected screen pattern and layout structure fit the source intent."
tags:
  - pattern-fit
  - composition
  - quality-review
---

# pattern-fit-review

Checks whether the selected design skill and layout pattern match the source intent.

## Inputs

- SourceSpec
- CompositionPlan `patternRationale`
- CompositionPlan `rejectedPatterns`
- RenderTree area/component pattern

## Checks

- Selected pattern explains why it fits.
- Plausible rejected patterns are documented when ambiguity exists.
- RenderTree structure follows the selected pattern.

## Outputs

- Pass/fail
- Pattern mismatch notes
- Suggested alternate design skill or layout pattern

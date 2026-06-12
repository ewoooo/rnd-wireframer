---
id: action-clarity-review
kind: skill
family: review
stages:
  - review
tasks:
  - quality-review
role: action-clarity
priority: recommended
whenToUse: "Use when checking whether the generated screen exposes one clear next action."
tags:
  - action-clarity
  - primary-action
  - quality-review
---

# action-clarity-review

Checks whether the screen makes the next user action clear.

## Inputs

- CompositionPlan `primaryUserAction`
- RenderTree CTA nodes
- SourceSpec user task

## Checks

- One primary action is identifiable.
- Secondary actions do not compete with the primary action.
- Disabled or gated action states have enough context.

## Outputs

- Pass/fail
- Action ambiguity notes
- Suggested CTA or state revision

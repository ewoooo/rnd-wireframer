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

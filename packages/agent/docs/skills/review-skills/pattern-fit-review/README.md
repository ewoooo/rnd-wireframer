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

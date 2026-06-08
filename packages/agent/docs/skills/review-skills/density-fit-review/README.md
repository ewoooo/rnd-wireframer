# density-fit-review

Checks whether screen density matches source complexity and selected pattern.

## Inputs

- CompositionPlan `density`
- Section count
- Component count
- SOT density evidence when available

## Checks

- Dense content is grouped into scannable sections.
- Sparse content is not inflated with unnecessary cards or dividers.
- Bottom CTA and critical actions remain visible or reachable.

## Outputs

- Pass/fail
- Density issue list
- Suggested grouping, collapsing, or simplification

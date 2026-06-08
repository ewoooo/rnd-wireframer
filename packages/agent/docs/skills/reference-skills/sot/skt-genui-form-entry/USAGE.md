# SKT GenUI Form Entry SOT Usage

## Read Order

1. `manifest.json`
2. `source/evidence.md`
3. `nodes.md`
4. `component-inventory.md`

## Use For

- User information entry, form validation, detail check, and submit-readiness skills.
- CompositionPlan decisions about field grouping, guidance text, error states, and bottom CTA gating.

## Do

- Separate entry-state evidence from confirmation-state evidence.
- Record whether a rule came from `10095:23483` or `10095:23501`.

## Avoid

- Do not merge form entry and confirmation rules without source distinction.

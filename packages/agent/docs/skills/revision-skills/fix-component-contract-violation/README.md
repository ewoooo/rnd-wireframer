# fix-component-contract-violation

Use when a generated component uses unsupported props, variants, or child structure.

## Revision Target

- Component node kind
- Component props
- Component children

## Fix Strategy

- Replace unsupported component surfaces with catalog-backed component contracts.
- Preserve source intent through supported props.
- Escalate to component promotion only when no existing component can represent the intent.

# @cx/component-pattern-store

`@cx/component-pattern-store` owns reusable semantic UI block contracts.

This is separate from `@cx/pattern-store`:

- `componentPattern`: what reusable UI block exists, which props/slots/variants it exposes, and which primitives/componentPatterns compose it.
- `layoutPattern`: how screen/region/area/composite children are laid out.

The v1 registry is intentionally empty. Compose can still propose `proposedComponentPatterns`; curated patterns should be added here as registered or proposed catalog entries.

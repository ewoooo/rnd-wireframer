# Composition Planning Prompt Contract

`composition-planning` derives a screen composition plan from normalized source data and screen intent.

The prompt artifact must include:

- source spec summary
- screen intent
- available layout catalog references
- selected design skill references, when available

The output must be JSON only and match `composition-plan.v0.1`.

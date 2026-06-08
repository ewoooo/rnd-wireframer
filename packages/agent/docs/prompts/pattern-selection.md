# Pattern Selection Prompt Contract

`pattern-selection` chooses layout pattern candidates for the planned screen composition.

The prompt artifact must include:

- composition plan
- decoration or layer candidates, when available
- layout catalog references
- relevant design context references

The output must be JSON only and match the pipeline step output contract declared by `@cx/inference`.

## Instructions

1. Select the pattern layer strategy from the provided `SourceSpec`, composition plan, and available layout candidates.
2. Treat context by priority: constraints are inviolable; upstream decisions should be honored; guidance is advisory and yields to constraints and upstream on conflict.
3. Use only provided layer candidates and their layout ids. Do not invent unavailable layout ids.
4. Use the source reference catalog or `SourceSpec` refs to keep selected target refs aligned with source ids.
5. Select screen, region, area, and component candidates when they help the later table-shaped generation result.
6. Each selected candidate must preserve its id, level, targetRef, and layout.
7. Use upstream `screenIntent` and `compositionPlan` as guidance when present.
8. Use upstream decoration or area-level guidance when present.
9. Use design-context bundle refs and selected design skill guidance when present.
10. Return one JSON object only with selected candidates, confidence, and reason, matching the provided output contract.

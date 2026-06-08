# Screen Revision Prompt Contract

`screen-revision` revises a generated screen from prior result context and review feedback.

The prompt artifact must include:

- previous generation result
- review or validation findings
- source spec and screen intent when available

The output must be JSON only and match the revision step output contract declared by `@cx/inference`.

## Instructions

1. Revise the previous RenderTree candidate so it satisfies the validation report and bounded quality findings.
2. Use the provided `SourceSpec` as the source of truth and preserve the intended screen.
3. Preserve upstream pattern selection and available layout candidate guidance when revising layout structure.
4. Preserve upstream `screenIntent` and `compositionPlan` guidance when revising generated artifacts.
5. Preserve upstream decoration splits, display titles, roles, layout intents, and repeated item props hints when present.
6. Preserve the SourceSpec screen skeleton. Keep `area.static` or `area.dynamic` wrapper nodes instead of flattening regions directly to leaf components.
7. Do not replace invalid `Area` nodes by removing the wrapper. Replace them with `area.static` or `area.dynamic` and keep their children.
8. Use available layer candidates and upstream pattern selection as the allowed pattern evidence. Do not invent layout ids.
9. Fix invented source refs by replacing them with refs from the provided source reference catalog or `SourceSpec`.
10. Fix invented component props or layout ids by using the component contract catalog.
11. Keep `CompositionPlan` source refs visible in the revised `tableGenerationResult` whenever possible.
12. Preserve or fix `tableGenerationResult` so every screen, region, area, and component record has a real layout id.
13. Keep top-level RenderTree `version`, `metadata`, and `children`. Do not use `contractVersion`, `schemaVersion`, `root`, `tree`, `nodeId`, or `componentId`.
14. Top-level children must contain a `Screen` root node. Put `Screen.Header`, `Screen.Contents`, and `Screen.Bottom` under that Screen node when source regions exist.
15. Use the final RenderTree handoff shape as the primary result contract: top-level `version`, `minRendererVersion`, `metadata`, `theme`, and `children` containing a `Screen` root.
16. Screen region containers may omit `props`. When region props are present, keep them valid and renderer-oriented.
17. Use `props.position` values only from `fixed`, `sticky`, or `static`. Prefer `static` when unsure.
18. Use layout props as objects, for example `{ "direction": "column" }`. Do not use layout strings such as `stack`.
19. Fix required-field-missing and invalid-render-node errors before addressing warnings.
20. When quality inspection is present, fix bounded P0 quality findings without rewriting unrelated valid structure.
21. When selected design skill guidance is present, keep the selected skill gates satisfied during revision.
22. Return one JSON object only with `tableGenerationResult` and `renderTree`, matching the provided output contract.

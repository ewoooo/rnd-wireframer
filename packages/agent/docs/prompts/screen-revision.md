# Screen Revision Prompt Contract

`screen-revision` revises a generated screen from prior result context and review feedback.

The prompt artifact must include:

- previous generation result
- review or validation findings
- source spec and screen intent when available

The output must be JSON only and match the revision step output contract declared by `@cx/inference`.

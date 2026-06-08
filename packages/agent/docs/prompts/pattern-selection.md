# Pattern Selection Prompt Contract

`pattern-selection` chooses layout pattern candidates for the planned screen composition.

The prompt artifact must include:

- composition plan
- decoration or layer candidates, when available
- layout catalog references
- relevant design context references

The output must be JSON only and match the pipeline step output contract declared by `@cx/inference`.

# Pattern Store Moved

Pattern store JSON is now owned by the `@cx/pattern-store` package.

Canonical location:

```text
packages/pattern-store/src/catalog/
```

`database/` is reserved for imported source files, AI-generated candidates, generated decks, and approved consumer table dumps. Pattern store is a shared design-runtime contract, so agent, web, and deck builders should import it from `@cx/pattern-store` or read the package catalog directory.

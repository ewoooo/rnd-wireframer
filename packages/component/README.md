# @cx/components

`@cx/components` is the UI vocabulary package for the screen generator. It exposes React components, one public component catalog, and CSS/token shims used by the preview renderer.

The package has one public vocabulary. Internally, entries can be `stable` or `candidate`, but consumers of `componentCatalog` should not branch on that status.

## Public Usage

Use only the package exports declared in `package.json`.

```ts
import { Button, CardSummary } from "@cx/components";
import { componentCatalog, getComponentCatalogEntry } from "@cx/components/catalog";
import "@cx/components/styles.css";
```

CSS and token compatibility exports are also public.

```css
@import "@cx/components/styles.css";
@import "@cx/components/tailwind.css";
@import "@cx/components/tokens.css";
```

`@cx/components/styles.css` includes component token aliases and imports `@cx/tokens/variables.css` through the component token shim. Applications that use Tailwind token utilities such as `gap-cx-12` must also import `@cx/components/tailwind.css` or `@cx/tokens/tailwind.css`.

Do not import implementation files or internal folders directly.

If a consumer needs a component, catalog lookup, mutation, resolver, or type that is not available from the public subpaths above, add it to the package public surface first instead of reaching into `src/` implementation folders.

## Directory Contract

```text
src/index.ts             public React component barrel
src/public/catalog.ts    public catalog read API and mutation API re-exports
src/public/mutations.ts  public pure CRUD mutation API
src/public/resolver.ts   public component type, alias, and prop lookup helpers
src/public/types.ts      public catalog contract, mutation, and issue types
src/internal/            registry assembly, audit, and mutation implementation
src/components/          stable component implementations
src/candidates/          candidate component implementations
src/tokens/              component token compatibility exports
src/__tests__/           package contract and render tests
```

Public consumers should import from `@cx/components`, `@cx/components/catalog`, `@cx/components/mutations`, `@cx/components/resolver`, or `@cx/components/types`. Files under `src/internal/`, `src/components/`, and `src/candidates/` are implementation details and must not be imported by other packages.

## Catalog Contract

`@cx/components/catalog` is the only catalog entrypoint exposed to agents, runtime renderers, editors, and app code.

The public `componentCatalog` is assembled from internal entries with these status values:

- `stable`: approved component implementations.
- `candidate`: proposed or generated component implementations that may participate in the same vocabulary.

Status metadata is internal package state. Public catalog entries expose only what consumers can use:

- component `type`
- render `kind`
- supported props
- supported variants
- token roles
- usage context and guidance
- AI-writable surfaces

## CRUD API

Catalog mutation APIs are pure functions. They receive an internal registry, return a new registry and public catalog in a result envelope, and do not write files or mutate package singletons.

```ts
import {
	createComponentCatalogEntry,
	deleteComponentCatalogEntry,
	promoteComponentCatalogEntry,
	readComponentCatalogEntry,
	updateComponentCatalogEntry,
	upsertComponentCatalogEntry,
} from "@cx/components/catalog";
```

The same mutation functions are also available from `@cx/components/mutations` when a consumer only needs write-like catalog operations.

## Resolver API

Resolver APIs are lookup helpers for the public catalog. They resolve canonical component types, aliases, and prop contracts.

```ts
import {
	componentCatalogAliases,
	getComponentCatalogEntry,
	getComponentCatalogTypes,
	getComponentPropContract,
} from "@cx/components/resolver";
```

Mutation functions return either `{ ok: true, registry, catalog, entry, changes }` or `{ ok: false, issues }`.

Use `promoteComponentCatalogEntry` to move an entry from `candidate` to `stable`. File writes, approval workflow, and git changes belong outside this package.

## Component Directories

### `components/`

Owns stable React component implementations. Components exported from `@cx/components` should live here.

### `candidates/`

Owns candidate React component implementations. Candidates are used when generation or runtime work needs a component surface that has not yet been promoted to `components/`.

Candidates can participate in the public catalog after package-level review, but they are not exported through candidate-specific package subpaths.

## Tokens

`@cx/components` owns component token aliases only. Token source of truth remains `@cx/tokens`.

Allowed token contents:

- `--skt-component-*` aliases for component height, radius, spacing, and variant colors.
- compatibility exports that point to `@cx/tokens`.

Disallowed token contents:

- raw color palette values
- foundation spacing, radius, or typography values
- semantic color values such as `--skt-color-text-*`

## Test Expectations

Package tests should verify the public surface, not implementation details.

- internal assembly can combine stable and candidate entries into the public catalog
- public catalog entries do not expose `status`
- CRUD functions are pure and return result envelopes
- enum props declare allowed values
- variant token keys match enum values
- direct candidate subpath imports are not exported

## Package Rules

- Keep external TypeScript imports limited to `@cx/components`, `@cx/components/catalog`, `@cx/components/mutations`, `@cx/components/resolver`, and `@cx/components/types`.
- Keep status metadata internal and limited to `stable | candidate`.
- Do not expose candidate-specific package subpaths.
- Do not add string-literal renderer branching for component types. Put reusable mapping data in the catalog contract.
- Do not place token source-of-truth files in this package. Use `@cx/tokens`.
- When adding or promoting a component, update the catalog and package tests in the same change.

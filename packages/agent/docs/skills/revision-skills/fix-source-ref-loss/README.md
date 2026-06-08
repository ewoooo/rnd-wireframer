# fix-source-ref-loss

Use when generated content loses required source references or invents source facts.

## Revision Target

- RenderTree text/content nodes
- Trace source references

## Fix Strategy

- Restore missing source facts from SourceSpec.
- Remove unsupported content.
- Attach source references to affected nodes where the contract supports it.

---
id: fix-source-ref-loss
kind: skill
family: revision
stages:
  - revise
tasks:
  - screen-revision
role: source-ref-fix
priority: required
whenToUse: "Use when generated content loses required source references or invents source facts."
tags:
  - source-fidelity
  - source-ref
  - revision
---

# fix-source-ref-loss

## Revision Target

- RenderTree text/content nodes
- Trace source references

## Fix Strategy

- Restore missing source facts from SourceSpec.
- Remove unsupported content.
- Attach source references to affected nodes where the contract supports it.

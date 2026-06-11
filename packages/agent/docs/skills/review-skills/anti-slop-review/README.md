---
id: anti-slop-review
kind: skill
family: review
stages:
  - review
tasks:
  - quality-review
role: anti-slop
priority: recommended
whenToUse: "Use when checking for generic, ungrounded, or decorative AI-design artifacts."
tags:
  - anti-slop
  - source-grounding
  - quality-review
---

# anti-slop-review

Checks for generic AI-design artifacts that reduce screen quality.

## Inputs

- RenderTree
- CompositionPlan
- Related design references

## Checks

- Avoids arbitrary decorative cards, repeated section shells, and ungrounded badges.
- Avoids one-note hierarchy where every section has equal weight.
- Avoids labels, empty copy, or visual treatment unsupported by source or SOT.

## Outputs

- Pass/fail
- Generic-design findings
- Suggested removal or simplification

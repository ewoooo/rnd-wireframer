---
id: design-fundamentals
kind: skill
family: design
stages:
  - understand
  - compose
  - generate
  - review
tasks:
  - screen-intent
  - composition-planning
  - screen-generation
  - quality-review
role: design-foundation
priority: required
whenToUse: "Use when a step must decide screen type, hierarchy, component role, action priority, state treatment, or visual grouping."
tags:
  - design-foundation
  - semantic-hierarchy
  - component-role
---

# design-fundamentals

RenderNode 기반 screen generation 전반에서 사용하는 공통 디자인 판단 규칙이다. Figma 실측값이나 구버전 component 이름을 그대로 강제하지 않고, source evidence를 screen, area, component role로 번역하는 의미론적 기준만 소유한다.

## Applies To

This skill applies to:

- `screen-intent`: infer the user task, pattern family, rejected patterns, and reference lookup hints.
- `composition-planning`: split content into semantic areas and choose section order.
- `screen-generation`: keep RenderNode output aligned to role, hierarchy, and action semantics.
- `quality-review`: detect hierarchy, density, action, and source-fidelity failures.

## Source Fundamentals

- `packages/agent/docs/skills/design-skills/design-fundamentals/source/COMPOSITION_LAYERS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/SCREEN_PATTERN_SUMMARY.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/SECTION_PATTERNS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/INTERACTION_PATTERNS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/COMPONENT_INVENTORY.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/VISUAL_FOUNDATION_OBSERVATIONS.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/DESIGN_FOUNDATION.md`
- `packages/agent/docs/skills/design-skills/design-fundamentals/source/LAYOUT_SPACING_CONTRACT.md`

## RenderNode Translation

- Treat old Figma layer names as evidence, not output vocabulary.
- Express output with the current `Screen -> Region -> Area -> Composite/Component` hierarchy.
- A `Screen` owns chrome, contents, and bottom action regions.
- An `Area` is a semantic task unit: input group, readonly summary, agreement group, selectable list, result summary, alert, overlay contents.
- A component should usually live inside an area or pattern slot, not directly under a screen route without semantic grouping.
- If a source pattern cannot be represented by current catalog/layout vocabulary, keep the semantic intent and produce a candidate/proposal signal instead of inventing unsupported node types.

## Pattern Selection

- Use form-entry when the user must input, edit, verify, validate, agree, request, submit, or pay before continuing.
- Use detail-confirmation when the main task is to review already-known information and confirm a decision.
- Use list-selection when row choice is the main task, not just supporting data display.
- Use completion-feedback when the screen reports the result of a completed action.
- Use bottom sheet when the current screen context should remain while the user chooses options, filters, or extra details.
- Use popup when the interaction is short, blocking, and decision-oriented.
- Use a main/list/detail pattern only when the source evidence is primarily browsing, exploration, long-form product detail, or dashboard management.

## Area Hierarchy

- Split areas by user task and information role, not by visual decoration.
- Separate editable inputs, readonly state, selectable options, agreements, warnings, and final summaries when they carry different decisions.
- Keep field-local helper, error, loading, verification, and resend actions near the affected field group.
- Keep legal agreements and policy details near their consent controls.
- Put final amount/order/result summaries after the inputs or selections they summarize.
- Do not flatten many fields or rows into one large anonymous section.

## Component Role Selection

- Use an input component only when the user can enter or edit a value.
- Use a readonly key-value row for confirmed state, account data, order details, dates, amounts, and labels with fixed values.
- Use a selectable row when choosing one or more options is the task.
- Use checkbox controls for consent, opt-in, required agreement, or boolean choices.
- Use callout/notice components for guidance, warnings, constraints, or state notices that affect a group.
- Use accordion/disclosure for long supporting content such as FAQ, policy details, product details, or terms.
- Use card/list containers when repeated items need a shared item contract, not as decoration.
- Use overlay action components inside the overlay context; do not move overlay actions into the parent screen bottom action.

## Action Hierarchy

- A screen should have one clear primary conversion action.
- Final continue, submit, request, apply, pay, confirm, or complete actions belong in the bottom action region when the screen has a fixed primary CTA.
- Field-local actions such as verify, resend, address lookup, duplicate check, or apply coupon remain next to the relevant field/group with lower visual hierarchy.
- Card-specific or section-specific actions stay inside that card/area.
- Secondary actions should look visually weaker than the primary CTA and should not reuse the same bottom-primary shape inside contents.
- Do not use BottomNavigation together with a fixed bottom primary action for the same screen task.

## Visual Semantics

- Use semantic token roles rather than primitive literal values.
- Typography follows display/headline/title/body/caption hierarchy; do not promote every label to a title.
- Divider means structural separation: section boundary, repeated row boundary, or disclosed-content boundary. It is not decoration.
- Radius should communicate nesting: outer containers own the larger visual boundary; inner elements should not visually overpower the parent boundary.
- System icons communicate UI function or state. Graphic icons communicate brand/service identity. Avoid mixing those roles in the same layer without a clear reason.
- Spacing and width should be controlled by layout/component contracts, not by route-level raw margins or copied Figma measurements.

## SourceSpec Additions

When source evidence strongly implies a missing support element, the generator may add a low-risk structural helper even if the source does not name it directly:

- section title for a group of related fields or rows.
- helper/error/state text immediately attached to an input group.
- divider between repeated list rows or between distinct semantic areas.
- compact field-local action for verification, lookup, resend, duplicate check, or coupon apply.
- bottom primary action when the source task clearly proceeds to the next step.
- callout for constraints, required notices, or caution that affects completion.

These additions must explain source evidence. Do not add marketing banners, decorative cards, or unrelated promotional content.

## Avoid

- Copying legacy Figma component names as required RenderNode output.
- Treating fixed sizes, px measurements, or observed coordinates as generation requirements.
- Mixing editable fields and readonly account/source state in one indistinct area.
- Turning an input screen into a summary-first confirmation screen.
- Promoting field-local verification or lookup actions into the screen-level primary CTA.
- Adding source-free banner, marketing block, illustration, or decorative card.
- Using dividers to increase visual density when there is no semantic boundary.
- Creating unsupported node types when the current catalog can express the role through existing components, layout, area, or proposal metadata.

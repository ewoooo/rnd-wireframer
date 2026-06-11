# fix-section-rhythm

Use when generated sections have inconsistent, monotonous, or source-inappropriate rhythm.

## Revision Target

- Area order
- Section grouping
- Spacing/layout pattern selection

## Fix Strategy

- Group related content into fewer, clearer sections.
- Preserve the primary decision path.
- Use design reference spacing contracts instead of local overrides.
- Remove `divider: "section"` from a contents area when it is the only contents section.
- Do not use section divider to separate Header/Contents/Bottom regions; that boundary belongs to screen chrome.

# Design Skills

Design skills are bounded Compose-stage references. They guide `CompositionPlan`, component/layout proposal, and quality review gates without owning runtime execution or schema contracts.

Each skill lives in its own folder:

```text
design-skills/<skill-id>/
  README.md
  references/
    README.md
```

Each skill `README.md` should define:

- `Applies To`
- `Required Design Docs`
- `Required SOT References`
- `Composition Rules`
- `Component/Layout Proposal Rules`
- `Good CompositionPlan Example`
- `Bad CompositionPlan Example`
- `Quality Gates`
- `Revision Hints`

The first implementation set is deliberately small:

- `detail-confirmation-screen`
- `form-entry-screen`
- `list-selection-screen`

Scaffolded follow-up skill folders:

- `account-status-alert`
- `bottom-sheet-decision`
- `comparison-choice-screen`
- `completion-feedback-screen`
- `data-summary-card-screen`
- `empty-state-guidance`
- `generic-composition`
- `main-task-screen`
- `multi-step-progress-screen`

# Design Skills

Design skills are bounded Compose-stage references. They guide `CompositionPlan`, component/layout proposal, and quality review gates without owning runtime execution or schema contracts.

Each skill should define:

- applies-to rules
- required design docs
- composition rules
- component/layout proposal rules
- good and bad `CompositionPlan` examples
- quality gates
- revision hints

The first implementation set is deliberately small:

- `detail-confirmation-screen`
- `form-entry-screen`
- `list-selection-screen`

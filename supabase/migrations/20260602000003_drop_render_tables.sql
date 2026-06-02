-- ============================================================
-- Drop temporary render_* mirror tables
-- Removed because the JSONB-heavy mirror schema is not suitable for the
-- DB-backed workbench/editing model.
-- ============================================================

drop table if exists render_components cascade;
drop table if exists render_areas cascade;
drop table if exists render_screens cascade;
drop table if exists render_screen_variants cascade;
drop table if exists render_screen_routes cascade;


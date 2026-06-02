-- ============================================================
-- Render table API privileges
-- RLS policies define row access; grants allow PostgREST roles to touch tables.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  render_screen_routes,
  render_screen_variants,
  render_screens,
  render_areas,
  render_components
to anon, authenticated;

grant select, insert, update, delete on table
  render_screen_routes,
  render_screen_variants,
  render_screens,
  render_areas,
  render_components
to service_role;

grant select, insert, update, delete on table
  render_screen_routes,
  render_screen_variants,
  render_screens,
  render_areas,
  render_components
to authenticated;


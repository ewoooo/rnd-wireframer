-- ============================================================
-- RLS 정책: 모든 테이블 anon/authenticated 읽기 허용
-- 이 서비스는 내부 도구이므로 SELECT는 전체 허용,
-- INSERT/UPDATE/DELETE는 authenticated만 허용
-- ============================================================

-- screen_routes
alter table screen_routes enable row level security;

create policy "anon can read screen_routes"
  on screen_routes for select to anon, authenticated using (true);

create policy "authenticated can write screen_routes"
  on screen_routes for all to authenticated using (true) with check (true);

-- screen_variants
alter table screen_variants enable row level security;

create policy "anon can read screen_variants"
  on screen_variants for select to anon, authenticated using (true);

create policy "authenticated can write screen_variants"
  on screen_variants for all to authenticated using (true) with check (true);

-- screens
alter table screens enable row level security;

create policy "anon can read screens"
  on screens for select to anon, authenticated using (true);

create policy "authenticated can write screens"
  on screens for all to authenticated using (true) with check (true);

-- organisms
alter table organisms enable row level security;

create policy "anon can read organisms"
  on organisms for select to anon, authenticated using (true);

create policy "authenticated can write organisms"
  on organisms for all to authenticated using (true) with check (true);

-- components
alter table components enable row level security;

create policy "anon can read components"
  on components for select to anon, authenticated using (true);

create policy "authenticated can write components"
  on components for all to authenticated using (true) with check (true);

-- component_renderer_kinds
alter table component_renderer_kinds enable row level security;

create policy "anon can read component_renderer_kinds"
  on component_renderer_kinds for select to anon, authenticated using (true);

create policy "authenticated can write component_renderer_kinds"
  on component_renderer_kinds for all to authenticated using (true) with check (true);

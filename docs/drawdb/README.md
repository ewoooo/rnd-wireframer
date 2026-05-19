# drawDB ERD

This directory stores drawDB artifacts for the RND Screen Generator database model.

## Source Files

- `rnd-screen-generator.postgres.sql`: PostgreSQL DDL import source for drawDB.
- `rnd-screen-generator.dbml`: DBML import source for drawDB and schema review.
- `rnd-screen-generator.erd.md`: lightweight Mermaid ERD preview.
- `exports/`: exported PNG/SVG/PDF review images from drawDB.
- `snapshots/`: dated drawDB JSON exports after visual layout edits.

## Workflow

1. Run local drawDB:

   ```bash
   cd /Users/plusx/Documents/drawdb-local
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

2. Open `http://127.0.0.1:5173/`.
3. Create a PostgreSQL diagram.
4. Import `docs/drawdb/rnd-screen-generator.dbml` or `docs/drawdb/rnd-screen-generator.postgres.sql`.
5. Arrange tables for review.
6. Export the drawDB JSON into `docs/drawdb/snapshots/`.
7. Export review images into `docs/drawdb/exports/`.

## Initial Setup

The local drawDB source is kept outside this repository:

```bash
git clone https://github.com/drawdb-io/drawdb.git /Users/plusx/Documents/drawdb-local
cd /Users/plusx/Documents/drawdb-local
npm install
```

This keeps the AGPL drawDB app source separate from this project while still using it as a local development tool.

## Import Source

Use this file when importing SQL:

```text
/Users/plusx/Documents/rnd-screen-generator/docs/drawdb/rnd-screen-generator.postgres.sql
```

Use this file when importing DBML:

```text
/Users/plusx/Documents/rnd-screen-generator/docs/drawdb/rnd-screen-generator.dbml
```

## Old Online Workflow

1. Open drawDB.
2. Create a PostgreSQL diagram.
3. Import `docs/drawdb/rnd-screen-generator.dbml` or `docs/drawdb/rnd-screen-generator.postgres.sql`.
4. Arrange tables for review.
5. Export the drawDB JSON into `docs/drawdb/snapshots/`.
6. Export review images into `docs/drawdb/exports/`.

`docs/development/DATA_MAP.md` remains the textual source of truth. The drawDB diagram is a visual review artifact, and final migration files belong in `supabase/migrations/`.

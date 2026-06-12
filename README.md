# Family Weekend Planner

Small shared web app for coordinating Cape house weekend availability.

## MVP

This repository starts with the vertical slice from `SPEC.md`:

- Roster-backed first-name login with HTTP-only cookie sessions.
- One active season generated from seed configuration.
- Weekend availability table with sticky family names and mobile horizontal scrolling.
- Editable own row with status and optional notes.
- Organizer users can edit any row.
- Weekend summary counts and highlight toggles.
- Prisma/PostgreSQL schema, migration, and seed script.
- No-index metadata and headers for basic anti-indexing.

## Local Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` from `.env.example` and set `DATABASE_URL` and `SESSION_SECRET`.

   For a local Homebrew Postgres database:

   ```sh
   createdb family_weekend_planner
   ```

   Then use:

   ```env
   DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/family_weekend_planner"
   SESSION_SECRET="replace-with-at-least-32-random-characters"
   ```

3. Apply the database migration and seed the active season:

   ```sh
   npm run db:deploy
   npm run db:seed
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

The seed script reads these optional environment variables:

- `SEED_SEASON_YEAR`
- `SEED_SEASON_START`
- `SEED_SEASON_END`
- `SEED_FAMILY_MEMBERS`, comma-separated display names
- `SEED_ORGANIZER_FIRST_NAME`

## Family Holidays

Family holidays such as birthdays can be added in code for now in `src/lib/holidays.ts` by editing the `FAMILY_HOLIDAYS` array. Each entry is a recurring date:

```ts
{ label: "Grace Birthday", month: 7, day: 12 }
```

A future settings screen should move these into the database so they can be managed from the app.

## Deployment

Set these environment variables in the host:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_BASE_URL`

Run migrations during deployment with `npm run db:deploy`, then run the seed script once for the initial season and roster. The app build runs `prisma generate` before `next build`.

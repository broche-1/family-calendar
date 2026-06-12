# Family Weekend Planner Spec

## 1. Overview

Family Weekend Planner is a lightweight shared web app for coordinating summer weekends at the Cape house. It replaces a shared note/table where weekends are columns, family members are rows, and each person marks whether they are free, busy, maybe available, or not yet answered.

The default experience should preserve the clarity of the original table while adding better filtering, calendar views, persistence, mobile support, and a simple browser-based login flow.

## 2. Goals

- Make it easy for each family member to mark their weekend availability.
- Make it easy to identify weekends where everyone, or most people, are free.
- Keep access simple enough for non-technical family members.
- Work from any modern web browser on desktop or mobile.
- Preserve optional context: people can share what they are doing when busy, but they do not have to.
- Support a summer season at a time, with room to support future summers.

## 3. Non-Goals for the MVP

- Full consumer-grade account management with email/password login.
- Payments, reservations, travel booking, or itinerary planning.
- Complex group permissions or household-level delegation.
- Native iOS or Android apps.
- Automatic Google Calendar or Apple Calendar syncing.
- Real-time chat.
- Automated reminder notifications for missing availability.

## 4. Core Users

- Family member: logs in with their first name and edits their own availability.
- Organizer: configures the season, family roster, and app settings, but does not edit other people's availability in the MVP.
- Viewer: any logged-in family member can view the full availability grid.

For the MVP, the organizer can be a configured first name or a simple admin mode rather than a separate formal role system.

## 5. Key Concepts

- Season: a configured summer period, usually one calendar year. The default season runs from Memorial Day weekend through Labor Day weekend, with manual date picker overrides.
- Weekend: a Friday-to-Sunday range inside the season.
- Family member: a person on the shared roster.
- Availability entry: one family member's status and optional note for one weekend.
- Status:
  - Unknown: no answer yet.
  - Free: available for the Cape house.
  - Busy: unavailable.
  - Maybe: uncertain or partially available.

## 6. Functional Requirements

### 6.1 Public Web Access

- The app must be accessible through a public HTTPS URL.
- The public URL should not expose private data until a family member logs in.
- The app should be usable without installing anything.
- The app should include basic anti-indexing headers or metadata so search engines are discouraged from indexing the planner.

### 6.2 First-Name Login

- Users log in by selecting or entering their first name.
- The app validates the first name against the configured family roster.
- First names must be unique in the roster for MVP login to be unambiguous.
- A successful login stores a session in a secure cookie.
- The session identifies the selected family member.
- The user can log out or switch family member.

Security note: first-name login is intentionally low-friction, not high-security. It is appropriate only if the data is low sensitivity and the URL is shared carefully. A later version can add a shared family passcode, magic links, or per-person PINs.

### 6.3 Default Availability Table

- The default post-login view is a grid.
- Rows represent family members.
- Columns represent weekends.
- Each cell displays that member's status for that weekend.
- The logged-in user can edit their own row directly.
- Other rows are read-only for regular family members.
- Other rows are read-only for organizers as well in the MVP.
- Weekend column headers show human-friendly date labels, such as `Jun 28-30`.
- The table should remain usable on mobile with horizontal scrolling, sticky member names, and compact cells.

### 6.4 Editing Availability

- A user can set one of their own cells to Free, Busy, Maybe, or Unknown.
- A user can optionally add a short note to one of their own cells.
- Notes are visible to all logged-in family members.
- A cell should show whether a note exists even in compact table mode.
- Katie and Elizabeth can optionally add a Jane Forecast when they mark themselves Free.
- Jane Forecast is a guest signal only; it does not add Jane to the roster or affect free/busy summary counts.
- Changes should be saved immediately or with a clear save state.
- The app should show a clear error if saving fails.
- No family member can edit another family member's availability in the MVP.

### 6.5 Highlight and Filter Controls

- Users can toggle highlights for:
  - Free weekends, everyone: every active family member is Free.
  - Free weekends, most: at least a configurable threshold are Free.
  - Needs responses: at least one active family member is Unknown.
  - My free weekends: weekends where the logged-in user is Free.
  - My busy weekends: weekends where the logged-in user is Busy.
- Highlighting should visually emphasize matching weekend columns while keeping the full table visible.
- The "most" threshold should default to a simple majority, with an organizer-configurable override.

### 6.6 Calendar Views

- Users can switch between:
  - Table view: default coordination grid.
  - Month calendar view: traditional calendar layout with weekends summarized.
  - Weekend list view: compact list of weekends with availability summaries.
- Calendar views should support the same highlight/filter controls where practical.
- Calendar views should allow the logged-in user to edit their own availability for a weekend.

### 6.7 Summary Signals

- Each weekend should show a summary count:
  - Free count.
  - Busy count.
  - Maybe count.
  - Unknown count.
- The app should make high-opportunity weekends visually obvious.
- The app should avoid hiding missing responses; unknowns should be visible.
- Every active family member counts equally in summary calculations.

### 6.8 Season and Roster Management

- Organizer can configure:
  - Season name.
  - Season start and end dates, defaulting to Memorial Day weekend through Labor Day weekend.
  - Generated weekends.
  - Family members.
  - Active or inactive family members.
  - "Most free" threshold.
- Organizer can manually override the default season dates with date picker controls.
- The app should support at least one active season.
- Future seasons should be possible without deleting past data.

### 6.9 Responsive and Accessibility Requirements

- The app must work on desktop, tablet, and mobile browsers.
- Status colors must not be the only way to distinguish state; use labels, icons, or patterns as well.
- Interactive controls must be keyboard accessible.
- Table headers and row labels should remain understandable to screen readers.
- Text must remain readable on small screens.

### 6.10 Audit and Recovery

- Each availability update stores `updatedAt`.
- The UI should show recent edit timestamps in a cell detail panel or tooltip.
- The MVP does not need a full change history, but the data model should not prevent adding one later.

## 7. MVP Scope

The first build should include:

- Public web app shell.
- Roster-backed first-name login.
- One active season.
- Auto-generated Friday-to-Sunday weekend columns from configured start and end dates.
- Default season dates from Memorial Day weekend through Labor Day weekend, with manual date picker overrides.
- Default table view.
- Per-cell status editing for the logged-in user's row.
- Optional notes per cell.
- Weekend summary counts.
- Highlight controls for everyone free, most free, needs responses, my free, and my busy.
- Basic organizer configuration stored in the database or seed data.
- Responsive styling for desktop and mobile.
- Deployment-ready configuration.

## 8. Post-MVP Enhancements

- Shared family passcode or per-person PIN.
- Magic-link login by email or SMS.
- Real-time updates across open browsers.
- Multiple houses or locations.
- Calendar export or subscription feed.
- Google Calendar / Apple Calendar import.
- Per-weekend planning notes, meals, rooms, travel plans, and headcounts.
- Comments or lightweight discussion per weekend.
- Full edit history and undo.

## 9. Suggested Technical Approach

### 9.1 Stack

Use a small full-stack TypeScript app:

- Framework: Next.js with App Router.
- Language: TypeScript.
- Styling: Tailwind CSS or CSS modules.
- Database: PostgreSQL.
- ORM: Prisma or Drizzle.
- Hosting: Vercel, Render, Fly.io, or another provider that can host a public HTTPS app.
- Database hosting: Neon, Supabase Postgres, Railway Postgres, or managed Postgres from the app host.

Reasoning:

- Next.js provides server-rendered pages, API routes/server actions, cookie sessions, and simple deployment paths.
- PostgreSQL keeps the data model straightforward and durable.
- A TypeScript-first stack keeps shared types available across UI and server code.

### 9.2 Architecture

- Browser client renders the table and calendar views.
- Server routes handle login, logout, session lookup, season data, roster data, and availability updates.
- Database stores seasons, weekends, family members, and availability entries.
- The UI fetches one season payload containing weekends, roster, availability, and summary counts.
- Mutations update a single availability cell and return the updated season summary.

For the MVP, polling or manual refresh is acceptable. Real-time updates can be added later with WebSockets, Server-Sent Events, Supabase Realtime, or Pusher.

### 9.3 Data Model

```text
FamilyMember
- id
- firstName
- displayName
- color
- isActive
- isOrganizer
- createdAt
- updatedAt

Season
- id
- name
- year
- startDate
- endDate
- mostFreeThreshold
- isActive
- createdAt
- updatedAt

Weekend
- id
- seasonId
- startDate
- endDate
- label
- sortOrder

Availability
- id
- seasonId
- weekendId
- familyMemberId
- status
- note
- janeForecast
- updatedAt

Session
- id
- familyMemberId
- tokenHash
- expiresAt
- createdAt
```

Constraints:

- `FamilyMember.firstName` must be unique among active members for MVP.
- Duplicate first names are not handled in the MVP.
- `Availability` should be unique by `weekendId` and `familyMemberId`.
- `status` should be constrained to `unknown`, `free`, `busy`, or `maybe`.
- `janeForecast` should be nullable and only set for Katie or Elizabeth when their status is `free`.

### 9.4 API Surface

Possible server routes:

- `POST /api/login`
  - Input: first name.
  - Output: session cookie and current member.
- `POST /api/logout`
  - Clears session cookie.
- `GET /api/me`
  - Returns logged-in member and organizer flag.
- `GET /api/seasons/active`
  - Returns active season, weekends, roster, availability, and summaries.
- `PATCH /api/availability/:id` or `PUT /api/availability`
  - Updates one member/weekend status and note.
  - Requires the session member to match the availability member being updated.
- `GET /api/admin/config`
  - Organizer-only app configuration.
- `PUT /api/admin/config`
  - Organizer-only season and roster updates.

Next.js server actions can replace some API routes if that pattern is preferred during implementation.

### 9.5 UI Structure

Primary screens:

- Login screen:
  - First-name input or roster picker.
  - Simple family-facing copy.
- Planner screen:
  - Top bar with active season, logged-in member, logout/switch control.
  - View switcher for table, month, and list views.
  - Highlight controls.
  - Main table/calendar/list view.
  - Cell detail editor.
- Organizer screen:
  - Roster management.
  - Season configuration.
  - Threshold settings.

Core components:

- `AvailabilityTable`
- `WeekendColumnHeader`
- `MemberRow`
- `AvailabilityCell`
- `CellEditor`
- `HighlightToolbar`
- `ViewSwitcher`
- `MonthCalendarView`
- `WeekendListView`
- `WeekendSummary`
- `RosterEditor`
- `SeasonEditor`

### 9.6 Availability Calculations

For each weekend:

- Count active family members by status.
- `everyoneFree` is true when all active members have status `free`.
- `mostFree` is true when free count is at least `mostFreeThreshold`.
- `needsResponses` is true when unknown count is greater than zero.
- Children and adults use the same `FamilyMember` model and count equally.

If a member has no `Availability` row for a weekend, treat the status as `unknown`.

### 9.7 Deployment and Configuration

Environment variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_BASE_URL`
- `ADMIN_SETUP_SECRET` or equivalent one-time setup control

Deployment requirements:

- HTTPS enabled.
- Secure, HTTP-only session cookies.
- Database migrations run on deploy.
- Seed script for initial roster and season.
- Basic backup/export path for the database.

### 9.8 Privacy and Security

- Treat the URL as shareable but private.
- Do not expose planner data before login.
- Use secure HTTP-only cookies.
- Store session tokens hashed in the database.
- Add basic rate limiting to login attempts.
- Avoid storing highly sensitive personal details in notes.
- Consider adding a shared family passcode before wider sharing.

## 10. Product Decisions

- Family members can edit only their own availability.
- A weekend means Friday through Sunday.
- The default Cape season runs from Memorial Day weekend through Labor Day weekend.
- The season date range can be manually overridden with date picker controls.
- Duplicate first names will be handled later; the MVP assumes unique active first names.
- Every family member counts the same for "everyone free" and "most free" calculations.
- Historical inactive-member visibility is out of scope for now.
- Optional free-text notes are enough; structured busy reasons are not part of the MVP.
- The app will not send reminders for missing availability.
- Jane Forecast is tracked only as a playful guest signal from Katie or Elizabeth free weekends and does not affect roster counts.

## 11. Recommended First Implementation Milestone

Build a vertical slice that supports one seeded season and one seeded roster:

1. Create the Next.js app, database schema, migrations, and seed script.
2. Implement first-name login against the seeded roster.
3. Render the default availability table.
4. Let the logged-in user edit their own status and note.
5. Add summary counts and highlight buttons.
6. Verify desktop and mobile layouts.
7. Deploy to a public staging URL.

This milestone proves the central workflow before investing in admin screens, richer calendar views, or authentication upgrades.

## 12. Change Log

### 2026-06-12

- Logged product decisions from the open-question review.
- Clarified that users can edit only their own availability, including organizers in the MVP.
- Fixed the weekend definition as Friday-to-Sunday.
- Set the default season to Memorial Day weekend through Labor Day weekend with manual date picker overrides.
- Confirmed duplicate first names, historical inactive-member visibility, structured busy reasons, and reminders are out of scope for the MVP.
- Confirmed every family member counts equally in availability summaries.
- Added Jane Forecast as a Katie/Elizabeth-only guest signal for free weekends.

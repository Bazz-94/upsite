# ae-00 - Store and schema

## Plan
Build the content store as three layers. `src/shared/content/` holds the domain types and the Zod
schemas that validate them — pure, isomorphic, no database. `src/server/content/` holds the store
itself: a repository interface, an in-memory repository for tests, a Prisma repository for Postgres,
and the services that everything else in the project calls. `prisma/` holds the schema, the migration
and an idempotent seed script.

Storage is normalized Postgres through Prisma, using class-table inheritance for sections: a `Section`
base row carries what every section shares, and a child row per type carries its own fields. Every page
has a draft row set and a published row set, discriminated by a `kind` column.

The write side is deliberately small: reads, one whole-page `saveDraft`, and the publishing moves.
ae-20 and ae-25 build their add/reorder/delete on top by reading the draft, changing it and saving it,
so validation only ever runs in one place.

Tests run against the in-memory repository, so `npm test` needs no database. The Prisma repository is
covered by one integration test that skips when `DATABASE_URL` is unset, and is excluded from the
coverage threshold.

## API Design
* **`prisma/schema.prisma`** - new. The tables. `Page` holds what does not vary between copies,
  `PageVersion` holds the per-copy title and hero image name, and sections hang off the page with a
  `kind` column telling draft rows from published ones.
* **`src/shared/content/types.ts`** - new. The domain model: `Page`, `PageContent`, `NavEntry`,
  `PageVersionKind`, a base `Section` and the `ParagraphSection` / `ImageSection` / `ListSection`
  types that extend it as a discriminated union, plus `ListField`, `ListItem` and `ListValue`.
  Images are referenced by name (`imageName: string`), never by location.
* **`src/shared/content/schemas.ts`** - new. Zod schemas mirroring the types, the single source of
  validation for saving, seeding and (later) ae-35's import.
* **`src/shared/content/errors.ts`** - new. `ContentValidationError`, carrying field-level issues so
  callers can report which field failed and why.
* **`src/server/content/repositories/content-repository.ts`** - new. The `ContentRepository`
  interface the store depends on. This is the seam that lets storage change without touching pages.
* **`src/server/content/repositories/memory-repository.ts`** - new. In-memory implementation, used by
  every unit test.
* **`src/server/content/repositories/prisma-repository.ts`** - new. Postgres implementation. Maps
  between the domain model and the normalized tables; holds no business rules.
* **`src/server/content/store.ts`** - new. `createContentStore(repository)` assembling the grouped
  services into one `ContentStore`.
* **`src/server/content/services/pages.ts`** - new. `getPublished`, `getDraft`, `listNav`, `create`,
  `delete`, `saveDraft`.
* **`src/server/content/services/publishing.ts`** - new. `publish`, `discard`, `unpublish`,
  `hasUnpublishedChanges`.
* **`src/server/content/index.ts`** - new. Exports the `contentStore` singleton bound to the Prisma
  repository. This is what the rest of the project imports.
* **`src/server/content/seed-data.ts`** - new. The Home, Activities and About placeholder content.
* **`src/server/prisma.ts`** - new. The Prisma client singleton, `import 'server-only'`.

## Context
* **`src/`** - only `app/` exists (`layout.tsx`, `page.tsx`, `globals.css`, `favicon.ico`). This task
  creates `src/server/`, `src/shared/`, `src/server.tests/` and `src/shared.tests/`.
* **`package.json`** - dependencies are `next` 16.3.4, `react`, `react-dom` and nothing else. No
  database driver, no ORM, no validation library.
* **`jest.config.ts:15`** - coverage from `src/server/**` and `src/shared/**` at 95%, node
  environment, `testMatch` `src/server.tests/` and `src/shared.tests/`. `passWithNoTests: true` is meant
  to go once the first tests land, which is sub-task 1.
* **`eslint.config.mjs:22`** - cyclomatic complexity max 10 (error), 50 lines per function (warn).
  The section mapping in the Prisma repository is the place most likely to hit both; split it per
  section type rather than one long switch.
* **`.gitignore:32`** - `.env*` is ignored, so `.env.example` is the only env file committed.
* **`tsconfig.json`** - path alias `@/*` → `./src/*`.
* **Tests** - none exist. Every test file here is new; nothing is re-run for regression.

## 1. **Domain types and validation**
  - **Status**: Done
  - **TODO**: Add `zod`. Write the domain types in `src/shared/content/types.ts` — base `Section`
    with the three section types extending it as a discriminated union on `type`. Mirror them in
    `schemas.ts` with Zod, and add `ContentValidationError` in `errors.ts` carrying the failing field
    paths and reasons. Barrel them through `index.ts`. Remove `passWithNoTests` from `jest.config.ts`
    and add the prisma-repository exclusion to `collectCoverageFrom` now, so later sub-tasks do not
    have to touch it. JSDoc on every type member and function.
  - **Files**: `package.json`, `src/shared/content/types.ts`, `src/shared/content/schemas.ts`,
    `src/shared/content/errors.ts`, `src/shared/content/index.ts`,
    `src/shared.tests/content/schemas.test.ts`, `jest.config.ts`
  - **Acceptance criteria**: `npm test` runs real tests and passes. `npm run test:coverage` reports
    ≥95% on `src/shared`. `npm run lint` is clean. Each of these is rejected naming the field and the
    reason: an empty slug, a slug containing spaces, a paragraph section with an empty body, an image
    section with no image name, a list item holding a value for a field id the list does not define,
    and two sections sharing a position.

## 2. **Prisma schema, migration and client**
  - **Status**: Done
  - **TODO**: Add `prisma`, `@prisma/client` and `server-only`. Write `prisma/schema.prisma` using
    class-table inheritance: `Page` (slug unique, navOrder, navVisible, published) → `PageVersion`
    (pageId, kind, title, heroImageName) for the per-copy fields that are not sections → `Section`
    (pageId, kind, position, type) → `ParagraphSection` / `ImageSection` / `ListSection` 1:1 on
    `sectionId`, with `ListField`, `ListItem` and `ListValue` under the list
    section. Cascade deletes down the chain, unique `(pageId, kind, position)`. Generate the initial
    migration. Add `db:migrate`, `db:deploy`, `db:seed` and `db:setup` scripts. Write `.env.example`
    with `DATABASE_URL`, and a short README section on pointing it at a local Postgres. Add
    `src/server/prisma.ts` as the client singleton with `import 'server-only'`.
  - **Files**: `package.json`, `prisma/schema.prisma`, `prisma/migrations/**`, `.env.example`,
    `README.md`, `src/server/prisma.ts`
  - **Acceptance criteria**: `npx prisma validate` passes. `npx prisma migrate dev` against a local
    `DATABASE_URL` creates all nine tables. `npm run build` succeeds. `npm test` still passes —
    nothing imports the client yet.

## 3. **Repository interface and in-memory repository**
  - **Status**: Done
  - **TODO**: Define `ContentRepository` in
    `src/server/content/repositories/content-repository.ts` — the operations the store needs, in
    domain types only, with no Prisma types leaking through. Implement `memory-repository.ts` against
    it, storing draft and published copies separately per page.
  - **Files**: `src/server/content/repositories/content-repository.ts`,
    `src/server/content/repositories/memory-repository.ts`,
    `src/server.tests/content/repositories/memory-repository.test.ts`
  - **Acceptance criteria**: A page carrying all three section types round-trips unchanged, section
    and list order preserved. Editing the draft leaves the published copy untouched, and the reverse.
    Deleting a page removes its sections, list fields, items and values. `npm run test:coverage`
    reports ≥95%. `npm run lint` is clean.

## 4. **Content store services**
  - **Status**: Done
  - **TODO**: Write `services/pages.ts` (`getPublished`, `getDraft`, `listNav`, `create`, `delete`,
    `saveDraft`) and `services/publishing.ts` (`publish`, `discard`, `unpublish`,
    `hasUnpublishedChanges`). `saveDraft` validates with the Zod schemas first and only then syncs
    rows by id — insert new, update existing, delete removed. Assemble them in
    `createContentStore(repository)`.
  - **Files**: `src/server/content/store.ts`, `src/server/content/services/pages.ts`,
    `src/server/content/services/publishing.ts`, `src/server.tests/content/pages.test.ts`,
    `src/server.tests/content/publishing.test.ts`
  - **Acceptance criteria**: `getPublished` returns null for an unknown slug and for a page that is
    not published. `listNav` returns only published, nav-visible pages, in nav order. `saveDraft`
    with invalid content throws `ContentValidationError` and the stored draft is unchanged.
    `publish` makes the draft the published copy; `discard` restores the draft from published;
    `unpublish` removes the page from `getPublished` and `listNav` without deleting it;
    `hasUnpublishedChanges` is false straight after a publish and true after any draft edit.
    `npm run test:coverage` reports ≥95%. `npm run lint` is clean — no function over the complexity
    cap.

## 5. **Prisma repository and integration test**
  - **Status**: Done
  - **TODO**: Implement `prisma-repository.ts` against `ContentRepository`, mapping domain types to
    the normalized tables and back. Reads pull a page with its sections and children in one query;
    writes run in a transaction. Keep the per-type mapping in separate small functions so no function
    exceeds the complexity cap. Add `src/server/content/index.ts` exporting the `contentStore`
    singleton bound to this repository. Write an integration test that runs the same round-trip
    assertions as sub-task 3 and skips itself when `DATABASE_URL` is unset.
  - **Files**: `src/server/content/repositories/prisma-repository.ts`,
    `src/server/content/index.ts`,
    `src/server.tests/content/repositories/prisma-repository.integration.test.ts`
  - **Acceptance criteria**: With `DATABASE_URL` set, the integration test runs and passes. With it
    unset, the file skips and `npm test` passes. `npm run test:coverage` still reports ≥95%.
    `npm run build` succeeds. `npm run lint` is clean.

## 6. **Seed data and seed script**
  - **Status**: Done
  - **TODO**: Write `seed-data.ts` with placeholder content for Home, Activities and About, between
    them using all three section types — Activities carries the list section so its field definitions
    and items are exercised. Write `prisma/seed.ts` to seed through the store, idempotently: if any
    page exists it does nothing. Wire the `prisma.seed` config in `package.json`.
  - **Files**: `src/server/content/seed-data.ts`, `prisma/seed.ts`, `package.json`,
    `src/server.tests/content/seed-data.test.ts`
  - **Acceptance criteria**: Every seed page passes the Zod schemas. Seeding an empty store creates
    Home, Activities and About, all published, each with its draft identical to its published copy,
    and `hasUnpublishedChanges` false for all three. Seeding twice changes nothing. On an empty
    database `npm run db:setup` leaves those three pages present and published.

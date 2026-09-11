# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A website that is updatable through an admin page. Built on Next.js 16 App Router (React 19, Tailwind v4, TypeScript). The content store is in place — Postgres through Prisma 7, reached only through `src/server/content/` — and the pages it serves are seeded placeholders. No admin page or public site UI exists yet; `src/client/` is still empty.

Read `.claude/rules/standards.md` before writing code — it is the source of truth for structure and conventions (JSDoc on every function and property, Zustand for state, never mix `'use server'` and `'use client'` in one file). Zustand is not installed yet; add it when state management starts.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — eslint (flat config, `eslint.config.mjs`)
- `npm test` — jest, backend only (`test:watch`, `test:coverage`)
- `npm test -- src/server.tests/foo.test.ts` — one file; add `-t "name"` for one test
- `npm run test:ui` — playwright, UI only (`test:ui:headed`, `test:ui:report`)
- `npx playwright test src/app.tests/home.spec.ts` — one UI file

Tests live in a `.tests` dir per source dir: `src/app.tests/` (Playwright `*.spec.ts`),
`src/server.tests/` and `src/shared.tests/` (Jest `*.test.ts`).

Jest is backend-only: `jest.config.ts` uses `next/jest`, runs in the `node` environment, and
only picks up `src/server.tests/` and `src/shared.tests/`. Coverage is collected from `src/server/`
and `src/shared/` with a 95% threshold, minus the database wiring and the Prisma repository, which
the integration test covers instead.

Playwright (`playwright.config.ts`) covers the UI in Chromium. It starts `npm run dev` itself
(reusing a running one locally) and hits `http://localhost:3000`, overridable with
`PLAYWRIGHT_BASE_URL`. React components are not unit tested — no jsdom or React Testing Library.

ESLint adds three limits on top of `eslint-config-next`: cyclomatic complexity max 10 (error), max nesting depth 6, max 50 lines per function (both warn).

## Content store

Content lives in Postgres. `npm run db:setup` applies the migrations and seeds Home, Activities and
About; see the README for `DATABASE_URL`. The Prisma client is generated into `src/generated/prisma`
(gitignored, rebuilt by `postinstall`), and Prisma is configured in `prisma7.config.ts`, not
package.json.

Everything reads and writes through `contentStore` from `@/server/content` — `pages` for reads,
`create`, `delete` and one whole-page `saveDraft`, and `publishing` for moving a draft to the
published copy and back. Content is validated by the Zod schemas in `src/shared/content/` on the way
in, so the rules live in one place; bad content raises `ContentValidationError`, which names each
failing field. Storage sits behind `ContentRepository`, with a Postgres implementation and an
in-memory one the tests use.

The Prisma integration test runs only when `TEST_DATABASE_URL` is set, and empties the tables it
uses — never point it at your development database.

## Architecture

- Code is split by where it runs: `src/app/` (routing + UI only), `src/server/` (server only, `import 'server-only'`), `src/shared/` (isomorphic), `src/client/` (client only, `import 'client-only'`). Client code reaches the server only through `'use server'` functions exported from `src/server/`. See `.claude/rules/standards.md`.
- `src/app/layout.tsx` is the root layout (Geist fonts, `globals.css`); `src/app/page.tsx` is the home page. `public/` and all config files stay at the repo root.
- Route component props come from globals that Next generates into `.next/types/routes.d.ts`: type pages as `PageProps<'/some/route'>` and layouts as `LayoutProps<'/some/route'>`. Don't hand-write these prop types. Note `params` and `searchParams` are Promises and must be awaited.
- Tailwind v4 runs through `@tailwindcss/postcss`; there is no `tailwind.config.js`. Theme tokens live in `src/app/globals.css` under `@theme inline`.
- Path alias `@/*` maps to `src/` (so `@/app/_lib/x` → `src/app/_lib/x`).

The bundled docs in `node_modules/next/dist/docs/` are split into `01-app`, `02-pages`, `03-architecture`, and `04-community` — see AGENTS.md above for why you should read them first.

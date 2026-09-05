# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A website that is updatable through an admin page. Right now it is a fresh Next.js 16 App Router scaffold (React 19, Tailwind v4, TypeScript) — no admin page or custom features exist yet.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — eslint (flat config, `eslint.config.mjs`)
- `npm test` — jest (`test:watch`, `test:coverage`)

Jest is backend-only: `jest.config.ts` uses `next/jest`, runs in the `node` environment, and
only picks up `lib/**/*.test.ts` and `__tests__/**/*.test.ts`. Coverage is collected from
`lib/` with a 95% threshold. `passWithNoTests` is on until the first tests land — remove it then.
No UI test setup (jsdom, React Testing Library) is installed.

## Architecture

- App Router only, under `app/`. `app/layout.tsx` is the root layout (Geist fonts, `globals.css`); `app/page.tsx` is the home page.
- Route component props come from globals that Next generates into `.next/types/routes.d.ts`: type pages as `PageProps<'/some/route'>` and layouts as `LayoutProps<'/some/route'>`. Don't hand-write these prop types. Note `params` and `searchParams` are Promises and must be awaited.
- Tailwind v4 runs through `@tailwindcss/postcss`; there is no `tailwind.config.js`. Theme tokens live in `app/globals.css` under `@theme inline`.
- Path alias `@/*` maps to the repo root.

The bundled docs in `node_modules/next/dist/docs/` are split into `01-app`, `02-pages`, `03-architecture`, and `04-community` — see AGENTS.md above for why you should read them first.

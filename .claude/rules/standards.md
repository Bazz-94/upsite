# Standards

## Project

An website that is updatable through an admin page. Built with Next.js (App Router) and Tailwind CSS.

- **Shared files**: Code shared across pages goes in `src/shared/` (isomorphic logic), `src/server/` (server only) or `src/app/_components/` (UI). No duplicating per page.
- **Abstraction**: Shared systems (e.g. caching) go through one common interface, so implementation can change without touching pages.
- **Styling**: Component styling pulls from shared design tokens/theme, not one-off hardcoded values, for consistent look across pages.
- **Unit test**: We will unit test backend code.

### Structure

Code is split by where it runs. `app/` is for routing and UI only — no data access, no secrets.

```
src/
├── app/                     # Next.js App Router pages and layouts. Routing + UI only.
│   └── page.tsx             # Dir per page, with its own layout and components.
├── server/                  # Server only code. See rules below.
├── shared/                  # Isomorphic code: types, pure functions, validation schemas.
├── client/                  # Client only code: components, zustand stores, hooks, browser APIs.
└── app.tests/               # Tests dir, it mirrors the src structure.
    ├── server/
    └── shared/
```

### Where code goes

- **`src/server/`** — data access, secrets, filesystem, auth checks, business logic. Every file starts with `import 'server-only'`, except `'use server'` files (the directive already pins those to the server).
- **`src/shared/`** — safe to run on either side. Imports nothing from `server/` or `client/`. If a file needs `server-only`, it was never shared.
- **`src/client/`** — starts with `import 'client-only'`.
- **The boundary**: client code reaches the server only through `'use server'` functions exported from `src/server/`. Nothing else crosses.
- **`public/`** and all config files stay at the repo root, not in `src/`.
- **Path alias**: `@/*` maps to `src/*`, so `@/server/content` is `src/server/content.ts`.

## Design Principles

- **Clean Architecture**: Dependencies point inward only, toward Domain layer. Business logic, orchestration, infrastructure stay separated.
- **Services**: Group logic into services to decouple parts of app.
- **Prefer Deep Modules**: Avoid shallow modules that are just a few lines of code. Deep modules with clear responsibilities are easier to maintain and test.

## TS Standards
- Follow standard TypeScript best practices. (Placeholder — replace with specific rules once defined.)
- Every function and every property (type/interface members, class fields) has a JSDoc description (`/** ... */`). Use `@param`/`@returns` where the signature alone isn't self-evident.
- Always add descriptions to functions and properties. Use JSDoc comments.

## React
- Prefer creating new components so you don't repeat yourself. This is especially important for tailwind.
- Use Zustand for state management.
- For Zustand creates self-contained stores with data and actions together.

## Nextjs Standards
- Don't use 'use server' and 'use client' in the same file. Declare server functions or client only components in separate files and import them to interact.
- This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Code Quality
- Use Jest to test backend code — `src/server/` and `src/shared/`. Code coverage should be at least 95%.
- Use ESLint to enforce code style and to keep code complexity low. Enforce a maximum cyclomatic complexity of 10.
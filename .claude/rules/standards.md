# Standards

## Project

An website that is updatable through an admin page. Built with Next.js (App Router) and Tailwind CSS.

- **Shared files**: Code shared across functions goes in `lib/` (logic/utilities) or `components/` (UI) at project root. No duplicating per tool.
- **Abstraction**: Shared systems (e.g. caching) go through one common interface, so implementation can change without touching tools.
- **Styling**: Component styling pulls from shared design tokens/theme, not one-off hardcoded values, for consistent look across tools.
- **Unit test**: We will unit test backend code.

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
- Use Jest to test backend code. Code coverage should be at least 95% for all backend code.
- Use ESLint to enforce code style and to keep code complexity low. Enforce a maximum cyclomatic complexity of 10.
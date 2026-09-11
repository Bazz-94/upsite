# upsite
An website that is updatable through an admin page.

## Database

Content lives in Postgres — a local server in development, Neon in production. The same schema
runs in both.

1. Copy `.env.example` to `.env` and point `DATABASE_URL` at your Postgres, e.g. a database
   called `upsite` on a local server:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/upsite?schema=public"
   ```

   Create the database first if it does not exist: `createdb upsite`.

2. Apply the schema and load the starting content:

   ```
   npm run db:setup
   ```

`npm run db:migrate` creates a new migration after a schema change, `npm run db:deploy` applies
existing migrations, and `npm run db:seed` loads the starting pages. Seeding is idempotent — it
does nothing if any page already exists.

The Prisma repository has an integration test that runs only when `TEST_DATABASE_URL` is set.
It empties the tables it uses, so point it at a throwaway database — never at the one above.
Set that database up once with:

```
createdb upsite_test
DATABASE_URL="<your TEST_DATABASE_URL>" npx prisma migrate deploy
```

The Prisma client is generated into `src/generated/prisma`, which is not committed. `npm install`
regenerates it.

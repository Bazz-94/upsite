# ae-45 - Auth

* **Status**: Not started
* **Description**: The admin area is closed off to everyone except allowlisted Google accounts.
* **Dependencies**: ae-10

## Requirements
1. A person can sign in with a Google account, and sign out again, which ends their session.
2. Every admin address is refused unless the visitor is signed in and on the allowlist.
3. A signed-in account that is not on the allowlist gets a plain "no access" page, not an error or a sign-in loop.
4. An admin screen lists the allowlisted email addresses and can add and remove them.
5. The first allowlisted address comes from configuration, so a fresh install can be got into.
6. An admin cannot remove the last remaining admin, or remove themselves and lock the site.
7. The public site is unaffected — visitors never see a sign-in prompt.

## Out of Scope
* Roles, or different permissions per page.
* Sign-in with anything other than a Google account.
* Including the allowlist in the content export or import.

## Context
Sign-in is deliberately built last: every admin screen before this one is built and checked without a login, then this task closes the door on all of them at once. The allowlist stays out of the content export from ae-35, so moving content between sites never moves access with it.

## Notes
1. Ordering sign-in last was the user's decision during ideation.
2. Excluding the allowlist from export and import was the user's decision during ideation.
3. Use [Neon Managed Better Auth](https://neon.com/docs/auth/quick-start/nextjs-api-only) for auth.
4. Set up a neon dev environment for db and auth.

# @acme/contracts

Types and constants shared by the API and the web app, so the contract cannot drift: the response envelope, error codes, DTO shapes, domain constants, the full country and currency lists, avatar limits, and the sign-in, password reset and password change request types.

`countries.ts` (247 countries and territories) and `currencies.ts` (153 currencies) are plain data files. Each country maps to its usual currency.

Build with `pnpm --filter @acme/contracts build`; the apps need the build output.

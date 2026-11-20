# @acme/web-utils

Generic, typed building blocks for the web app.

| Export                                              | Purpose                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `httpRequest`                                       | Typed fetch that unwraps the API response envelope and raises typed errors |
| `useGenericState`, `useFormFields`, `useFieldState` | State and form hooks                                                       |
| `useApiAction`                                      | Runs a request with pending state, field errors and a success hook         |
| `Mapping`, `DataTable`, `BarList`                   | Generic list, table and bar components                                     |

Tests: `pnpm --filter @acme/web-utils test`.

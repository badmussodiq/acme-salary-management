# Performance

## What was measured

The integration test `apps/api/test/integration/performance.int-spec.ts` seeds 10,000 employees into an empty database, then times each operation five times through the real HTTP stack (guards, validation, SQL, serialisation). It fails if any median exceeds 1.5 s and prints the table below.

```bash
pnpm test:integration
```

**Environment:** Windows 11 laptop, Postgres 18 in Docker (WSL2), Node 26, API and tests on the host. Numbers vary between runs; these are one run, not a benchmark claim.

**Dataset:** 10,000 synthetic employees in all 247 countries and territories, paid in 153 currencies at 3 pay frequencies, about 17,500 compensation periods and about 27,500 audit events (from 3 employees in the smallest places to 472 in the largest country).

| Operation                                      | Median (ms) | Max (ms) |
| ---------------------------------------------- | ----------: | -------: |
| Seed 10,000 employees from an empty database   |        7729 |     7729 |
| Directory, first page                          |        26.8 |     31.8 |
| Directory, search by employee number           |        40.2 |     48.6 |
| Directory, search by name                      |        40.6 |     42.6 |
| Directory, country + department + currency     |        10.2 |     10.8 |
| Directory, page 200 sorted by hire date        |        28.8 |       32 |
| Directory, employees missing current pay       |          18 |       19 |
| Employee detail                                |         7.6 |      8.8 |
| Employee compensation history                  |         7.2 |      8.4 |
| Employee audit trail                           |         7.6 |     43.4 |
| Dashboard overview                             |        43.2 |     62.9 |
| Salary distribution by country (active)        |        25.4 |     35.4 |
| Salary distribution by job title               |        52.5 |     54.2 |
| Data quality (missing, inconsistent, outliers) |        43.7 |     86.6 |

The seed figure includes `ANALYZE`. A cold container start (migrate, create the HR user, seed all 247 countries) took about 10 seconds in the production image.

## Why it is fast

- **Server-side everything.** The browser never receives more than one page; page size is capped at 100.
- **Aggregation in SQL.** Counts, minimum, maximum, average and median (`percentile_cont`) are computed by Postgres, not in Node.
- **Current pay is one definition.** A single join (`effective_from <= today` and open or ending after today) is shared by the directory and the insights. A partial covering index on open periods (`compensations_open_period_idx`) serves it.
- **Search.** Name search uses a trigram index; employee-number search is a prefix match on a unique index. User input is escaped so `%` and `_` are literal.
- **Indexes** on every filtered column (country, department, job title, status, currency) and on `(employee_id, effective_from)` for history.
- **Bulk seed** inserts in batches of 1,000 inside one transaction guarded by an advisory lock, so two starting replicas never seed twice.

## Decisions and trade-offs

- **No caching and no materialised views.** Every dashboard query is tens of milliseconds at 10,000 rows. Totals are derived from the source records, so they can never drift from them. A cache would be added only after measuring a real need.
- **Offset pagination.** Fine at this size (page 200 takes about 26 ms). Keyset pagination would be the next step beyond a few hundred thousand rows.
- **Outlier detection** compares each active employee with the median of the same job title, currency and pay frequency (groups of at least 5), flagging pay above 3× or below one third of it. It is a heuristic for review, not a verdict.

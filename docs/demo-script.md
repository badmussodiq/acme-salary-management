# Demo video

## The captioned walkthrough

`apps/e2e/demo/walkthrough.demo.ts` drives a real browser through the product and records it, with on-screen captions explaining each step. It runs against any running stack, so the video always shows the real software and real database, not mock-ups.

```bash
# against local servers (pnpm db:up, then the API and web app running)
pnpm demo:video

# against another stack, for example the production compose on a custom port
E2E_BASE_URL=https://localhost:8443 E2E_HR_PASSWORD=<password> pnpm demo:video
```

The recording is written to `apps/e2e/demo-output/*/video.webm` (about 4 minutes, 1280x720). Copy it to `docs/demo/acme-salary-demo.webm`, which is git-ignored because of its size, and upload it where reviewers can open it (YouTube unlisted, Loom, or Drive). The walkthrough creates one employee and one raise, so run it against a throwaway or demo database.

## Script for a voiced version

Target 4 to 6 minutes. Show real behaviour; do not narrate numbers you have not looked at.

| #   | Screen                                | Say                                                                                                                                       |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign-in                               | HR manages pay for 10,000 people across every country in spreadsheets. This replaces that. Sign in; the cookie is HttpOnly and revocable. |
| 2   | Dashboard top                         | Headcount, active and inactive, and employees with no pay in effect, computed live in SQL.                                                |
| 3   | Pay currency and frequency            | Pay is in more than 150 currencies and three frequencies. We never add or convert them: every figure is one currency at one frequency.    |
| 4   | Salary summary                        | Minimum, median, average, maximum per currency. Group by department, filter to Nigeria.                                                   |
| 5   | Data quality                          | Active people with no pay, inactive people still paid, and salaries more than three times or under a third of the median for the role.    |
| 6   | Directory                             | Server-side search, filters and sorting on 10,000 rows; the page loads in tens of milliseconds (see performance.md).                      |
| 7   | Employee page                         | Profile, current pay, full pay history, audit trail.                                                                                      |
| 8   | Add compensation, then an invalid one | A raise closes the previous period. A start date before the latest period is refused: the rule is in the API and in the database.         |
| 9   | New employee, then edit               | Generated employee number, audited creation, optimistic concurrency on edit.                                                              |
| 10  | Repository                            | Typed contracts, strict validation, 300 automated tests, CI with browser tests against the Docker images, CD with scanning and approval.  |
| 11  | Security and operations               | Nonce CSP, per-user rate limits, revocable sessions, hardened containers; backups with a tested restore; automatic rollout and rollback.  |
| 12  | Sign out                              | Signing out revokes the session on the server.                                                                                            |

## Before recording

- Seeded database (`pnpm seed`), so the dashboard has something to show.
- A clean browser window at 1280x720 and no personal bookmarks or extensions visible.
- Use a throwaway password for any demo deployment and delete it afterwards.

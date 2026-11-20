# Requirements: ACME Salary Management

## Goal

Give ACME's HR manager a secure web application to manage salary data for 10,000 employees in several countries, replacing spreadsheets, and to answer questions about how the organisation pays its people.

## Who it is for

One persona: the **HR manager**, who maintains compensation records, reviews pay across countries and departments, and investigates data quality. A single role is built; the design leaves room for more without building a permissions system nobody asked for.

## What is in scope

| Area               | Features                                                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Employees and pay  | Searchable, sortable, paginated directory; employee profile; create and edit employees; add a compensation (a raise or correction) that starts on a date and closes the previous period; active and inactive status; strict validation |
| Insights           | Headcount by country and department; pay mix by currency and frequency; minimum, median, average and maximum per currency, filterable and groupable by country, department or job title; employees with no pay; unusual salaries       |
| Search and filters | By name or employee number; by country, department, job title, status, currency and missing pay; sorting; everything done on the server                                                                                                |
| Auditability       | Every create, update and compensation change records who, when, what changed (before and after) and the request id; the audit log cannot be altered, even directly in the database                                                     |
| Seeding            | A deterministic, repeatable seed of 10,000 synthetic employees across every country and territory (247), 153 currencies and 3 pay frequencies, clearly flagged as synthetic                                                            |
| Operations         | Sign-in with revocable sessions, health endpoints, containers, CI/CD, automatic database migration, scheduled backups with a tested restore                                                                                            |

## Rules that shape the design

- **Currencies are never mixed.** Every statistic is for one currency paid at one frequency. There is no exchange-rate source, so no conversion.
- **Pay history is kept.** A new compensation never overwrites the old one. The database refuses overlapping periods for one employee.
- **Money is exact.** Amounts are decimal strings and `numeric` in the database, never floating point.
- **Country and currency are independent.** A contractor in Nigeria can be paid in US dollars.
- **Every country is available from day one.** The onboarding form lists all 247 countries and territories and suggests each one's currency, so a new hire anywhere needs no configuration.

## Deliberately left out, and why

| Left out                              | Reason                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Payroll runs, payslips, tax, pensions | The brief is salary management, not payroll; statutory rules differ by country            |
| Currency conversion                   | Needs a rate source, a rate-date policy and accuracy controls; mixing currencies is wrong |
| Employee self-service                 | The persona is the HR manager                                                             |
| Approval workflows                    | Valuable in a larger product, not needed to show the core workflow                        |
| Recruitment, attendance, leave        | Outside salary administration                                                             |
| Microservices, queues, Kubernetes     | A 10,000-row dataset does not justify them; a modular monolith is simpler to run and test |
| Custom report builder, BI             | A few reliable insights beat a flexible tool that is easy to get wrong                    |
| User management, MFA, password reset  | One bootstrap HR account is enough for the assessment; listed as future work              |

## Success criteria

- A reviewer can run the whole system with documented commands, and the seed fills 10,000 employees without manual steps.
- The HR manager can search, filter, inspect, create and update employees and their pay.
- Dashboard figures respect currency boundaries and filters.
- Every change to an employee or their pay is audited.
- Core rules and API behaviour are covered by deterministic automated tests; CI runs them on every pull request.
- The system is containerised, deployable by a pipeline, and recoverable from a backup.

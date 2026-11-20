# AI-assisted workflow

This project was built with Claude Code (Claude Sonnet 5.5) working in the repository, directed by a person phase by phase. Generated code is only as good as the checks around it, so this page records how the work was steered and how it was verified.

## How it was steered

1. **Plan first.** Scope, architecture, security and exclusions were agreed before any code.
2. **Constraints up front.** NestJS with server-side rendering, strict typing, short comments, reusable generics, the newest compatible dependencies, strict validation and rate limiting, and no manual setup steps (migrations, seeding and the first account happen on start).
3. **One vertical slice at a time.** Each phase ended with the full check suite green and a commit.
4. **Run it, do not trust it.** Everything was executed: test suites, a real database, a real browser, the Docker images, and a backup restore that compared row counts. Claims in documents were re-checked against the code.
5. **Independent expectations.** Expected values in the insights tests were worked out by hand from small fixtures, not copied from program output.

## Where the AI was wrong and what caught it

| What went wrong                                                                                  | What caught it                                                 |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| The chosen linter did not support TypeScript 7                                                   | It crashed on first use; replaced with oxlint                  |
| The API image crashed on start: a runtime package was a dev dependency                           | Starting the built image                                       |
| A revoked session looped between two pages, and the fix redirected to `0.0.0.0` in the container | A browser test, then the suite against the container           |
| The first backup of a fresh stack was empty                                                      | A restore drill that compared row counts                       |
| JSON `__proto__` keys were silently ignored instead of rejected                                  | A test written to the stricter rule                            |
| A signed-in user's rate limit was shared by everyone on one address                              | An integration test with two users behind one address          |
| Dashboard bars were never drawn: Tailwind did not scan the shared package                        | Frames of the recorded demo, then a browser test on bar widths |
| The demo walkthrough failed on a second run                                                      | Running the recording twice                                    |

One item is unresolved: once, the first dashboard load after seeding hit the 10-second statement timeout. It could not be reproduced, so the seed now runs `ANALYZE` and the 10,000-row performance test would flag a recurrence.

## Representative prompts

Paraphrased from the actual sessions; credentials and private paths are omitted.

- "Create a plan first: requirements, architecture, CI/CD, security. Say what we are leaving out and why. We are using NestJS with server-side rendering."
- "Follow the patterns of my other project: a generic state hook, a typed API client, a generic table and mapping component. Use strong typing and keep comments short."
- "Add rate limiting, a standard response for 401 and 403, strict validation, and protection against injection and denial of service."
- "Use the newest TypeScript and compatible dependencies."
- "Nothing may need a manual step: migrations, seeding and the first admin must happen when the app starts."
- "Write the CI with unit, integration and browser tests, keep the Docker images small, and add CD that deploys after CI passes."
- "Every country in the world must be available, with its currency."
- "Add profile pictures stored in Neon object storage; create the bucket at startup, programmatically."
- "Start the next phase" after each verified result.

## What stayed human

- Which problem to solve and what to leave out, including widening the scope to every country.
- The stack and the quality bar.
- Reviewing each phase and deciding what came next.
- Accepting trade-offs that are written down in [architecture.md](architecture.md) and [security.md](security.md).

## What this does not claim

The AI wrote most of the code and a person directed and reviewed it. The tests, scans and drills are the evidence that it works; they do not replace a human reading the code.

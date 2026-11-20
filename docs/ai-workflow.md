# AI-assisted workflow

This project was built with Claude Code (Claude Sonnet 5.5) working in the repository, directed phase by phase. This page records how the work was steered and, more usefully, how it was checked, because generated code is only as good as the verification around it.

## Working method

1. **Plan before code.** The first deliverable was [engineering-plan.md](engineering-plan.md): scope, architecture, security, delivery phases and a definition of done. Nothing was built until the scope and the exclusions were agreed.
2. **Constraints stated up front.** The human set the rules the AI had to follow:
   - NestJS with server-side rendering; the lightest sensible runtime.
   - Strong typing, no code comments, "write once, use anywhere" generics, the newest compatible dependencies.
   - Reuse the patterns of a sister project (a generic state hook, a typed API client, generic table and list components) rather than inventing new ones.
   - Strict input validation, rate limiting, a standard error shape for 401 and 403, and defence against injection and denial of service.
   - No manual setup steps: migrations, seeding and the first account happen automatically.
   - Git commits carry no AI attribution.
3. **One vertical slice per phase, each ending in a verified state:** foundation, core workflow, insights and seed, CI/CD and images, security review, delivery. Every phase ended with the full check suite green and a commit.
4. **Run it, do not trust it.** After code was written it was executed: the test suites, the real database, the real browser, the Docker images, the deploy and restore scripts. Claims in documents were re-checked against the code before being kept (one security claim about logs was wrong and the code was fixed to match it).
5. **Tests with independent expectations.** Expected values in the insights tests were calculated by hand from small fixtures, not copied from program output.

## Where the AI was wrong and what caught it

| What went wrong                                                                                                 | What caught it                                                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| The chosen linter does not support TypeScript 7                                                                 | The tool crashed on first use; replaced with oxlint                       |
| The API image crashed on start: a runtime package was listed as a dev dependency                                | Starting the built image                                                  |
| The seed command failed outside the app: a required import was missing                                          | Running the command for real                                              |
| After adding server-side sign-out, a revoked session looped forever between two pages                           | A browser test written for the new behaviour                              |
| The fix for that redirected to `0.0.0.0` inside the container                                                   | Running the browser suite against the container                           |
| The first backup of a fresh stack was empty because the backup started before the API had created the data      | A restore drill that compared row counts                                  |
| The restore script restarted the configured tag instead of the release that was running                         | Reading the drill output                                                  |
| The deploy script aborted when it could not snapshot the old image, the case where a fix is needed most         | Rebuilding images mid-test                                                |
| The production compose assumed port 443 for the public origin, so sign-in was refused on another port           | Recording the demo against a non-standard port                            |
| JSON `__proto__` keys were silently ignored instead of rejected                                                 | A test written to the stricter rule                                       |
| A signed-in user's rate limit was shared with every user on the same address                                    | An integration test with two users behind one address                     |
| The dashboard bars were never drawn: Tailwind did not scan the shared package that defines them                 | Looking at frames of the recorded demo, then a browser test on bar widths |
| The demo walkthrough was not repeatable: a second run hit the "start date must be after the latest period" rule | Running the recording twice                                               |
| The first unit test of the API timed out on a cold clone while other packages ran in parallel                   | A fresh-clone run of the whole suite                                      |
| Shell quoting repeatedly corrupted scripted edits                                                               | The type checker and the formatter                                        |

One item is not resolved: on one occasion the first dashboard load after seeding hit the 10-second database statement timeout. It could not be reproduced (the same query takes 30 to 46 ms, including right after a reseed), so the seed now runs `ANALYZE` as a precaution and the 10,000-row performance test would flag a recurrence.

## What stayed human

- Which problem to solve and what to leave out. Mid-way the human widened the scope from a sample of countries to every country in the world, and the reference data was regenerated from public datasets rather than typed.
- The stack and the quality bar (typing, comments, generics, dependency policy).
- Reviewing each phase's result and deciding what came next.
- Accepting trade-offs that are recorded in [decisions.md](decisions.md) and [security.md](security.md) instead of hiding them.

## Representative instructions

Paraphrased from the actual session; credentials and private paths are omitted.

- "Create a plan first: requirements, architecture, CI/CD, security. Say what we are leaving out and why. We are using NestJS with server-side rendering."
- "Look at the sister project and follow how it does generic state, API calls, the mapping component and the generic table. Use strong typing and avoid comments."
- "Add rate limiting, a standard response for 401 and 403, strict validation, and protection against injection and denial of service."
- "Use the newest TypeScript and compatible dependencies."
- "Write the CI with unit, integration and browser tests. Make the Docker images as small as possible, like the sister project. Add CD, but do not touch a real server. The deployed system should pick up the newly uploaded image by itself."
- "Start the next phase" after each verified result.

## What this does not claim

The AI wrote most of the code, and a person directed and reviewed it. The tests, scans and drills above are the evidence that it works; they are not a substitute for a human reading the code, which the reviewer is invited to do. The decisions that matter are written down in [decisions.md](decisions.md) so they can be challenged.

# @acme/e2e

Playwright browser tests and the captioned demo recorder.

```bash
pnpm build && pnpm test:e2e    # starts local servers; needs `pnpm db:up`
pnpm demo:video                # records a captioned walkthrough into apps/e2e/demo-output
```

Set `E2E_EXTERNAL=1` and `E2E_BASE_URL` to test an already running stack, such as `docker compose up`. `E2E_HR_EMAIL` and `E2E_HR_PASSWORD` override the development credentials.

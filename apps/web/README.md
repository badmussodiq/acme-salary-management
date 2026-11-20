# @acme/web

Next.js 16 application: server-rendered pages for the HR manager, plus a runtime proxy that forwards `/api/v1/*` to the API.

## Run

```bash
pnpm dev:web   # http://localhost:3000, expects the API at API_ORIGIN (default http://localhost:3001)
```

## Layout

| Path                       | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `src/app/(portal)`         | Dashboard, employee directory, profile, create and edit     |
| `src/app/login`            | Sign-in                                                     |
| `src/app/api/v1/[...path]` | Proxy to the API (100 KB body cap, 2 MB for avatar uploads) |
| `src/components`           | Shared UI, including the initials avatar                    |
| `src/proxy.ts`             | Session redirect and nonce-based CSP                        |

## Deploy

Vercel project with root directory `apps/web`; `vercel.json` holds the build commands. Set `API_ORIGIN` to the API's public URL. The Docker image (`Dockerfile`) uses Next's standalone output, which is switched off on Vercel.

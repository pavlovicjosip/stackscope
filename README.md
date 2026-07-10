# StackScope

StackScope is a statically generated visual learning app for understanding how frontend, backend, data, infrastructure, deployment, and observability work together.

## Included MVP

- Architect lab for composing frontend, backend, database, architecture patterns, CI/CD, infrastructure as code, packaging, compute, and deployment choices with compatibility verdicts, protocol maps, constraints, official sources, and shareable URL state.
- Persistent light/dark theme with system preference fallback and an accessible header toggle.
- Six guided architecture lessons with deterministic playback.
- Twenty reusable concept pages.
- Interactive pan/zoom system maps with inspectable nodes and connections.
- Plain-language, engineering, and production explanation depth.
- Search and topic filtering.
- Shareable lesson step, selection, and depth state.
- Keyboard, high-contrast, responsive, and reduced-motion behavior.
- Build-time content/reference validation and lesson knowledge checks.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install
pnpm test:e2e
```

The default browser matrix covers Chromium, Firefox, and a mobile Chromium device. Set `PLAYWRIGHT_WEBKIT=1` to add WebKit on a host where `pnpm exec playwright install-deps webkit` has been installed.

`pnpm build` creates the static site in `out/`. `pnpm start` serves that directory on `0.0.0.0:${PORT:-4173}` using the dependency-free production server in `scripts/serve-static.mjs`.

## Content architecture

- `src/content/lessons.ts` — lesson graphs, narration, failure modes, observations, and checks.
- `src/content/concepts.ts` — progressive concept explanations.
- `src/content/types.ts` — versioned content contract.
- `src/content/architecture.ts` — sourced technology catalog and architect-selection contract.
- `src/lib/content.ts` — build-time cross-reference validation and lookup.
- `src/lib/compatibility.ts` — pure compatibility, communication, and URL-state analysis.
- `src/lib/playback.ts` — pure playback and public URL-state behavior.

Every lesson must have unique node/edge identifiers, valid step references, valid glossary/prerequisite references, and an in-range knowledge-check answer. Importing the content layer fails immediately when those rules are broken.

## Deployment

Upload the contents of `out/` to any static host with clean-directory URL support. The app has no runtime API, database, account system, cookies, or analytics vendor.

### Railway

The repository includes `railway.json`. Railway uses Railpack to run `pnpm build`, checks `/` for deployment health, and starts the static server with Railway's injected `PORT`.

From the Railway dashboard:

1. Push this repository to GitHub.
2. Create a Railway project and choose **Deploy from GitHub repo**.
3. Select the StackScope repository. No application variables or database are required.
4. After the first deployment is healthy, open the service's **Settings → Networking** section and select **Generate Domain**.

Alternatively, after installing and authenticating the Railway CLI:

```bash
railway login
railway init
railway up
railway open
```

The server must not be given a hard-coded Railway port. Railway supplies `PORT`, and `pnpm start` binds it on `0.0.0.0` automatically.

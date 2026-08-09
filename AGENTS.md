# AGENTS.md

## Cursor Cloud specific instructions

This is a static Next.js 15 content site (System Design Interview Hub). Content lives in `content/**` as MDX; `lib/posts.ts` discovers it. There is no backend, database, or external service — nothing needs secrets.

Standard commands are in `package.json` (`dev`, `build`, `start`, `lint`). Notes:

- `npm run lint` runs `tsc --noEmit` (type-check only; there is no ESLint config).
- `npm run dev` serves on `http://localhost:3000`. Because `next.config.ts` sets `basePath: '/vibhu-tech-blog'`, the app is served under that prefix — open `http://localhost:3000/vibhu-tech-blog/`. The bare root `http://localhost:3000/` returns 404; this is expected, not a broken build.
- `npm run build` uses `output: 'export'` and produces a static site in `out/`. There is no server runtime; `npm run start` is not used for this static export.
- No lockfile is committed, so `npm install` (not `npm ci`) is the correct install command.

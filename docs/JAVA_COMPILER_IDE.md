# Java Compiler IDE

Working Java IDE tab for this static Next.js site. The browser UI cannot invoke `javac` on GitHub Pages, so compile/run goes through a **local companion server** that uses your installed JDK.

## Quick start

```bash
# terminal 1 — JDK-backed compiler server
npm run java-compiler-server

# terminal 2 — Next.js app
npm run dev
```

Open: [http://localhost:3000/vibhu-tech-blog/java-compiler/](http://localhost:3000/vibhu-tech-blog/java-compiler/)

## Requirements

- JDK 17+ (`java` and `javac` on `PATH`, or set `JAVA_HOME`)
- Node.js 20+
- Monaco Editor packages (`@monaco-editor/react`, `monaco-editor`) — installed via npm

## npm scripts

| Script | Purpose |
|---|---|
| `npm run java-compiler-server` | Start local compile/run API on `127.0.0.1:3927` |
| `npm run test:java-compiler` | Compile/run/error/stop integration tests against the server |
| `npm run lint` | Typecheck |
| `npm run build` | Static export (IDE UI only; server is local-dev) |

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `JAVA_HOME` | system | JDK used by the server |
| `JAVA_COMPILER_PORT` | `3927` | Server port |
| `JAVA_COMPILER_HOST` | `127.0.0.1` | Bind address (localhost only) |
| `NEXT_PUBLIC_JAVA_COMPILER_URL` | `http://127.0.0.1:3927` | Browser → server URL |

In the IDE you can also set the server URL and `JAVA_HOME` and click **Save & detect**.

## Security model

- Each compile/run uses an isolated temp workspace under the OS temp dir
- Only `.java` files; path traversal rejected
- File count/size limits
- Execution timeout + **Stop** (`SIGKILL`)
- Child process env is sanitized (no cloud tokens / AWS / GitHub secrets forwarded)
- Server listens on loopback by default

## Cursor / AI assist

Actions: Explain, Fix Error, Optimize, Generate Code, Generate Unit Test, Refactor.

- Suggestions open a **review panel**
- **Apply changes** requires confirmation
- **Copy prompt for Cursor** puts a ready prompt on the clipboard for Cursor Chat

## Layout

```text
Tabs → Java Compiler
┌──────────────┬─────────────────────────────┐
│ Project      │ Monaco Java editor          │
│ explorer     │                             │
├──────────────┴─────────────────────────────┤
│ Run | Compile | Stop | Clear Console       │
├────────────────────────────────────────────┤
│ Console (stdout / stderr / exit / timing)  │
├────────────────────────────────────────────┤
│ Cursor / AI Assist (review before apply)   │
└────────────────────────────────────────────┘
```

## Static deploy note

GitHub Pages serves the IDE UI, but **compile/run needs the local server**. When the server is down, the IDE reports JDK/server status clearly and stays usable for editing.

# Agent Guidelines

- This project is a tiny Scala-inspired language interpreter implemented in TypeScript.
- Place source files inside `src/` and tests inside `tests/`.
- Use two-space indentation and keep modules written as ECMAScript modules (`import`/`export`).
- Prefer Vitest for automated tests; new behavior should be covered with unit tests under `tests/`.
- The entry point for evaluation is `evaluateSource` from `src/index.ts`.

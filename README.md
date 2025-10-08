# Typescala

Typescala is a tiny, Scala-inspired language implemented in TypeScript. It includes a parser, interpreter, and a browser playground so you can experiment with the language without installing anything.

## Live playground

Explore the language in your browser: [Typescala Playground](https://timrefsix.github.io/Typescala/).

The GitHub Pages workflow builds the interpreter and publishes the contents of the `dist/` directory whenever the `main` branch is updated. You can find the configuration in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Language features

The interpreter supports a handful of expressive features designed to resemble Scala's syntax:

- **Method-like infix operators** such as `plus`, `minus`, `times`, and `dividedBy`, which are dispatched as method calls on numeric values.
- **Functions and closures** that capture their surrounding environment, allowing you to define helpers and higher-order constructs.
- **Block-based control flow** with `if` expressions, block functions, and scoped bindings, making pseudo-keywords like `unless` possible.
- **Native helpers** for booleans and strings, plus built-in values such as `true`, `false`, `null`, and a `print` function for debugging.

## Getting started

### Prerequisites

- Node.js 20+
- npm 9+

Install dependencies once you have cloned the repository:

```bash
npm install
```

### Run the test suite

```bash
npm test
```

The tests exercise both the interpreter core and the presentation utilities used by the playground UI.

### Run the playground locally

```bash
npm run dev
```

This command starts a local static server at [http://localhost:5173](http://localhost:5173), recompiles the TypeScript sources, and refreshes the copied public assets whenever you make changes.

### Build the interpreter and playground assets

```bash
npm run build
```

The build compiles the TypeScript sources and copies the static assets from `public/` into `dist/`, which is what the Pages deployment serves.

## Local development tips

- During development you can open `public/index.html` directly in your browser to experiment with the playground UI. The script uses the compiled interpreter to evaluate code typed into the editor and displays formatted results or errors.
- The default snippet defines a simple Fibonacci function; use it as a starting point to explore the language semantics.

## Contributing

Pull requests are welcome! Please make sure new features include accompanying tests and that `npm test` passes before submitting your changes.

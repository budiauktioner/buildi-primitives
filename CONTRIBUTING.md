# Contributing to @budiauktioner/buildi-primitives

We welcome community contributions to the TypeScript port of `Buildi.Primitives`.

## Getting started

All JavaScript / TypeScript commands run from the `js/` directory:

```sh
cd js
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

The repository requires:

- Node.js 20.10 or newer (see [`.nvmrc`](.nvmrc))
- pnpm 9 (declared via [`packageManager`](./package.json))

## Ways to contribute

- File bugs or regressions as GitHub issues.
- Add or update documentation.
- Add new primitive types or improve existing ones (see [`AGENTS.md`](AGENTS.md)).
- Add or expand tests, especially edge cases and parity with the .NET port.

## Contributing code

1. File an issue describing what you want to do and get feedback before starting to code.
2. Follow the per-type pattern in [`AGENTS.md`](AGENTS.md).
3. Write tests in lockstep with each new file. Failures must be visible from `pnpm test`.
4. Keep parity with the .NET port: behaviour and public surface should match unless intentional.
5. Update documentation when relevant.
6. Make a PR.

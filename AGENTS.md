# Obsidian Copy As Plugin

## Project overview

- Target: Obsidian Community Plugin (TypeScript → bundled JavaScript).
- Entry point: `src/main.ts` compiled to `main.js` and loaded by Obsidian.
- Required release artifacts: `main.js`, `manifest.json`, and optional `styles.css`.

## Environment & tooling

- Node.js: use current LTS (Node 18+ recommended).
- **Package manager: npm**.
- **Bundler: esbuild** (`esbuild.config.mjs`).
- Types: `obsidian` type definitions.

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## Linting

```bash
npm run lint
```

## File & folder conventions

- Source lives in `src/`. Keep `main.ts` small and focused on plugin lifecycle.
- **Do not commit build artifacts**: Never commit `node_modules/`, `main.js`, or other generated files.
- Generated output: `main.js` at the plugin root.

## Manifest rules (`manifest.json`)

- Must include: `id`, `name`, `version`, `minAppVersion`, `description`, `isDesktopOnly`.
- Never change `id` after release.
- Keep `minAppVersion` accurate when using newer APIs.

## Testing

- Manual install: copy `main.js`, `manifest.json`, `styles.css` to `<Vault>/.obsidian/plugins/copy-as/`.
- Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Versioning & releases

- Bump `version` in `manifest.json` (SemVer) and update `versions.json`.
- Create a GitHub release whose tag exactly matches `manifest.json`'s `version` (no `v` prefix).
- Attach `manifest.json`, `main.js`, and `styles.css` to the release.

## Security & privacy

- Default to local/offline operation.
- No hidden telemetry.
- Never execute remote code.
- Register and clean up all listeners using `register*` helpers.

## Coding conventions

- TypeScript with strict checks.
- Keep `main.ts` minimal: lifecycle only, delegate logic to separate modules.
- Split large files (>200-300 lines) into smaller modules.
- Bundle everything into `main.js`.
- Prefer `async/await` over promise chains.

# Copy as HTML - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an Obsidian plugin that copies the entire active document as styled HTML rich text to the clipboard.

**Architecture:** Render Markdown to a hidden DOM container using Obsidian's `MarkdownRenderer.render()`, walk the DOM tree to inline computed CSS styles, then write `text/html` + `text/plain` to the clipboard via `navigator.clipboard.write()`.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild bundler, DOM/Clipboard APIs

**Testing:** Manual testing in Obsidian (no unit test framework — code is tightly coupled to Obsidian runtime + DOM). Build with `npm run build`, copy `main.js` + `manifest.json` to vault, reload Obsidian.

---

### Task 1: Implement inline-styles utility

**Files:**
- Create: `src/inline-styles.ts`

**Step 1: Create `src/inline-styles.ts`**

Write the style inlining utility. This module has no Obsidian dependencies — it's pure DOM.

```typescript
const INLINE_PROPERTIES: string[] = [
	"color",
	"font-family",
	"font-size",
	"font-weight",
	"font-style",
	"text-decoration",
	"text-align",
	"line-height",
	"margin",
	"padding",
	"background-color",
	"list-style-type",
	"border",
	"border-collapse",
	"white-space",
];

export function inlineStyles(element: HTMLElement): void {
	const computed = window.getComputedStyle(element);
	for (const prop of INLINE_PROPERTIES) {
		const value = computed.getPropertyValue(prop);
		if (value) {
			element.style.setProperty(prop, value);
		}
	}

	for (const child of Array.from(element.children)) {
		if (child instanceof HTMLElement) {
			inlineStyles(child);
		}
	}
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors (unused module is tree-shaken but tsc still checks it).

**Step 3: Commit**

```bash
git add src/inline-styles.ts
git commit -m "✨ feat: add inline-styles utility for DOM style extraction"
```

---

### Task 2: Implement core copy-html logic

**Files:**
- Create: `src/copy-html.ts`

**Step 1: Create `src/copy-html.ts`**

This is the main orchestration module. It renders Markdown, inlines styles, and writes to clipboard.

```typescript
import { App, Component, MarkdownRenderer, Notice, TFile } from "obsidian";

import { inlineStyles } from "./inline-styles";

export async function copyAsHtml(app: App): Promise<void> {
	const file = app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active document");
		return;
	}

	const markdown = await app.vault.read(file);
	const container = document.body.createDiv();
	container.style.position = "absolute";
	container.style.left = "-9999px";

	const component = new Component();
	component.load();

	try {
		await MarkdownRenderer.render(
			app,
			markdown,
			container,
			file.path,
			component,
		);

		inlineStyles(container);

		const html = container.innerHTML;
		const htmlBlob = new Blob([html], { type: "text/html" });
		const textBlob = new Blob([markdown], { type: "text/plain" });

		await navigator.clipboard.write([
			new ClipboardItem({
				"text/html": htmlBlob,
				"text/plain": textBlob,
			}),
		]);

		new Notice("Copied HTML to clipboard");
	} catch (e) {
		console.error("Copy as HTML failed:", e);
		new Notice("Copy failed, please try again");
	} finally {
		component.unload();
		container.remove();
	}
}
```

Key details for the implementer:
- `Component` must be manually `load()`ed since we construct it ourselves (not added as a child of the plugin). Call `unload()` in `finally`.
- `document.body.createDiv()` is an Obsidian monkey-patched DOM helper — it creates and appends a `<div>`.
- The `finally` block ensures cleanup even if clipboard write fails.
- `MarkdownRenderer.render(app, markdown, el, sourcePath, component)` — the `sourcePath` is used to resolve relative links/embeds.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/copy-html.ts
git commit -m "✨ feat: add core copy-as-html logic with clipboard write"
```

---

### Task 3: Wire up plugin entry point

**Files:**
- Modify: `src/main.ts`

**Step 1: Update `src/main.ts`**

Replace the current scaffold with menu registration and command registration.

```typescript
import { Plugin } from "obsidian";

import { copyAsHtml } from "./copy-html";

export default class CopyAsPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu) => {
				menu.addItem((item) => {
					item.setTitle("Copy as HTML")
						.setIcon("clipboard-copy")
						.onClick(() => copyAsHtml(this.app));
				});
			}),
		);

		this.addCommand({
			id: "copy-as-html",
			name: "Copy as HTML",
			callback: () => copyAsHtml(this.app),
		});
	}

	onunload() {}
}
```

Notes for the implementer:
- `file-menu` callback signature: `(menu: Menu, file: TAbstractFile, source: string, leaf?: WorkspaceLeaf)`. We only need `menu` here — the other params are unused.
- `registerEvent` ensures automatic cleanup on plugin unload.
- `addCommand` with `callback` (not `editorCallback`) so it works from any view, not just the editor.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. `main.js` is generated at project root.

**Step 3: Verify lint**

Run: `npm run lint`
Expected: No lint errors.

**Step 4: Commit**

```bash
git add src/main.ts
git commit -m "✨ feat: register copy-as-html in file menu and command palette"
```

---

### Task 4: Manual smoke test in Obsidian

**This is a manual verification task — no code changes.**

**Step 1: Build production bundle**

Run: `npm run build`
Expected: `main.js` generated at project root.

**Step 2: Install into Obsidian vault**

Copy `main.js` and `manifest.json` to `<Vault>/.obsidian/plugins/copy-as/`.
Reload Obsidian (Ctrl/Cmd+R) and enable the plugin in Settings → Community plugins.

**Step 3: Test file menu**

1. Open any Markdown document
2. Click the "..." (more options) button in the top-right
3. Verify "Copy as HTML" appears in the menu
4. Click it
5. Verify a Notice "Copied HTML to clipboard" appears

**Step 4: Test paste result**

1. Open a rich text target (e.g., Gmail compose, Word, WeChat)
2. Paste (Ctrl/Cmd+V)
3. Verify the content appears with formatting (headings, bold, code blocks, lists, etc.)

**Step 5: Test command palette**

1. Press Ctrl/Cmd+P
2. Type "Copy as HTML"
3. Verify the command appears and executes

**Step 6: Test error case**

1. Close all documents
2. Run the command via command palette
3. Verify "No active document" Notice appears

**Step 7: Commit (only if any fix was needed)**

If fixes were required during testing, commit them:

```bash
git add -A
git commit -m "🐛 fix: address issues found during smoke testing"
```

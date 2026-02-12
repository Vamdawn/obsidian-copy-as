# Copy as HTML - Design Document

## Overview

Obsidian plugin that copies the entire current document as HTML rich text to the clipboard, with inline styles preserved for proper rendering when pasted into WeChat, email, Word, etc.

## Requirements

- Copy the entire active document as HTML rich text
- Use Obsidian's own rendering engine (MarkdownRenderer) for Markdown-to-HTML conversion
- Inline key CSS styles into HTML elements for cross-application compatibility
- Trigger from the document "..." (more options / file-menu) menu
- Also register as a Command for command palette access and custom hotkey binding
- Show an Obsidian Notice on success or failure

## Architecture

### Flow

```
User clicks "..." menu → "Copy as HTML"
  → Read active file's Markdown source
  → Render to hidden container via MarkdownRenderer.render()
  → Walk DOM tree, inline computed styles onto elements
  → Write to clipboard via navigator.clipboard.write() (text/html + text/plain)
  → Show Notice
  → Remove hidden container
```

### File Structure

```
src/
├── main.ts              # Plugin entry, register menu item + command
├── copy-html.ts         # Core logic: render → inline styles → copy
└── inline-styles.ts     # DOM traversal and style inlining utility
```

## Module Design

### main.ts — Plugin Lifecycle

- `onload()`: Register `file-menu` event to add "Copy as HTML" menu item; register `copy-as-html` command
- `onunload()`: Cleanup (handled automatically by Obsidian's `registerEvent`)
- Delegates all logic to `copy-html.ts`

### copy-html.ts — Core Copy Logic

**`copyAsHtml(app: App): Promise<void>`**

1. Get active file via `app.workspace.getActiveFile()`; if none, show error Notice and return
2. Read Markdown content via `app.vault.read(file)`
3. Create hidden container: `document.body.createDiv()` positioned offscreen (`left: -9999px`)
4. Render Markdown: `MarkdownRenderer.render(app, markdown, container, file.path, component)`
5. Call `inlineStyles(container)` to embed computed styles
6. Build clipboard data:
   - `text/html`: `container.innerHTML`
   - `text/plain`: original Markdown source
7. Write to clipboard via `navigator.clipboard.write([new ClipboardItem(...)])`
8. Show success Notice
9. Remove container, unload component

### inline-styles.ts — Style Inlining

**`inlineStyles(element: HTMLElement): void`**

Recursively walks the DOM tree. For each element:

1. Get computed styles via `window.getComputedStyle(element)`
2. Copy key visual properties to `element.style`:
   - Text: `color`, `font-family`, `font-size`, `font-weight`, `font-style`, `text-decoration`, `text-align`, `line-height`
   - Box model: `margin`, `padding`, `background-color`
   - Lists: `list-style-type`
   - Tables: `border`, `border-collapse`
   - Code blocks: `white-space`, `background-color`, `font-family`
3. Recurse into child elements

## Menu Registration

```typescript
this.registerEvent(
  this.app.workspace.on("file-menu", (menu, file) => {
    menu.addItem((item) => {
      item.setTitle("Copy as HTML")
        .setIcon("clipboard-copy")
        .onClick(() => copyAsHtml(this.app));
    });
  })
);

this.addCommand({
  id: "copy-as-html",
  name: "Copy as HTML",
  callback: () => copyAsHtml(this.app),
});
```

## Clipboard API Usage

```typescript
const html = container.innerHTML;
const blob = new Blob([html], { type: "text/html" });
const textBlob = new Blob([markdown], { type: "text/plain" });
await navigator.clipboard.write([
  new ClipboardItem({ "text/html": blob, "text/plain": textBlob })
]);
```

Writes both `text/html` and `text/plain` formats so paste targets that don't support HTML can fall back to the original Markdown.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No active file open | `Notice("No active document")` |
| Clipboard write fails | `Notice("Copy failed, please try again")` |
| Render error | `Notice("Render failed")` + console.error |

## Scope Boundaries

**In scope:**
- Copy entire document as styled HTML
- File menu integration + command palette
- Inline style embedding
- Success/failure notices

**Out of scope (not planned):**
- Selection-only copy
- Settings panel / configuration UI
- Custom CSS theme selection
- Image embedding / base64 conversion
- Export to file

# Copy As

An Obsidian plugin that copies the current document as styled HTML rich text to the clipboard, ready to paste into email clients, Word, WeChat, and other rich text editors.

## Features

- Renders the full Markdown document to HTML with inline CSS styles (font, color, background, margin, etc.), preserving formatting when pasted
- Automatically strips YAML frontmatter metadata from the output
- Writes both `text/html` and `text/plain` (original Markdown) to the clipboard for broad paste compatibility

## Usage

**File menu** — Open a document, click the `...` (more options) button in the top-right corner, and select **"Copy as HTML"**.

**Command palette** — Press `Ctrl/Cmd+P`, search for **"HTML"**, and run the command.

A notice will confirm the copy succeeded. Then paste (`Ctrl/Cmd+V`) into any application that accepts rich text.

## Installation

1. Copy `main.js`, `manifest.json`, and `styles.css` into your vault at `.obsidian/plugins/copy-as/`
2. Reload Obsidian (`Ctrl/Cmd+R`)
3. Go to **Settings → Community plugins** and enable **Copy As**

## Configuration

No configuration needed — the plugin works out of the box.

import { App, Component, MarkdownRenderer, Notice } from "obsidian";

import { inlineStyles } from "./inline-styles";

export async function copyAsHtml(app: App): Promise<void> {
	const file = app.workspace.getActiveFile();
	if (!file) {
		new Notice("No active document");
		return;
	}

	const markdown = await app.vault.read(file);
	const body = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "");
	const container = document.body.createDiv();
	container.setCssProps({
		position: "absolute",
		left: "-9999px",
	});

	const component = new Component();
	component.load();

	try {
		await MarkdownRenderer.render(
			app,
			body,
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

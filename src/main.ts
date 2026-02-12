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
			id: "html",
			name: "HTML",
			callback: () => copyAsHtml(this.app),
		});
	}

	onunload() {}
}

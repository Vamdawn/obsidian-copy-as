import { vi } from "vitest";

export class Notice {
	constructor(_message: string) {}
}

export class Component {
	load = vi.fn();
	unload = vi.fn();
}

export class Plugin {
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	registerEvent = vi.fn();
	addCommand = vi.fn();
}

export class MarkdownRenderer {
	static render = vi.fn().mockResolvedValue(undefined);
}

export class App {
	workspace = {
		getActiveFile: vi.fn(),
		on: vi.fn(),
	};
	vault = {
		read: vi.fn(),
	};
}

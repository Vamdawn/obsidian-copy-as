import { describe, expect, it, vi } from "vitest";

import { convertSvgsToImages } from "../../src/svg-to-png";

function createMockCanvas(pngDataUrl: string) {
	const ctx = {
		drawImage: vi.fn(),
	};
	const canvas = {
		getContext: vi.fn().mockReturnValue(ctx),
		toDataURL: vi.fn().mockReturnValue(pngDataUrl),
		width: 0,
		height: 0,
	};
	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "canvas") return canvas as unknown as HTMLCanvasElement;
		return document.createElementNS("http://www.w3.org/1999/xhtml", tag);
	});
	return { canvas, ctx };
}

describe("convertSvgsToImages", () => {
	it("replaces an SVG element with a PNG img", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		const svg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		svg.setAttribute("width", "200");
		svg.setAttribute("height", "100");
		svg.innerHTML = '<rect width="200" height="100" fill="red"/>';
		container.appendChild(svg);

		const pngDataUrl = "data:image/png;base64,fakePngData";
		createMockCanvas(pngDataUrl);

		// Mock Image with controllable onload
		const mockImage = {
			set src(val: string) {
				this._src = val;
				// Simulate async load
				setTimeout(() => this.onload?.(), 0);
			},
			get src() {
				return this._src;
			},
			_src: "",
			onload: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
			width: 200,
			height: 100,
		};
		vi.stubGlobal(
			"Image",
			vi.fn().mockImplementation(function () {
				return mockImage;
			}),
		);

		await convertSvgsToImages(container);

		const img = container.querySelector("img");
		expect(img).not.toBeNull();
		expect(img!.src).toBe(pngDataUrl);
		expect(img!.getAttribute("width")).toBe("200");
		expect(img!.getAttribute("height")).toBe("100");
		expect(container.querySelector("svg")).toBeNull();
	});

	it("does nothing when container has no SVGs", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		const p = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"p",
		);
		p.textContent = "Hello world";
		container.appendChild(p);

		const htmlBefore = container.innerHTML;

		await convertSvgsToImages(container);

		expect(container.innerHTML).toBe(htmlBefore);
	});

	it("handles multiple SVGs", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		for (let i = 0; i < 3; i++) {
			const svg = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"svg",
			);
			svg.setAttribute("width", "100");
			svg.setAttribute("height", "50");
			container.appendChild(svg);
		}

		const pngDataUrl = "data:image/png;base64,fakePngData";
		createMockCanvas(pngDataUrl);
		const mockImage = {
			set src(val: string) {
				this._src = val;
				setTimeout(() => this.onload?.(), 0);
			},
			get src() {
				return this._src;
			},
			_src: "",
			onload: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
			width: 100,
			height: 50,
		};
		vi.stubGlobal(
			"Image",
			vi.fn().mockImplementation(function () {
				return mockImage;
			}),
		);

		await convertSvgsToImages(container);

		const imgs = container.querySelectorAll("img");
		expect(imgs.length).toBe(3);
		expect(container.querySelectorAll("svg").length).toBe(0);
	});

	it("skips SVG inside .callout-icon", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		const calloutIcon = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		calloutIcon.classList.add("callout-icon");
		const svg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		svg.setAttribute("width", "24");
		svg.setAttribute("height", "24");
		calloutIcon.appendChild(svg);
		container.appendChild(calloutIcon);

		// Mock Image/Canvas so conversion would succeed if not filtered
		createMockCanvas("data:image/png;base64,fakePngData");
		const mockImage = {
			set src(val: string) {
				this._src = val;
				setTimeout(() => this.onload?.(), 0);
			},
			get src() {
				return this._src;
			},
			_src: "",
			onload: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
			width: 24,
			height: 24,
		};
		vi.stubGlobal(
			"Image",
			vi.fn().mockImplementation(function () {
				return mockImage;
			}),
		);

		await convertSvgsToImages(container);

		expect(container.querySelector("svg")).not.toBeNull();
		expect(container.querySelector("img")).toBeNull();
	});

	it("skips SVG with svg-icon class", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		const svg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		svg.setAttribute("width", "24");
		svg.setAttribute("height", "24");
		svg.classList.add("svg-icon");
		container.appendChild(svg);

		// Mock Image/Canvas so conversion would succeed if not filtered
		createMockCanvas("data:image/png;base64,fakePngData");
		const mockImage = {
			set src(val: string) {
				this._src = val;
				setTimeout(() => this.onload?.(), 0);
			},
			get src() {
				return this._src;
			},
			_src: "",
			onload: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
			width: 24,
			height: 24,
		};
		vi.stubGlobal(
			"Image",
			vi.fn().mockImplementation(function () {
				return mockImage;
			}),
		);

		await convertSvgsToImages(container);

		expect(container.querySelector("svg")).not.toBeNull();
		expect(container.querySelector("img")).toBeNull();
	});

	it("skips SVG if Image fails to load", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		);
		const svg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		svg.setAttribute("width", "200");
		svg.setAttribute("height", "100");
		container.appendChild(svg);

		createMockCanvas("data:image/png;base64,fakePngData");
		const mockImage = {
			set src(val: string) {
				this._src = val;
				setTimeout(() => this.onerror?.(new Error("load failed")), 0);
			},
			get src() {
				return this._src;
			},
			_src: "",
			onload: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
		};
		vi.stubGlobal(
			"Image",
			vi.fn().mockImplementation(function () {
				return mockImage;
			}),
		);

		await convertSvgsToImages(container);

		// SVG should remain since conversion failed
		expect(container.querySelector("svg")).not.toBeNull();
		expect(container.querySelector("img")).toBeNull();
	});
});

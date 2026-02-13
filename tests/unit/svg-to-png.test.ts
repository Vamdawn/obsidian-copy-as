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
		return document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			tag,
		) as HTMLElement;
	});
	return { canvas, ctx };
}

describe("convertSvgsToImages", () => {
	it("replaces an SVG element with a PNG img", async () => {
		const container = document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			"div",
		) as HTMLElement;
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
});

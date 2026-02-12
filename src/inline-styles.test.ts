import { afterEach, describe, expect, it, vi } from "vitest";

import { inlineStyles } from "./inline-styles";

function mockGetComputedStyle(
	styleMap: Map<HTMLElement, Record<string, string>>,
): void {
	vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => {
		const styles = styleMap.get(el as HTMLElement) ?? {};
		return {
			getPropertyValue: (prop: string) => styles[prop] ?? "",
		} as CSSStyleDeclaration;
	});
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("inlineStyles", () => {
	describe("single element", () => {
		it("inlines computed style properties onto the element", () => {
			const div = document.createElement("div");
			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, {
				"color": "rgb(255, 0, 0)",
				"font-size": "16px",
				"font-weight": "700",
			});
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			expect(div.style.getPropertyValue("color")).toBe("rgb(255, 0, 0)");
			expect(div.style.getPropertyValue("font-size")).toBe("16px");
			expect(div.style.getPropertyValue("font-weight")).toBe("700");
		});

		it("skips properties with empty computed values", () => {
			const div = document.createElement("div");
			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, {
				"color": "rgb(0, 0, 0)",
			});
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			expect(div.style.getPropertyValue("color")).toBe("rgb(0, 0, 0)");
			expect(div.style.getPropertyValue("font-size")).toBe("");
			expect(div.style.getPropertyValue("background-color")).toBe("");
		});

		it("only processes the 15 defined INLINE_PROPERTIES", () => {
			const div = document.createElement("div");
			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, {
				"color": "red",
				"font-size": "14px",
				"display": "block",
				"position": "relative",
				"z-index": "10",
				"opacity": "0.5",
			});
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			expect(div.style.getPropertyValue("color")).toBe("red");
			expect(div.style.getPropertyValue("font-size")).toBe("14px");
			expect(div.style.getPropertyValue("display")).toBe("");
			expect(div.style.getPropertyValue("position")).toBe("");
			expect(div.style.getPropertyValue("z-index")).toBe("");
			expect(div.style.getPropertyValue("opacity")).toBe("");
		});
	});

	describe("recursive behavior", () => {
		it("processes nested HTMLElement children", () => {
			const parent = document.createElement("div");
			const child = document.createElement("span");
			parent.appendChild(child);

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(parent, { "color": "blue" });
			styleMap.set(child, { "font-weight": "bold" });
			mockGetComputedStyle(styleMap);

			inlineStyles(parent);

			expect(parent.style.getPropertyValue("color")).toBe("blue");
			expect(child.style.getPropertyValue("font-weight")).toBe("bold");
		});

		it("handles deeply nested structures (3+ levels)", () => {
			const root = document.createElement("div");
			const level1 = document.createElement("p");
			const level2 = document.createElement("strong");
			const level3 = document.createElement("em");
			root.appendChild(level1);
			level1.appendChild(level2);
			level2.appendChild(level3);

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(root, { "margin": "10px" });
			styleMap.set(level1, { "padding": "5px" });
			styleMap.set(level2, { "font-weight": "700" });
			styleMap.set(level3, { "font-style": "italic" });
			mockGetComputedStyle(styleMap);

			inlineStyles(root);

			expect(root.style.getPropertyValue("margin")).toBe("10px");
			expect(level1.style.getPropertyValue("padding")).toBe("5px");
			expect(level2.style.getPropertyValue("font-weight")).toBe("700");
			expect(level3.style.getPropertyValue("font-style")).toBe("italic");
		});

		it("skips non-HTMLElement children (SVGElement)", () => {
			const parent = document.createElement("div");
			const svgChild = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"svg",
			);
			parent.appendChild(svgChild);

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(parent, { "color": "green" });
			mockGetComputedStyle(styleMap);

			inlineStyles(parent);

			expect(parent.style.getPropertyValue("color")).toBe("green");
			expect(window.getComputedStyle).toHaveBeenCalledTimes(1);
			expect(window.getComputedStyle).toHaveBeenCalledWith(parent);
		});

		it("skips text nodes", () => {
			const parent = document.createElement("div");
			parent.appendChild(document.createTextNode("hello"));

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(parent, { "color": "black" });
			mockGetComputedStyle(styleMap);

			inlineStyles(parent);

			expect(parent.style.getPropertyValue("color")).toBe("black");
			expect(window.getComputedStyle).toHaveBeenCalledTimes(1);
		});

		it("processes siblings at the same level", () => {
			const parent = document.createElement("ul");
			const li1 = document.createElement("li");
			const li2 = document.createElement("li");
			const li3 = document.createElement("li");
			parent.appendChild(li1);
			parent.appendChild(li2);
			parent.appendChild(li3);

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(parent, { "list-style-type": "disc" });
			styleMap.set(li1, { "color": "red" });
			styleMap.set(li2, { "color": "green" });
			styleMap.set(li3, { "color": "blue" });
			mockGetComputedStyle(styleMap);

			inlineStyles(parent);

			expect(parent.style.getPropertyValue("list-style-type")).toBe(
				"disc",
			);
			expect(li1.style.getPropertyValue("color")).toBe("red");
			expect(li2.style.getPropertyValue("color")).toBe("green");
			expect(li3.style.getPropertyValue("color")).toBe("blue");
		});
	});

	describe("edge cases", () => {
		it("handles element with no children", () => {
			const div = document.createElement("div");

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, { "color": "red" });
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			expect(div.style.getPropertyValue("color")).toBe("red");
			expect(window.getComputedStyle).toHaveBeenCalledTimes(1);
		});

		it("handles element with no computed styles at all", () => {
			const div = document.createElement("div");

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, {});
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			expect(div.style.length).toBe(0);
		});

		it("handles mixed children (HTMLElement + SVG + text + comment)", () => {
			const parent = document.createElement("div");
			const htmlChild = document.createElement("span");
			const svgChild = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect",
			);
			const textNode = document.createTextNode("text");
			const comment = document.createComment("comment");

			parent.appendChild(htmlChild);
			parent.appendChild(svgChild);
			parent.appendChild(textNode);
			parent.appendChild(comment);

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(parent, { "color": "black" });
			styleMap.set(htmlChild, { "font-size": "12px" });
			mockGetComputedStyle(styleMap);

			inlineStyles(parent);

			expect(window.getComputedStyle).toHaveBeenCalledTimes(2);
			expect(parent.style.getPropertyValue("color")).toBe("black");
			expect(htmlChild.style.getPropertyValue("font-size")).toBe("12px");
		});

		it("inlines all 15 defined properties when all have values", () => {
			const div = document.createElement("div");
			const allProps: Record<string, string> = {
				"color": "rgb(0, 0, 0)",
				"font-family": "Arial",
				"font-size": "16px",
				"font-weight": "400",
				"font-style": "normal",
				"text-decoration": "none",
				"text-align": "left",
				"line-height": "1.5",
				"margin": "0px",
				"padding": "0px",
				"background-color": "rgba(0, 0, 0, 0)",
				"list-style-type": "disc",
				"border": "0px none rgb(0, 0, 0)",
				"border-collapse": "separate",
				"white-space": "normal",
			};

			const styleMap = new Map<HTMLElement, Record<string, string>>();
			styleMap.set(div, allProps);
			mockGetComputedStyle(styleMap);

			inlineStyles(div);

			for (const prop of Object.keys(allProps)) {
				expect(div.style.getPropertyValue(prop)).not.toBe("");
			}
		});
	});
});

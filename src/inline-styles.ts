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

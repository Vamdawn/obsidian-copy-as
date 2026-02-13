export async function convertSvgsToImages(
	container: HTMLElement,
): Promise<void> {
	const svgs = Array.from(container.querySelectorAll("svg"));

	for (const svg of svgs) {
		const img = await svgToImg(svg);
		if (img) {
			svg.replaceWith(img);
		}
	}
}

function getSvgDimension(svg: SVGSVGElement, attr: "width" | "height"): number {
	const animated = svg[attr];
	if (animated?.baseVal?.value) return animated.baseVal.value;
	const attrVal = Number(svg.getAttribute(attr));
	if (attrVal > 0) return attrVal;
	return svg.getBoundingClientRect()[attr];
}

function svgToImg(svg: SVGSVGElement): Promise<HTMLImageElement | null> {
	const width = getSvgDimension(svg, "width");
	const height = getSvgDimension(svg, "height");

	if (width === 0 || height === 0) return Promise.resolve(null);

	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svg);
	const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

	const scale = window.devicePixelRatio || 2;

	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = width * scale;
			canvas.height = height * scale;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				resolve(null);
				return;
			}
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
			const pngDataUrl = canvas.toDataURL("image/png");

			const img = document.createElement("img");
			img.src = pngDataUrl;
			img.setAttribute("width", String(width));
			img.setAttribute("height", String(height));
			resolve(img);
		};
		image.onerror = () => resolve(null);
		image.src = svgDataUrl;
	});
}

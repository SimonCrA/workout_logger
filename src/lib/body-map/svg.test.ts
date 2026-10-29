import { describe, expect, it } from 'vitest';
import { prepareBodyMapSvg } from './svg';

const raw = `<svg width="700" height="700" viewBox="0 15 160 265" id="svg1" xmlns="http://www.w3.org/2000/svg"><g id="back-view" style="display:inline"><path class="muscle" style="stroke-width:0.4;paint-order:markers stroke fill" d="m 1 1" id="traps_b" /></g></svg>`;

describe('prepareBodyMapSvg', () => {
	it('drops the fixed size and the inline styles so CSS can scale and color the map', () => {
		const svg = prepareBodyMapSvg(raw);

		expect(svg).not.toContain('style=');
		expect(svg).not.toContain('width="700"');
		expect(svg).not.toContain('height="700"');
	});

	it('keeps the view groups, region ids, classes and the viewBox', () => {
		const svg = prepareBodyMapSvg(raw);

		expect(svg).toContain('id="back-view"');
		expect(svg).toContain('id="traps_b"');
		expect(svg).toContain('class="muscle"');
		expect(svg).toContain('viewBox="0 15 160 265"');
	});
});

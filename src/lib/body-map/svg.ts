import raw from '../assets/muscle-map.svg?raw';

/**
 * Deja el SVG del mapa listo para insertarlo en la página: sin tamaño fijo, para que escale con
 * su contenedor, y sin estilos en línea de Inkscape, para que el color lo ponga el componente.
 */
export function prepareBodyMapSvg(svg: string): string {
	return svg
		.replace(
			/<svg\b([^>]*)>/,
			(_, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')}>`
		)
		.replace(/\sstyle="[^"]*"/g, '');
}

export const bodyMapSvg = prepareBodyMapSvg(raw);

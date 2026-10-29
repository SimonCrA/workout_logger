/**
 * UUID v7: 48 bits de milisegundos desde la época, versión, 74 bits aleatorios.
 * Ordena por tiempo de creación, que es lo que la sincronización necesita (ADR-0001).
 */
export function uuidv7(timestamp = Date.now()): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	let ms = BigInt(timestamp);
	for (let i = 5; i >= 0; i--) {
		bytes[i] = Number(ms & 0xffn);
		ms >>= 8n;
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

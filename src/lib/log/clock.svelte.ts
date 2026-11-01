/**
 * La hora actual como estado de Svelte. Se llama al inicializar un componente; el intervalo
 * vive mientras el componente.
 */
function ticking(ms: number): { readonly now: Date } {
	let now = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => (now = new Date()), ms);
		return () => clearInterval(timer);
	});
	return {
		get now() {
			return now;
		}
	};
}

/**
 * Al minuto. Un libre deja de estar en curso solo por el paso del tiempo, así que las páginas que
 * lo muestran vuelven a aplicar la regla cada minuto; el tiempo transcurrido se lee en minutos.
 */
export const minuteClock = () => ticking(60_000);

/** Al segundo: solo para el contador de descanso, que existe mientras hay acompañamiento. */
export const secondClock = () => ticking(1_000);

/**
 * La hora actual como estado de Svelte, al minuto. Un libre deja de estar en curso solo por el
 * paso del tiempo, así que las páginas que lo muestran vuelven a aplicar la regla cada minuto.
 * Se llama al inicializar un componente.
 */
export function minuteClock(): { readonly now: Date } {
	let now = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(timer);
	});
	return {
		get now() {
			return now;
		}
	};
}

import type { Observable } from 'dexie';

/**
 * Expone una consulta viva de Dexie como estado de Svelte. Se llama al inicializar un componente;
 * `value` es `undefined` hasta la primera respuesta de la base.
 */
export function live<T>(query: () => Observable<T>): { readonly value: T | undefined } {
	let value = $state<T | undefined>(undefined);
	$effect(() => {
		const subscription = query().subscribe({ next: (next) => (value = next) });
		return () => subscription.unsubscribe();
	});
	return {
		get value() {
			return value;
		}
	};
}

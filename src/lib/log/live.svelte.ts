import type { Observable } from 'dexie';

/**
 * Expone una consulta viva de Dexie como estado de Svelte. Se llama al inicializar un componente;
 * `value` es `undefined` hasta la primera respuesta de la base y vuelve a serlo si la consulta cambia.
 */
export function live<T>(query: () => Observable<T>): { readonly value: T | undefined } {
	let value = $state<T | undefined>(undefined);
	$effect(() => {
		const observable = query();
		value = undefined;
		const subscription = observable.subscribe({
			next: (next) => (value = next),
			error: (error) => console.error('Consulta viva fallida', error)
		});
		return () => subscription.unsubscribe();
	});
	return {
		get value() {
			return value;
		}
	};
}

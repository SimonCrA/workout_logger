<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';

	/**
	 * Aviso antes de mezclar dos cuentas en un dispositivo (spec #7): o se borra lo local y se sigue
	 * con la cuenta nueva, o no se entra.
	 */
	let {
		open = $bindable(false),
		ownerEmail,
		newEmail,
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		ownerEmail: string | null;
		newEmail: string;
		onconfirm: () => void | Promise<void>;
		oncancel: () => void | Promise<void>;
	} = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Este teléfono tiene datos de otra cuenta</AlertDialog.Title>
			<AlertDialog.Description>
				Las series guardadas aquí pertenecen a {ownerEmail ?? 'otra cuenta'}, y las registradas sin
				cuenta después también se borrarían. Para entrar con {newEmail} hay que borrarlas de este teléfono;
				las de la otra cuenta siguen a salvo en el servidor.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={oncancel}>No entrar</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onconfirm}>Borrar lo local y entrar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

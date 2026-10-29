/** Reglas de la cuenta compartidas por el servidor, el formulario y el comando de consola. */
export const MIN_PASSWORD_LENGTH = 8;

/** Mensajes en español para los códigos de error de Better Auth que el formulario puede recibir. */
export const authErrorMessages: Record<string, string> = {
	USER_ALREADY_EXISTS: 'Ya hay una cuenta con ese email.',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya hay una cuenta con ese email.',
	INVALID_EMAIL_OR_PASSWORD: 'Email o contraseña incorrectos.',
	INVALID_EMAIL: 'Ese email no parece válido.',
	PASSWORD_TOO_SHORT: `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
	PASSWORD_TOO_LONG: 'La contraseña es demasiado larga.',
	TOO_MANY_REQUESTS: 'Demasiados intentos; espera un momento.'
};

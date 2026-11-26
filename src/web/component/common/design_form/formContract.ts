/** Общий баннер при ошибках клиентской validate() — как на auth и в athletes-states. */
export const FORM_CHECK_BANNER = "Проверьте поля формы";

export function focusFirstFieldByName(
	container: HTMLElement | null | undefined,
	names: readonly string[]
): void {
	const first = names.find(name => container?.querySelector(`[name="${name}"]`));
	if (!first) return;
	window.requestAnimationFrame(() => {
		container?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
	});
}
/** Синхронно с go `internal/model/athlete_limits.go` и migration 4. */
export const ATHLETE_NAME_MAX_LEN = 100;
export const ATHLETE_NOTE_MAX_LEN = 2000;
/** Сырой ввод телефона (с пробелами); после нормализации на API ≤ 16. */
export const ATHLETE_PHONE_INPUT_MAX_LEN = 32;

export const ATHLETES_LIST_DEFAULT_LIMIT = 50;
export const ATHLETES_LIST_MAX_LIMIT = 200;
export const ATHLETES_SEARCH_Q_MAX_LEN = 200;

export const ATHLETE_FIELD_TOO_LONG_MSG = (max: number) => `Не больше ${max} символов`;

export function trimToMax(value: string, max: number): string {
	if (value.length <= max) return value;
	return value.slice(0, max);
}
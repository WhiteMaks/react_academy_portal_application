import {LIST_QUERY_DEFAULT_LIMIT, LIST_QUERY_MAX_LIMIT} from "./listPagination";

/** Синхронно с go `internal/model/coach_limits.go` и migration 5. */
export const COACH_NAME_MAX_LEN = 100;
export const COACH_SPECIALIZATION_MAX_LEN = 200;
export const COACH_NOTE_MAX_LEN = 2000;
/** Сырой ввод телефона (с пробелами); после нормализации на API ≤ 16. */
export const COACH_PHONE_INPUT_MAX_LEN = 32;

export const COACHES_LIST_DEFAULT_LIMIT = LIST_QUERY_DEFAULT_LIMIT;
export const COACHES_LIST_MAX_LIMIT = LIST_QUERY_MAX_LIMIT;
export const COACHES_SEARCH_Q_MAX_LEN = 200;

export {ATHLETE_FIELD_TOO_LONG_MSG as COACH_FIELD_TOO_LONG_MSG, trimToMax} from "./athleteFieldLimits";
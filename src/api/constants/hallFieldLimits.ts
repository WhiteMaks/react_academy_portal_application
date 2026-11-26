import {LIST_QUERY_DEFAULT_LIMIT, LIST_QUERY_MAX_LIMIT} from "./listPagination";

/** Синхронно с go `internal/model/hall_limits.go`. */
export const HALL_NAME_MAX_LEN = 120;
export const HALL_SUBTITLE_MAX_LEN = 200;
export const HALL_NOTE_MAX_LEN = 2000;
export const HALL_CAPACITY_MIN = 1;
export const HALL_CAPACITY_MAX = 999;

export const HALLS_LIST_DEFAULT_LIMIT = LIST_QUERY_DEFAULT_LIMIT;
export const HALLS_LIST_MAX_LIMIT = LIST_QUERY_MAX_LIMIT;
export const HALLS_SEARCH_Q_MAX_LEN = 200;

export {
	ATHLETE_FIELD_TOO_LONG_MSG as HALL_FIELD_TOO_LONG_MSG,
	trimToMax
} from "./athleteFieldLimits";
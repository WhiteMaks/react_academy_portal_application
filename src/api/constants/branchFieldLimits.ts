import {LIST_QUERY_DEFAULT_LIMIT, LIST_QUERY_MAX_LIMIT} from "./listPagination";

/** Синхронно с go `internal/model/branch_limits.go`. */
export const BRANCH_NAME_MAX_LEN = 120;
export const BRANCH_ADDRESS_MAX_LEN = 300;
export const BRANCH_NOTE_MAX_LEN = 2000;

export const BRANCHES_LIST_DEFAULT_LIMIT = LIST_QUERY_DEFAULT_LIMIT;
export const BRANCHES_LIST_MAX_LIMIT = LIST_QUERY_MAX_LIMIT;
export const BRANCHES_SEARCH_Q_MAX_LEN = 200;

export {
	ATHLETE_FIELD_TOO_LONG_MSG as BRANCH_FIELD_TOO_LONG_MSG,
	trimToMax
} from "./athleteFieldLimits";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import GetCoachesV1Response from "../../../api/models/coach/GetCoachesV1Response";
import CoachV1Response from "../../../api/models/coach/CoachV1Response";
import PostCoachV1Request from "../../../api/models/coach/PostCoachV1Request";
import PutCoachV1Request from "../../../api/models/coach/PutCoachV1Request";
import {COACHES_LIST_DEFAULT_LIMIT} from "../../../api/constants/coachFieldLimits";

const LIST_LIMIT = COACHES_LIST_DEFAULT_LIMIT;

export interface CoachesListParams {
	q: string;
	offset: number;
}

interface CoachesState {
	list: CoachV1Response[];
	total: number;
	limit: number;
	offset: number;
	query: string;
	listLoading: boolean;
	listErrorKind?: ApiErrorKind;
	listRequestId?: string;
	createLoading: boolean;
	createErrorKind?: ApiErrorKind;
	detail?: CoachV1Response;
	detailLoading: boolean;
	detailErrorKind?: ApiErrorKind;
	updateLoading: boolean;
	updateErrorKind?: ApiErrorKind;
}

const initialState: CoachesState = {
	list: [],
	total: 0,
	limit: LIST_LIMIT,
	offset: 0,
	query: "",
	listLoading: false,
	createLoading: false,
	detailLoading: false,
	updateLoading: false
};

const service = AcademyPortalService.getInstance();

export const fetchCoaches = createAsyncThunk<GetCoachesV1Response, CoachesListParams, {rejectValue: ApiFailure}>(
	"coaches/list",
	async ({q, offset}, {rejectWithValue}) => {
		try {
			return await service.getCoachesV1({q: q || undefined, limit: LIST_LIMIT, offset});
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const fetchCoachDetail = createAsyncThunk<CoachV1Response, string, {rejectValue: ApiFailure}>(
	"coaches/detail",
	async (id, {rejectWithValue}) => {
		try {
			return await service.getCoachV1(id);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const putCoachV1 = createAsyncThunk<
	CoachV1Response,
	{id: string; body: PutCoachV1Request},
	{rejectValue: ApiFailure}
>("coaches/update", async ({id, body}, {rejectWithValue}) => {
	try {
		return await service.putCoachV1(id, body);
	} catch (error) {
		return rejectWithValue(toApiFailure(error));
	}
});

export const createCoach = createAsyncThunk<CoachV1Response, PostCoachV1Request, {rejectValue: ApiFailure}>(
	"coaches/create",
	async (body, {rejectWithValue}) => {
		try {
			return await service.postCoachV1(body);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const coachSlice = createSlice({
	name: "coaches",
	initialState,
	reducers: {
		clearCoachDetail: state => {
			state.detail = undefined;
			state.detailErrorKind = undefined;
			state.detailLoading = false;
			state.updateLoading = false;
			state.updateErrorKind = undefined;
		},
		patchCoachInList: (state, action: PayloadAction<CoachV1Response>) => {
			const updated = action.payload;
			const index = state.list.findIndex(item => item.id === updated.id);
			if (index >= 0) {
				state.list[index] = updated;
			}
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchCoaches.pending, (state, action) => {
			state.listLoading = true;
			state.listErrorKind = undefined;
			state.listRequestId = action.meta.requestId;
		});
		builder.addCase(fetchCoaches.fulfilled, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.list = action.payload.coaches;
			state.total = action.payload.total;
			state.limit = action.payload.limit;
			state.offset = action.payload.offset;
			state.query = action.meta.arg.q;
			state.listErrorKind = undefined;
			state.listRequestId = undefined;
		});
		builder.addCase(fetchCoaches.rejected, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.listErrorKind = action.payload?.kind ?? "service";
			state.listRequestId = undefined;
		});
		builder.addCase(fetchCoachDetail.pending, state => {
			state.detailLoading = true;
			state.detailErrorKind = undefined;
			state.detail = undefined;
		});
		builder.addCase(fetchCoachDetail.fulfilled, (state, action) => {
			state.detailLoading = false;
			state.detail = action.payload;
		});
		builder.addCase(fetchCoachDetail.rejected, (state, action) => {
			state.detailLoading = false;
			state.detailErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(putCoachV1.pending, state => {
			state.updateLoading = true;
			state.updateErrorKind = undefined;
		});
		builder.addCase(putCoachV1.fulfilled, (state, action) => {
			state.updateLoading = false;
			state.detail = action.payload;
			const index = state.list.findIndex(item => item.id === action.payload.id);
			if (index >= 0) {
				state.list[index] = action.payload;
			}
		});
		builder.addCase(putCoachV1.rejected, (state, action) => {
			state.updateLoading = false;
			state.updateErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(createCoach.pending, state => {
			state.createLoading = true;
			state.createErrorKind = undefined;
		});
		builder.addCase(createCoach.fulfilled, (state, action) => {
			state.createLoading = false;
			if (state.offset === 0 && state.query === "") {
				state.list = [action.payload, ...state.list];
				state.total += 1;
			}
		});
		builder.addCase(createCoach.rejected, (state, action) => {
			state.createLoading = false;
			state.createErrorKind = action.payload?.kind ?? "service";
		});
	}
});

export const coachActions = coachSlice.actions;
export default coachSlice.reducer;
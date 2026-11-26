import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import GetAthletesV1Response from "../../../api/models/athlete/GetAthletesV1Response";
import AthleteV1Response from "../../../api/models/athlete/AthleteV1Response";
import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";
import {ATHLETES_LIST_DEFAULT_LIMIT} from "../../../api/constants/athleteFieldLimits";

const LIST_LIMIT = ATHLETES_LIST_DEFAULT_LIMIT;

export interface AthletesListParams {
	q: string;
	offset: number;
}

interface AthletesState {
	list: AthleteV1Response[];
	total: number;
	limit: number;
	offset: number;
	query: string;
	listLoading: boolean;
	listErrorKind?: ApiErrorKind;
	listRequestId?: string;
	createLoading: boolean;
	createErrorKind?: ApiErrorKind;
	detail?: AthleteV1Response;
	detailLoading: boolean;
	detailErrorKind?: ApiErrorKind;
}

const initialState: AthletesState = {
	list: [],
	total: 0,
	limit: LIST_LIMIT,
	offset: 0,
	query: "",
	listLoading: false,
	createLoading: false,
	detailLoading: false
};

const service = AcademyPortalService.getInstance();

export const fetchAthletes = createAsyncThunk<GetAthletesV1Response, AthletesListParams, {rejectValue: ApiFailure}>(
	"athletes/list",
	async ({q, offset}, {rejectWithValue}) => {
		try {
			return await service.getAthletesV1({q: q || undefined, limit: LIST_LIMIT, offset});
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const fetchAthleteDetail = createAsyncThunk<AthleteV1Response, string, {rejectValue: ApiFailure}>(
	"athletes/detail",
	async (id, {rejectWithValue}) => {
		try {
			return await service.getAthleteV1(id);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const createAthlete = createAsyncThunk<AthleteV1Response, PostAthleteV1Request, {rejectValue: ApiFailure}>(
	"athletes/create",
	async (body, {rejectWithValue}) => {
		try {
			return await service.postAthleteV1(body);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const athleteSlice = createSlice({
	name: "athletes",
	initialState,
	reducers: {
		prependAthlete: (state, action: PayloadAction<AthleteV1Response>) => {
			state.list = [action.payload, ...state.list];
			state.total += 1;
		},
		clearAthleteDetail: state => {
			state.detail = undefined;
			state.detailErrorKind = undefined;
			state.detailLoading = false;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchAthletes.pending, (state, action) => {
			state.listLoading = true;
			state.listErrorKind = undefined;
			state.listRequestId = action.meta.requestId;
		});
		builder.addCase(fetchAthletes.fulfilled, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.list = action.payload.athletes;
			state.total = action.payload.total;
			state.limit = action.payload.limit;
			state.offset = action.payload.offset;
			state.query = action.meta.arg.q;
			state.listErrorKind = undefined;
			state.listRequestId = undefined;
		});
		builder.addCase(fetchAthletes.rejected, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.listErrorKind = action.payload?.kind ?? "service";
			state.listRequestId = undefined;
		});
		builder.addCase(fetchAthleteDetail.pending, state => {
			state.detailLoading = true;
			state.detailErrorKind = undefined;
			state.detail = undefined;
		});
		builder.addCase(fetchAthleteDetail.fulfilled, (state, action) => {
			state.detailLoading = false;
			state.detail = action.payload;
		});
		builder.addCase(fetchAthleteDetail.rejected, (state, action) => {
			state.detailLoading = false;
			state.detailErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(createAthlete.pending, state => {
			state.createLoading = true;
			state.createErrorKind = undefined;
		});
		builder.addCase(createAthlete.fulfilled, (state, action) => {
			state.createLoading = false;
			if (state.offset === 0 && state.query === "") {
				state.list = [action.payload, ...state.list];
				state.total += 1;
			}
		});
		builder.addCase(createAthlete.rejected, (state, action) => {
			state.createLoading = false;
			state.createErrorKind = action.payload?.kind ?? "service";
		});
	}
});

export const athleteActions = athleteSlice.actions;
export default athleteSlice.reducer;
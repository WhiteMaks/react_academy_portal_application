import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import GetBranchesV1Response from "../../../api/models/branch/GetBranchesV1Response";
import BranchV1Response from "../../../api/models/branch/BranchV1Response";
import PostBranchV1Request from "../../../api/models/branch/PostBranchV1Request";
import PutBranchV1Request from "../../../api/models/branch/PutBranchV1Request";
import GetBranchHallsV1Response from "../../../api/models/hall/GetBranchHallsV1Response";
import HallV1Response from "../../../api/models/hall/HallV1Response";
import PostHallV1Request from "../../../api/models/hall/PostHallV1Request";
import {BRANCHES_LIST_DEFAULT_LIMIT} from "../../../api/constants/branchFieldLimits";
import {fetchAllBranchHalls} from "../../../api/util/fetchAllBranchHalls";

const countHallsOnPage = (halls: HallV1Response[]): {active: number; total: number} => ({
	active: halls.filter(h => h.activity_status === "active").length,
	total: halls.length
});

const LIST_LIMIT = BRANCHES_LIST_DEFAULT_LIMIT;

export interface BranchesListParams {
	q: string;
	offset: number;
}

export type BranchHallCounts = {active: number; total: number};

interface BranchesState {
	list: BranchV1Response[];
	total: number;
	limit: number;
	offset: number;
	query: string;
	listLoading: boolean;
	listErrorKind?: ApiErrorKind;
	listRequestId?: string;
	hallCounts: Record<number, BranchHallCounts>;
	hallCountsLoading: boolean;
	createLoading: boolean;
	createErrorKind?: ApiErrorKind;
	detail?: BranchV1Response;
	detailLoading: boolean;
	detailErrorKind?: ApiErrorKind;
	updateLoading: boolean;
	updateErrorKind?: ApiErrorKind;
	halls: HallV1Response[];
	hallsTotal: number;
	hallsBranchId?: number;
	hallsLoading: boolean;
	hallsErrorKind?: ApiErrorKind;
	createHallLoading: boolean;
	createHallErrorKind?: ApiErrorKind;
}

const initialState: BranchesState = {
	list: [],
	total: 0,
	limit: LIST_LIMIT,
	offset: 0,
	query: "",
	listLoading: false,
	hallCounts: {},
	hallCountsLoading: false,
	createLoading: false,
	detailLoading: false,
	updateLoading: false,
	halls: [],
	hallsTotal: 0,
	hallsLoading: false,
	createHallLoading: false
};

const service = AcademyPortalService.getInstance();

export const fetchBranches = createAsyncThunk<GetBranchesV1Response, BranchesListParams, {rejectValue: ApiFailure}>(
	"branches/list",
	async ({q, offset}, {rejectWithValue}) => {
		try {
			return await service.getBranchesV1({q: q || undefined, limit: LIST_LIMIT, offset});
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const fetchBranchHallCounts = createAsyncThunk<
	Record<number, BranchHallCounts>,
	number[],
	{rejectValue: ApiFailure}
>("branches/hallCounts", async (branchIds, {rejectWithValue}) => {
	try {
		const counts: Record<number, BranchHallCounts> = {};
		await Promise.all(
			branchIds.map(async branchId => {
				try {
					const response = await fetchAllBranchHalls(service, String(branchId));
					const fromPage = countHallsOnPage(response.halls);
					counts[branchId] = {
						active: fromPage.active,
						total: response.total
					};
				} catch {
					/* skip single branch */
				}
			})
		);
		return counts;
	} catch (error) {
		return rejectWithValue(toApiFailure(error));
	}
});

export const fetchBranchDetail = createAsyncThunk<BranchV1Response, string, {rejectValue: ApiFailure}>(
	"branches/detail",
	async (id, {rejectWithValue}) => {
		try {
			return await service.getBranchV1(id);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const putBranchV1 = createAsyncThunk<
	BranchV1Response,
	{id: string; body: PutBranchV1Request},
	{rejectValue: ApiFailure}
>("branches/update", async ({id, body}, {rejectWithValue}) => {
	try {
		return await service.putBranchV1(id, body);
	} catch (error) {
		return rejectWithValue(toApiFailure(error));
	}
});

export const createBranch = createAsyncThunk<BranchV1Response, PostBranchV1Request, {rejectValue: ApiFailure}>(
	"branches/create",
	async (body, {rejectWithValue}) => {
		try {
			return await service.postBranchV1(body);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const fetchBranchHalls = createAsyncThunk<GetBranchHallsV1Response, string, {rejectValue: ApiFailure}>(
	"branches/halls",
	async (branchId, {rejectWithValue}) => {
		try {
			return await fetchAllBranchHalls(service, branchId);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const createHall = createAsyncThunk<HallV1Response, PostHallV1Request, {rejectValue: ApiFailure}>(
	"branches/createHall",
	async (body, {rejectWithValue}) => {
		try {
			return await service.postHallV1(body);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const branchSlice = createSlice({
	name: "branches",
	initialState,
	reducers: {
		clearBranchDetail: state => {
			state.detail = undefined;
			state.detailErrorKind = undefined;
			state.detailLoading = false;
			state.updateLoading = false;
			state.updateErrorKind = undefined;
			state.halls = [];
			state.hallsTotal = 0;
			state.hallsBranchId = undefined;
			state.hallsLoading = false;
			state.hallsErrorKind = undefined;
			state.createHallLoading = false;
			state.createHallErrorKind = undefined;
		},
		patchBranchHallCount: (
			state,
			action: PayloadAction<{branchId: number; counts: BranchHallCounts}>
		) => {
			state.hallCounts[action.payload.branchId] = action.payload.counts;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchBranches.pending, (state, action) => {
			state.listLoading = true;
			state.listErrorKind = undefined;
			state.listRequestId = action.meta.requestId;
		});
		builder.addCase(fetchBranches.fulfilled, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.list = action.payload.branches;
			state.total = action.payload.total;
			state.limit = action.payload.limit;
			state.offset = action.payload.offset;
			state.query = action.meta.arg.q;
			state.listErrorKind = undefined;
			state.listRequestId = undefined;
		});
		builder.addCase(fetchBranches.rejected, (state, action) => {
			if (state.listRequestId !== action.meta.requestId) return;
			state.listLoading = false;
			state.listErrorKind = action.payload?.kind ?? "service";
			state.listRequestId = undefined;
		});
		builder.addCase(fetchBranchHallCounts.pending, state => {
			state.hallCountsLoading = true;
		});
		builder.addCase(fetchBranchHallCounts.fulfilled, (state, action) => {
			state.hallCountsLoading = false;
			state.hallCounts = {...state.hallCounts, ...action.payload};
		});
		builder.addCase(fetchBranchHallCounts.rejected, state => {
			state.hallCountsLoading = false;
		});
		builder.addCase(fetchBranchDetail.pending, state => {
			state.detailLoading = true;
			state.detailErrorKind = undefined;
			state.detail = undefined;
		});
		builder.addCase(fetchBranchDetail.fulfilled, (state, action) => {
			state.detailLoading = false;
			state.detail = action.payload;
		});
		builder.addCase(fetchBranchDetail.rejected, (state, action) => {
			state.detailLoading = false;
			state.detailErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(putBranchV1.pending, state => {
			state.updateLoading = true;
			state.updateErrorKind = undefined;
		});
		builder.addCase(putBranchV1.fulfilled, (state, action) => {
			state.updateLoading = false;
			state.detail = action.payload;
			const index = state.list.findIndex(item => item.id === action.payload.id);
			if (index >= 0) {
				state.list[index] = action.payload;
			}
		});
		builder.addCase(putBranchV1.rejected, (state, action) => {
			state.updateLoading = false;
			state.updateErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(createBranch.pending, state => {
			state.createLoading = true;
			state.createErrorKind = undefined;
		});
		builder.addCase(createBranch.fulfilled, (state, action) => {
			state.createLoading = false;
			if (state.offset === 0 && state.query === "") {
				state.list = [action.payload, ...state.list];
				state.total += 1;
			}
			state.hallCounts[action.payload.id] = {active: 0, total: 0};
		});
		builder.addCase(createBranch.rejected, (state, action) => {
			state.createLoading = false;
			state.createErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(fetchBranchHalls.pending, (state, action) => {
			state.hallsLoading = true;
			state.hallsErrorKind = undefined;
			state.hallsBranchId = Number(action.meta.arg);
		});
		builder.addCase(fetchBranchHalls.fulfilled, (state, action) => {
			state.hallsLoading = false;
			state.halls = action.payload.halls;
			state.hallsTotal = action.payload.total;
			const branchId = state.hallsBranchId;
			if (branchId !== undefined) {
				const counts = countHallsOnPage(action.payload.halls);
				state.hallCounts[branchId] = {active: counts.active, total: action.payload.total};
			}
		});
		builder.addCase(fetchBranchHalls.rejected, (state, action) => {
			state.hallsLoading = false;
			state.hallsErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(createHall.pending, state => {
			state.createHallLoading = true;
			state.createHallErrorKind = undefined;
		});
		builder.addCase(createHall.fulfilled, (state, action) => {
			state.createHallLoading = false;
			if (state.hallsBranchId === action.payload.branch_id) {
				state.halls = [action.payload, ...state.halls];
				state.hallsTotal += 1;
				const prev = state.hallCounts[action.payload.branch_id] ?? {active: 0, total: 0};
				state.hallCounts[action.payload.branch_id] = {
					active: prev.active + (action.payload.activity_status === "active" ? 1 : 0),
					total: prev.total + 1
				};
			}
		});
		builder.addCase(createHall.rejected, (state, action) => {
			state.createHallLoading = false;
			state.createHallErrorKind = action.payload?.kind ?? "service";
		});
	}
});

export const branchActions = branchSlice.actions;
export default branchSlice.reducer;
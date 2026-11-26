import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiError, ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import HallV1Response from "../../../api/models/hall/HallV1Response";
import PutHallV1Request from "../../../api/models/hall/PutHallV1Request";

interface HallState {
	detail?: HallV1Response;
	detailLoading: boolean;
	detailErrorKind?: ApiErrorKind;
	updateLoading: boolean;
	updateErrorKind?: ApiErrorKind;
}

const initialState: HallState = {
	detailLoading: false,
	updateLoading: false
};

const service = AcademyPortalService.getInstance();

export const fetchHallDetail = createAsyncThunk<HallV1Response, string, {rejectValue: ApiFailure}>(
	"halls/detail",
	async (id, {rejectWithValue}) => {
		try {
			return await service.getHallV1(id);
		} catch (error) {
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const putHallV1 = createAsyncThunk<
	HallV1Response,
	{id: string; body: PutHallV1Request},
	{rejectValue: ApiFailure}
>("halls/update", async ({id, body}, {rejectWithValue}) => {
	try {
		return await service.putHallV1(id, body);
	} catch (error) {
		const failure = toApiFailure(error);
		if (error instanceof ApiError && error.serverMessage) {
			return rejectWithValue({...failure, message: error.serverMessage});
		}
		return rejectWithValue(failure);
	}
});

export const hallSlice = createSlice({
	name: "halls",
	initialState,
	reducers: {
		clearHallDetail: state => {
			state.detail = undefined;
			state.detailErrorKind = undefined;
			state.detailLoading = false;
			state.updateLoading = false;
			state.updateErrorKind = undefined;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchHallDetail.pending, state => {
			state.detailLoading = true;
			state.detailErrorKind = undefined;
			state.detail = undefined;
		});
		builder.addCase(fetchHallDetail.fulfilled, (state, action) => {
			state.detailLoading = false;
			state.detail = action.payload;
		});
		builder.addCase(fetchHallDetail.rejected, (state, action) => {
			state.detailLoading = false;
			state.detailErrorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(putHallV1.pending, state => {
			state.updateLoading = true;
			state.updateErrorKind = undefined;
		});
		builder.addCase(putHallV1.fulfilled, (state, action) => {
			state.updateLoading = false;
			state.detail = action.payload;
		});
		builder.addCase(putHallV1.rejected, (state, action) => {
			state.updateLoading = false;
			state.updateErrorKind = action.payload?.kind ?? "service";
		});
	}
});

export const hallActions = hallSlice.actions;
export default hallSlice.reducer;
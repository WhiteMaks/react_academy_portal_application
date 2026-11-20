import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import PostUserTokenV1Request from "../../../api/models/user/PostUserTokenV1Request";
import PostUserTokenV1Response from "../../../api/models/user/PostUserTokenV1Response";
import {fetchUser} from "./UserReducer";

interface UserTokenState {
	token: string | null;
	loading: boolean;
	sessionVersion: number;
	errorKind?: ApiErrorKind;
}

const initialState: UserTokenState = {
	token: localStorage.getItem("token"),
	loading: false,
	sessionVersion: 0
};

const service = AcademyPortalService.getInstance();

export const fetchUserToken = createAsyncThunk<PostUserTokenV1Response, PostUserTokenV1Request, {
	rejectValue: ApiFailure;
	state: {userTokenReducer: UserTokenState}
}>(
	"user/token",
	async (request, {rejectWithValue, getState}) => {
		const sessionVersion = getState().userTokenReducer.sessionVersion;
		try {
			const response = await service.postUserTokenV1(request);
			if (getState().userTokenReducer.sessionVersion !== sessionVersion) {
				return rejectWithValue({kind: "superseded"});
			}
			localStorage.setItem("token", response.token);
			return response;
		} catch (error) {
			if (getState().userTokenReducer.sessionVersion !== sessionVersion) {
				return rejectWithValue({kind: "superseded"});
			}
			return rejectWithValue(toApiFailure(error));
		}
	}
);

export const logoutUser = createAsyncThunk("user/logout", async () => {
	try {
		localStorage.removeItem("token");
	} catch {
		// Redux session state is still cleared if browser storage is unavailable.
	}
});

export const userTokenSlice = createSlice({
	name: "user/token",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(fetchUserToken.pending, state => {
			state.loading = true;
			state.sessionVersion += 1;
			state.errorKind = undefined;
		});
		builder.addCase(fetchUserToken.fulfilled, (state, action) => {
			state.loading = false;
			state.token = action.payload.token;
			state.errorKind = undefined;
		});
		builder.addCase(fetchUserToken.rejected, (state, action) => {
			state.loading = false;
			state.errorKind = action.payload?.kind ?? "service";
		});
		builder.addCase(fetchUser.rejected, (state, action) => {
			const kind = action.payload?.kind;
			if (kind === "unauthorized" || kind === "forbidden") {
				state.token = null;
				state.sessionVersion += 1;
				state.errorKind = kind;
			}
		});
		builder.addCase(logoutUser.pending, state => {
			state.token = null;
			state.loading = false;
			state.sessionVersion += 1;
			state.errorKind = undefined;
		});
		builder.addCase(logoutUser.fulfilled, state => {
			state.token = null;
			state.loading = false;
			state.errorKind = undefined;
		});
	}
});

export const userTokenActions = userTokenSlice.actions;

export default userTokenSlice.reducer;

import {createAction, createAsyncThunk, createSlice, ThunkAction, UnknownAction} from "@reduxjs/toolkit";
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
const tokenPending = createAction("user/token/pending");
const tokenFulfilled = createAction<string>("user/token/fulfilled");
const tokenRejected = createAction<ApiFailure>("user/token/rejected");

interface TokenThunkResult {
	unwrap: () => Promise<PostUserTokenV1Response>;
}

export const fetchUserToken = (request: PostUserTokenV1Request): ThunkAction<
	TokenThunkResult,
	{userTokenReducer: UserTokenState},
	unknown,
	UnknownAction
> => (dispatch, getState) => {
	const initialSessionVersion = getState().userTokenReducer.sessionVersion;
	dispatch(tokenPending());
	const promise = service.postUserTokenV1(request).then(response => {
		if (getState().userTokenReducer.sessionVersion !== initialSessionVersion + 1) {
			dispatch(tokenRejected({kind: "superseded"}));
			throw Object.assign(new Error("superseded"), {kind: "superseded" as const});
		}
		try {
			localStorage.setItem("token", response.token);
		} catch {
			// Keep the token in Redux even when browser storage is unavailable.
		}
		dispatch(tokenFulfilled(response.token));
		return response;
	}).catch(error => {
		if (error && typeof error === "object" && "kind" in error && error.kind === "superseded") throw error;
		const failure = toApiFailure(error);
		dispatch(tokenRejected(failure));
		throw failure;
	});
	return {unwrap: () => promise};
};

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
		builder.addCase(tokenPending, state => {
			state.loading = true;
			state.sessionVersion += 1;
			state.errorKind = undefined;
		});
		builder.addCase(tokenFulfilled, (state, action) => {
			state.loading = false;
			state.token = action.payload;
			state.errorKind = undefined;
		});
		builder.addCase(tokenRejected, (state, action) => {
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

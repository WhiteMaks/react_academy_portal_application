import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiErrorKind, ApiFailure, toApiFailure} from "../../../api/ApiError";
import GetUserV1Response from "../../../api/models/user/GetUserV1Response";
import {PayloadAction} from "@reduxjs/toolkit";

interface UserState {
	user?: GetUserV1Response;
	loading: boolean;
	errorKind?: ApiErrorKind;
	activeRequestId?: string;
}

interface UserSessionState {
	token: string | null;
	sessionVersion: number;
}

const initialState: UserState = {
	loading: false
};

const service = AcademyPortalService.getInstance();

const clearStoredToken = () => {
	try {
		localStorage.removeItem("token");
	} catch {
		// The in-memory role gate still denies access when storage is unavailable.
	}
};

export const fetchUser = createAsyncThunk<GetUserV1Response, void, {
	rejectValue: ApiFailure;
	state: {userReducer: UserState; userTokenReducer: UserSessionState}
}>(
	"user/current",
	async (_unused, {rejectWithValue, getState}) => {
		const initialSession = getState().userTokenReducer;
		const requestToken = initialSession.token;
		const requestVersion = initialSession.sessionVersion;
		if (!requestToken) return rejectWithValue({kind: "superseded"});

		const sessionIsCurrent = () => {
			const currentSession = getState().userTokenReducer;
			return currentSession.sessionVersion === requestVersion && currentSession.token === requestToken;
		};

		try {
			const user = await service.getUserV1();
			if (!sessionIsCurrent()) return rejectWithValue({kind: "superseded"});
			if (user.role !== "admin") {
				clearStoredToken();
				return rejectWithValue({kind: "forbidden"});
			}
			return user;
		} catch (error) {
			if (!sessionIsCurrent()) return rejectWithValue({kind: "superseded"});
			const failure = toApiFailure(error);
			if (failure.kind === "unauthorized") {
				clearStoredToken();
			}
			return rejectWithValue(failure);
		}
	},
	{
		condition: (_unused, {getState}) =>
			!getState().userReducer.loading && getState().userTokenReducer.token !== null
	}
);

export const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		clearUser: state => {
			state.user = undefined;
			state.errorKind = undefined;
			state.loading = false;
			state.activeRequestId = undefined;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchUser.pending, (state, action) => {
			state.loading = true;
			state.errorKind = undefined;
			state.activeRequestId = action.meta.requestId;
		});
		builder.addCase(fetchUser.fulfilled, (state, action) => {
			if (state.activeRequestId !== action.meta.requestId) return;
			state.loading = false;
			state.user = action.payload;
			state.errorKind = undefined;
			state.activeRequestId = undefined;
		});
		builder.addCase(fetchUser.rejected, (state, action) => {
			if (state.activeRequestId !== action.meta.requestId) return;
			state.loading = false;
			state.user = undefined;
			state.errorKind = action.payload?.kind === "superseded"
				? undefined
				: action.payload?.kind ?? "service";
			state.activeRequestId = undefined;
		});
		builder.addMatcher((action): action is PayloadAction =>
			["user/logout/pending", "user/logout/fulfilled", "user/token/fulfilled"].includes(action.type), state => {
			state.user = undefined;
			state.loading = false;
			state.errorKind = undefined;
			state.activeRequestId = undefined;
		});
	}
});

export const userActions = userSlice.actions;

export default userSlice.reducer;

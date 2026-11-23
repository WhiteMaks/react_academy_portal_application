import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiFailure, toApiFailure} from "../../../api/ApiError";
import AthleteV1Response from "../../../api/models/athlete/AthleteV1Response";
import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";

interface AthleteState {
	athletes: AthleteV1Response[];
	loading: boolean;
	saving: boolean;
	loaded: boolean;
	listErrorKind?: ApiFailure["kind"];
	createErrorKind?: ApiFailure["kind"];
	activeListRequestId?: string;
	activeCreateRequestId?: string;
	activeCreateSessionVersion?: number;
}

interface SessionState {
	token: string | null;
	sessionVersion: number;
}

interface StateWithSession {
	athleteReducer: AthleteState;
	userTokenReducer: SessionState;
}

interface CreateAthleteArgs {
	request: PostAthleteV1Request;
	sessionVersion: number;
}

const initialState: AthleteState = {athletes: [], loading: false, saving: false, loaded: false};
const service = AcademyPortalService.getInstance();

const compareId = (left: string, right: string) => {
	const normalizedLeft = left.replace(/^0+(?=\d)/, "");
	const normalizedRight = right.replace(/^0+(?=\d)/, "");
	return normalizedLeft.length - normalizedRight.length || normalizedLeft.localeCompare(normalizedRight);
};

const sortAthletes = (athletes: AthleteV1Response[]) => athletes.sort((left, right) =>
	left.secondName.localeCompare(right.secondName, "ru") || left.firstName.localeCompare(right.firstName, "ru") ||
	(left.middleName === null ? (right.middleName === null ? 0 : 1) : right.middleName === null ? -1 : left.middleName.localeCompare(right.middleName, "ru")) ||
	compareId(left.id, right.id)
);

export const fetchAthletes = createAsyncThunk<AthleteV1Response[], void, {
	rejectValue: ApiFailure;
	state: StateWithSession;
}>("athlete/list", async (_unused, {getState, rejectWithValue}) => {
	const {token, sessionVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	try {
		const response = await service.getAthletesV1();
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"});
		return response.athletes;
	} catch (error) {
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"});
		return rejectWithValue(toApiFailure(error));
	}
}, {condition: (_unused, {getState}) => !getState().athleteReducer.loading});

export const createAthlete = createAsyncThunk<AthleteV1Response, CreateAthleteArgs, {
	rejectValue: ApiFailure;
	state: StateWithSession;
}>("athlete/create", async ({request, sessionVersion: expectedSessionVersion}, {getState, rejectWithValue}) => {
	const {token, sessionVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	if (sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
	try {
		const response = await service.postAthleteV1(request);
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		return response;
	} catch (error) {
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		return rejectWithValue(toApiFailure(error));
	}
}, {condition: (args, {getState}) =>
	!getState().athleteReducer.saving && getState().userTokenReducer.token !== null &&
	args.sessionVersion === getState().userTokenReducer.sessionVersion
});

export const athleteSlice = createSlice({
	name: "athlete",
	initialState,
	reducers: {
		clearAthleteState: state => {
			state.athletes = [];
			state.loading = false;
			state.saving = false;
			state.loaded = false;
			state.listErrorKind = undefined;
			state.createErrorKind = undefined;
			state.activeListRequestId = undefined;
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchAthletes.pending, (state, action) => {
			state.loading = true;
			state.listErrorKind = undefined;
			state.activeListRequestId = action.meta.requestId;
		});
		builder.addCase(fetchAthletes.fulfilled, (state, action) => {
			if (state.activeListRequestId !== action.meta.requestId) return;
			state.loading = false;
			state.loaded = true;
			state.athletes = action.payload;
			state.listErrorKind = undefined;
			state.activeListRequestId = undefined;
		});
		builder.addCase(fetchAthletes.rejected, (state, action) => {
			if (state.activeListRequestId !== action.meta.requestId) return;
			state.loading = false;
			state.listErrorKind = action.payload?.kind === "superseded" ? undefined : action.payload?.kind ?? "service";
			state.activeListRequestId = undefined;
		});
		builder.addCase(createAthlete.pending, (state, action) => {
			state.saving = true;
			state.createErrorKind = undefined;
			state.activeCreateRequestId = action.meta.requestId;
			state.activeCreateSessionVersion = action.meta.arg.sessionVersion;
		});
		builder.addCase(createAthlete.fulfilled, (state, action) => {
			if (state.activeCreateRequestId !== action.meta.requestId || state.activeCreateSessionVersion !== action.meta.arg.sessionVersion) return;
			state.saving = false;
			state.athletes = sortAthletes([...state.athletes, action.payload]);
			state.loaded = true;
			state.createErrorKind = undefined;
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
		});
		builder.addCase(createAthlete.rejected, (state, action) => {
			if (state.activeCreateRequestId !== action.meta.requestId || state.activeCreateSessionVersion !== action.meta.arg.sessionVersion) return;
			state.saving = false;
			state.createErrorKind = action.payload?.kind === "superseded" ? undefined : action.payload?.kind ?? "service";
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
		});
		builder.addMatcher((action): action is PayloadAction =>
			["user/logout/pending", "user/logout/fulfilled", "user/token/pending", "user/token/fulfilled"].includes(action.type), state => {
			state.athletes = [];
			state.loading = false;
			state.saving = false;
			state.loaded = false;
			state.listErrorKind = undefined;
			state.createErrorKind = undefined;
			state.activeListRequestId = undefined;
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
		});
	}
});

export const athleteActions = athleteSlice.actions;
export default athleteSlice.reducer;

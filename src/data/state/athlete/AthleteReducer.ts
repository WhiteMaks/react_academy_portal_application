import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiFailure, toApiFailure} from "../../../api/ApiError";
import AthleteV1Response from "../../../api/models/athlete/AthleteV1Response";
import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";
import PutAthleteV1Request from "../../../api/models/athlete/PutAthleteV1Request";

interface AthleteState {
	catalogs: Record<"athletes" | "coaches", Record<"active" | "archived", AthleteCatalogState>>;
	selectedStatus: Record<"athletes" | "coaches", "active" | "archived">;
	saving: boolean;
	createErrorKind?: ApiFailure["kind"];
	profile: AthleteV1Response | null;
	profileId: string | null;
	profileLoaded: boolean;
	profileLoading: boolean;
	profileSaving: boolean;
	profileErrorKind?: ApiFailure["kind"];
	profileSaveErrorKind?: ApiFailure["kind"];
	activeCreateRequestId?: string;
	activeCreateSessionVersion?: number;
	activeProfileRequestId?: string;
	activeProfileRequestIdValue?: string;
	activeProfileRequestSessionVersion?: number;
	activeProfileSaveRequestId?: string;
	activeProfileSaveId?: string;
	activeProfileSaveSessionVersion?: number;
}

interface AthleteCatalogState {
	athletes: AthleteV1Response[];
	total: number;
	query: string;
	offset: number;
	loading: boolean;
	loaded: boolean;
	errorKind?: ApiFailure["kind"];
	activeRequestId?: string;
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

interface ProfileRequestArgs {
	id: string;
	sessionVersion: number;
}

interface ArchiveArgs extends ProfileRequestArgs {archived: boolean;}
interface CoachStatusArgs extends ProfileRequestArgs {isCoach: boolean;}

interface UpdateProfileArgs extends ProfileRequestArgs {
	request: PutAthleteV1Request;
}

const createCatalogState = (): AthleteCatalogState => ({athletes: [], total: 0, query: "", offset: 0, loading: false, loaded: false});
const createCatalogs = (): AthleteState["catalogs"] => ({
	athletes: {active: createCatalogState(), archived: createCatalogState()},
	coaches: {active: createCatalogState(), archived: createCatalogState()}
});
const directoryFor = (isCoach?: boolean): "athletes" | "coaches" => isCoach ? "coaches" : "athletes";
const invalidateCatalogs = (state: AthleteState) => {
	(Object.values(state.catalogs) as Array<Record<"active" | "archived", AthleteCatalogState>>).forEach(directory => {
		(Object.values(directory) as AthleteCatalogState[]).forEach(catalog => {
			catalog.loaded = false;
			catalog.loading = false;
			catalog.activeRequestId = undefined;
			catalog.errorKind = undefined;
		});
	});
};

const initialState: AthleteState = {
	catalogs: createCatalogs(), selectedStatus: {athletes: "active", coaches: "active"}, saving: false,
	profile: null, profileId: null, profileLoaded: false, profileLoading: false, profileSaving: false
};
const service = AcademyPortalService.getInstance();
export interface AthleteListArgs {status: "active" | "archived"; q?: string; limit?: number; offset?: number; isCoach?: boolean;}

export const fetchAthletes = createAsyncThunk<{athletes: AthleteV1Response[]; total: number; args: AthleteListArgs}, AthleteListArgs | void, {
	rejectValue: ApiFailure;
	state: StateWithSession;
}>("athlete/list", async (input, {getState, rejectWithValue}) => {
	const {token, sessionVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	try {
		const args: AthleteListArgs = input ?? {status: "active", limit: 50, offset: 0};
		const response = await service.getAthletesV1({status: args.status, q: args.q, limit: args.limit ?? 50, offset: args.offset ?? 0, isCoach: args.isCoach});
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"});
		return {athletes: response.athletes, total: response.total, args};
	} catch (error) {
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"});
		return rejectWithValue(toApiFailure(error));
	}
});

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

export const fetchAthlete = createAsyncThunk<AthleteV1Response, ProfileRequestArgs, {
	rejectValue: ApiFailure;
	state: StateWithSession;
}>("athlete/profile", async ({id, sessionVersion: expectedSessionVersion}, {getState, rejectWithValue}) => {
	const {token, sessionVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	if (sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
	try {
		const response = await service.getAthleteV1(id);
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		if (response.id !== id) return rejectWithValue({kind: "service"});
		return response;
	} catch (error) {
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		return rejectWithValue(toApiFailure(error));
	}
}, {condition: ({id, sessionVersion}, {getState}) => {
	const state = getState();
	return state.userTokenReducer.token !== null && state.userTokenReducer.sessionVersion === sessionVersion &&
		!(state.athleteReducer.profileLoading && state.athleteReducer.profileId === id) &&
		!(state.athleteReducer.profileLoaded && state.athleteReducer.profileId === id);
}});

export const updateAthlete = createAsyncThunk<AthleteV1Response, UpdateProfileArgs, {
	rejectValue: ApiFailure;
	state: StateWithSession;
}>("athlete/updateProfile", async ({id, request, sessionVersion: expectedSessionVersion}, {getState, rejectWithValue}) => {
	const {token, sessionVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	if (sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
	try {
		const response = await service.putAthleteV1(id, request);
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		if (response.id !== id) return rejectWithValue({kind: "service"});
		return response;
	} catch (error) {
		const session = getState().userTokenReducer;
		if (session.token !== token || session.sessionVersion !== expectedSessionVersion) return rejectWithValue({kind: "superseded"});
		return rejectWithValue(toApiFailure(error));
	}
}, {condition: ({id, sessionVersion}, {getState}) => {
	const state = getState();
	return !state.athleteReducer.profileSaving && state.athleteReducer.profileId === id &&
		state.userTokenReducer.token !== null && state.userTokenReducer.sessionVersion === sessionVersion;
}});

export const setAthleteArchived = createAsyncThunk<AthleteV1Response, ArchiveArgs, {rejectValue: ApiFailure; state: StateWithSession}>("athlete/archive", async ({id, archived, sessionVersion}, {getState, rejectWithValue}) => {
 const {token, sessionVersion: currentVersion} = getState().userTokenReducer;
 if (!token) return rejectWithValue({kind: "unauthorized"});
 if (sessionVersion !== currentVersion) return rejectWithValue({kind: "superseded"});
 try { const athlete = await service.setAthleteArchivedV1(id, archived); if (getState().userTokenReducer.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"}); return athlete; }
 catch (error) { return rejectWithValue(toApiFailure(error)); }
});

export const setAthleteCoach = createAsyncThunk<AthleteV1Response, CoachStatusArgs, {rejectValue: ApiFailure; state: StateWithSession}>("athlete/coach", async ({id, isCoach, sessionVersion}, {getState, rejectWithValue}) => {
	const {token, sessionVersion: currentVersion} = getState().userTokenReducer;
	if (!token) return rejectWithValue({kind: "unauthorized"});
	if (sessionVersion !== currentVersion) return rejectWithValue({kind: "superseded"});
	try { const athlete = await service.setAthleteCoachV1(id, isCoach); if (getState().userTokenReducer.sessionVersion !== sessionVersion) return rejectWithValue({kind: "superseded"}); return athlete; }
	catch (error) { return rejectWithValue(toApiFailure(error)); }
});

export const athleteSlice = createSlice({
	name: "athlete",
	initialState,
	reducers: {
		selectAthleteCatalogStatus: (state, action: PayloadAction<{isCoach: boolean; status: "active" | "archived"}>) => {
			state.selectedStatus[directoryFor(action.payload.isCoach)] = action.payload.status;
		},
		clearAthleteProfile: state => {
			state.profile = null;
			state.profileId = null;
			state.profileLoaded = false;
			state.profileLoading = false;
			state.profileErrorKind = undefined;
			state.profileSaveErrorKind = undefined;
		},
		clearAthleteState: state => {
			state.catalogs = createCatalogs();
			state.selectedStatus = {athletes: "active", coaches: "active"};
			state.saving = false;
			state.createErrorKind = undefined;
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
			state.profile = null;
			state.profileId = null;
			state.profileLoaded = false;
			state.profileLoading = false;
			state.profileSaving = false;
			state.profileErrorKind = undefined;
			state.profileSaveErrorKind = undefined;
			state.activeProfileRequestId = undefined;
			state.activeProfileRequestIdValue = undefined;
			state.activeProfileRequestSessionVersion = undefined;
			state.activeProfileSaveRequestId = undefined;
			state.activeProfileSaveId = undefined;
			state.activeProfileSaveSessionVersion = undefined;
		}
	},
	extraReducers: builder => {
		builder.addCase(fetchAthletes.pending, (state, action) => {
			const args = action.meta.arg ?? {status: "active" as const, limit: 50, offset: 0};
			const catalog = state.catalogs[directoryFor(args.isCoach)][args.status];
			catalog.query = args.q ?? "";
			catalog.offset = args.offset ?? 0;
			catalog.loading = true;
			catalog.errorKind = undefined;
			catalog.activeRequestId = action.meta.requestId;
		});
		builder.addCase(fetchAthletes.fulfilled, (state, action) => {
			const catalog = state.catalogs[directoryFor(action.payload.args.isCoach)][action.payload.args.status];
			if (catalog.activeRequestId !== action.meta.requestId) return;
			catalog.loading = false;
			catalog.loaded = true;
			catalog.athletes = action.payload.athletes;
			catalog.total = action.payload.total;
			catalog.query = action.payload.args.q ?? "";
			catalog.offset = action.payload.args.offset ?? 0;
			catalog.errorKind = undefined;
			catalog.activeRequestId = undefined;
		});
		builder.addCase(fetchAthletes.rejected, (state, action) => {
			const args = action.meta.arg ?? {status: "active" as const, isCoach: false};
			const catalog = state.catalogs[directoryFor(args.isCoach)][args.status];
			if (catalog.activeRequestId !== action.meta.requestId) return;
			catalog.loading = false;
			catalog.errorKind = action.payload?.kind === "superseded" ? undefined : action.payload?.kind ?? "service";
			catalog.activeRequestId = undefined;
		});
		builder.addCase(setAthleteArchived.fulfilled, (state, action) => {
			if (state.profileId === action.payload.id) state.profile = action.payload;
			invalidateCatalogs(state);
		});
		builder.addCase(setAthleteCoach.fulfilled, (state, action) => {
			if (state.profileId === action.payload.id) state.profile = action.payload;
			invalidateCatalogs(state);
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
			invalidateCatalogs(state);
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
		builder.addCase(fetchAthlete.pending, (state, action) => {
			const {id, sessionVersion} = action.meta.arg;
			if (state.profileId !== id) {
				state.profile = null;
				state.profileLoaded = false;
				state.profileSaveErrorKind = undefined;
				if (state.activeProfileSaveId !== id) {
					state.profileSaving = false;
					state.activeProfileSaveRequestId = undefined;
					state.activeProfileSaveId = undefined;
					state.activeProfileSaveSessionVersion = undefined;
				}
			}
			state.profileId = id;
			state.profileLoading = true;
			state.profileErrorKind = undefined;
			state.activeProfileRequestId = action.meta.requestId;
			state.activeProfileRequestIdValue = id;
			state.activeProfileRequestSessionVersion = sessionVersion;
		});
		builder.addCase(fetchAthlete.fulfilled, (state, action) => {
			if (state.activeProfileRequestId !== action.meta.requestId || state.activeProfileRequestIdValue !== action.meta.arg.id ||
				state.activeProfileRequestSessionVersion !== action.meta.arg.sessionVersion) return;
			state.profile = action.payload;
			state.profileId = action.payload.id;
			state.profileLoading = false;
			state.profileLoaded = true;
			state.profileErrorKind = undefined;
			state.activeProfileRequestId = undefined;
			state.activeProfileRequestIdValue = undefined;
			state.activeProfileRequestSessionVersion = undefined;
		});
		builder.addCase(fetchAthlete.rejected, (state, action) => {
			if (state.activeProfileRequestId !== action.meta.requestId || state.activeProfileRequestIdValue !== action.meta.arg.id ||
				state.activeProfileRequestSessionVersion !== action.meta.arg.sessionVersion) return;
			state.profileLoading = false;
			state.profileLoaded = false;
			state.profileErrorKind = action.payload?.kind === "superseded" ? undefined : action.payload?.kind ?? "service";
			state.activeProfileRequestId = undefined;
			state.activeProfileRequestIdValue = undefined;
			state.activeProfileRequestSessionVersion = undefined;
		});
		builder.addCase(updateAthlete.pending, (state, action) => {
			state.profileSaving = true;
			state.profileSaveErrorKind = undefined;
			state.activeProfileSaveRequestId = action.meta.requestId;
			state.activeProfileSaveId = action.meta.arg.id;
			state.activeProfileSaveSessionVersion = action.meta.arg.sessionVersion;
		});
		builder.addCase(updateAthlete.fulfilled, (state, action) => {
			if (state.activeProfileSaveRequestId !== action.meta.requestId || state.activeProfileSaveId !== action.meta.arg.id ||
				state.activeProfileSaveSessionVersion !== action.meta.arg.sessionVersion) return;
			if (state.profileId !== action.meta.arg.id) {
				state.profileSaving = false;
				state.activeProfileSaveRequestId = undefined;
				state.activeProfileSaveId = undefined;
				state.activeProfileSaveSessionVersion = undefined;
				return;
			}
			state.profile = action.payload;
			state.profileLoading = false;
			state.profileLoaded = true;
			state.profileSaving = false;
			state.profileSaveErrorKind = undefined;
			invalidateCatalogs(state);
			state.activeProfileSaveRequestId = undefined;
			state.activeProfileSaveId = undefined;
			state.activeProfileSaveSessionVersion = undefined;
		});
		builder.addCase(updateAthlete.rejected, (state, action) => {
			if (state.activeProfileSaveRequestId !== action.meta.requestId || state.activeProfileSaveId !== action.meta.arg.id ||
				state.activeProfileSaveSessionVersion !== action.meta.arg.sessionVersion) return;
			state.profileSaving = false;
			state.profileSaveErrorKind = action.payload?.kind === "superseded" ? undefined : action.payload?.kind ?? "service";
			state.activeProfileSaveRequestId = undefined;
			state.activeProfileSaveId = undefined;
			state.activeProfileSaveSessionVersion = undefined;
		});
		builder.addMatcher((action): action is PayloadAction =>
			["user/logout/pending", "user/logout/fulfilled", "user/token/pending", "user/token/fulfilled"].includes(action.type), state => {
			state.catalogs = createCatalogs();
			state.selectedStatus = {athletes: "active", coaches: "active"};
			state.saving = false;
			state.createErrorKind = undefined;
			state.activeCreateRequestId = undefined;
			state.activeCreateSessionVersion = undefined;
			state.profile = null;
			state.profileId = null;
			state.profileLoaded = false;
			state.profileLoading = false;
			state.profileSaving = false;
			state.profileErrorKind = undefined;
			state.profileSaveErrorKind = undefined;
			state.activeProfileRequestId = undefined;
			state.activeProfileRequestIdValue = undefined;
			state.activeProfileRequestSessionVersion = undefined;
			state.activeProfileSaveRequestId = undefined;
			state.activeProfileSaveId = undefined;
			state.activeProfileSaveSessionVersion = undefined;
		});
	}
});

export const athleteActions = athleteSlice.actions;
export default athleteSlice.reducer;

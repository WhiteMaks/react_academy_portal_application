import {createAction, createSlice, ThunkAction, UnknownAction} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import {ApiFailure, toApiFailure} from "../../../api/ApiError";
import PostUserV1Request from "../../../api/models/user/PostUserV1Request";
import PostUserV1Response from "../../../api/models/user/PostUserV1Response";

interface AdminBootstrapState {
	loading: boolean;
}

const initialState: AdminBootstrapState = {loading: false};
const service = AcademyPortalService.getInstance();
const bootstrapPending = createAction("user/adminBootstrap/pending");
const bootstrapFulfilled = createAction("user/adminBootstrap/fulfilled");
const bootstrapRejected = createAction<ApiFailure>("user/adminBootstrap/rejected");

export const createInitialAdmin = (request: PostUserV1Request): ThunkAction<
	{unwrap: () => Promise<PostUserV1Response>},
	{adminBootstrapReducer: AdminBootstrapState},
	unknown,
	UnknownAction
> => (dispatch, getState) => {
	if (getState().adminBootstrapReducer.loading) {
		return {unwrap: () => Promise.reject({kind: "superseded"} satisfies ApiFailure)};
	}
	dispatch(bootstrapPending());
	const promise = service.postUserV1(request).then(response => {
		dispatch(bootstrapFulfilled());
		return response;
	}).catch(error => {
		const failure = toApiFailure(error);
		dispatch(bootstrapRejected(failure));
		throw failure;
	});
	return {unwrap: () => promise};
};

const adminBootstrapSlice = createSlice({
	name: "user/adminBootstrap",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(bootstrapPending, state => {
			state.loading = true;
		});
		builder.addCase(bootstrapFulfilled, state => {
			state.loading = false;
		});
		builder.addCase(bootstrapRejected, state => {
			state.loading = false;
		});
	}
});

export default adminBootstrapSlice.reducer;

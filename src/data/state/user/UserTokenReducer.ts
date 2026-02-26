import AcademyPortalService from "../../../api/AcademyPortalService";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import PostUserTokenV1Response from "../../../api/models/user/PostUserTokenV1Response";
import PostUserTokenV1Request from "../../../api/models/user/PostUserTokenV1Request";

interface UserTokenState {
	token: string | null;
	error?: string;
	loading: boolean
}

const initialState: UserTokenState = {
	token: localStorage.getItem("token"),
	loading: false
}

const service = AcademyPortalService.getInstance();

export const fetchUserToken = createAsyncThunk<PostUserTokenV1Response, PostUserTokenV1Request>("user/token", (request) => {
	return service.postUserTokenV1(request);
});

export const userTokenSlice = createSlice({
	name: "user/token",
	initialState: initialState,
	reducers: {
		removeUserToken: (state, action: PayloadAction<void>) => {
			state.token = null;
			localStorage.removeItem("token");
		},
	},
	extraReducers: builder => {
		builder.addCase(fetchUserToken.pending, state => {
			state.loading = true;
		});
		builder.addCase(fetchUserToken.fulfilled, (state, action) => {
			const token = action.payload.token;

			state.loading = false;
			state.token = token;
			localStorage.setItem("token", token);
		});
		builder.addCase(fetchUserToken.rejected, (state, action) => {
			state.loading = false;
			state.error = "Ошибка получения токена";
		});
	}
});

export const userTokenActions = userTokenSlice.actions;

export default userTokenSlice.reducer;
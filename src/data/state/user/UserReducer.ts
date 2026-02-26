import AcademyPortalService from "../../../api/AcademyPortalService";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import GetUserV1Response from "../../../api/models/user/GetUserV1Response";

interface UserState {
	user?: User;
	error?: string;
	loading: boolean
}

interface User {
	id: number;
	username: string;
	role: string;
}

const initialState: UserState = {
	loading: true
}

const service = AcademyPortalService.getInstance();

export const fetchUser = createAsyncThunk<GetUserV1Response>("user", () => {
	return service.getUserV1();
});

export const userSlice = createSlice({
	name: "user",
	initialState: initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(fetchUser.pending, state => {
			state.loading = true;
		});
		builder.addCase(fetchUser.fulfilled, (state, action) => {
			state.loading = false;
			state.user = action.payload;
		});
		builder.addCase(fetchUser.rejected, (state, action) => {
			state.loading = false;
			state.error = "Ошибка получения данных пользователя";
		});
	}
});

export const userActions = userSlice.actions;

export default userSlice.reducer;
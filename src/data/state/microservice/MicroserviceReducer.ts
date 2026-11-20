import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import AcademyPortalService from "../../../api/AcademyPortalService";
import GetMicroserviceV1Response from "../../../api/models/microservice/GetMicroserviceV1Response";

interface MicroserviceState {
	service?: Service;
	error?: string;
	loading: boolean
}

interface Service {
	readyToUse: boolean;
}

const initialState: MicroserviceState = {
	loading: true
}

const service = AcademyPortalService.getInstance();

export const fetchMicroservice = createAsyncThunk<GetMicroserviceV1Response>("microservice", () => {
	return service.getMicroserviceV1();
});

export const microserviceSlice = createSlice({
	name: "microservice",
	initialState: initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(fetchMicroservice.pending, state => {
			state.loading = true;
			state.error = undefined;
		});
		builder.addCase(fetchMicroservice.fulfilled, (state, action) => {
			state.loading = false;
			state.service = action.payload;
			state.error = undefined;
		});
		builder.addCase(fetchMicroservice.rejected, (state, action) => {
			state.loading = false;
			state.error = "Ошибка получения данных сервиса";
		});
	}
});

export const microserviceActions = microserviceSlice.actions;

export default microserviceSlice.reducer;

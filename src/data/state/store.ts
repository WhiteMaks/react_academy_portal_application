import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import microserviceReducer from "./microservice/MicroserviceReducer";
import userTokenReducer from "./user/UserTokenReducer";
import userReducer from "./user/UserReducer";
import adminBootstrapReducer from "./user/AdminBootstrapReducer";

const globalReducer = combineReducers({
	microserviceReducer: microserviceReducer,
	userTokenReducer: userTokenReducer,
	userReducer: userReducer,
	adminBootstrapReducer: adminBootstrapReducer
});

export const initGlobalStore = () => {
	return configureStore({
		reducer: globalReducer
	});
}

export type GlobalState = ReturnType<typeof globalReducer>;
export type GlobalStore = ReturnType<typeof initGlobalStore>;
export type GlobalDispatch = GlobalStore['dispatch'];

export const useGlobalDispatch = () => useDispatch<GlobalDispatch>();
export const useGlobalSelector: TypedUseSelectorHook<GlobalState> = useSelector;
import React, {FC, useEffect, useRef} from "react";
import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import {fetchMicroservice} from "../data/state/microservice/MicroserviceReducer";
import {fetchUser} from "../data/state/user/UserReducer";
import {logoutUser} from "../data/state/user/UserTokenReducer";
import {useGlobalDispatch, useGlobalSelector} from "../data/state/store";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import LogoutPage from "./page/LogoutPage";
import SessionCheckPage from "./page/SessionCheckPage";
import AdminBootstrapPage from "./page/AdminBootstrapPage";
import SectionPlaceholder from "./page/SectionPlaceholder";
import AthletesPage from "./page/AthletesPage";
import AthleteDetailPage from "./page/AthleteDetailPage";
import CoachesPage from "./page/CoachesPage";
import CoachDetailPage from "./page/CoachDetailPage";
import BranchesPage from "./page/BranchesPage";
import BranchDetailPage from "./page/BranchDetailPage";
import HallDetailPage from "./page/HallDetailPage";

const HallDetailUrlCleanup: FC = () => {
	const {branchId, hallId} = useParams<{branchId: string; hallId: string}>();
	if (!branchId || !hallId) {
		return <Navigate to="/gyms" replace/>;
	}
	return <Navigate to={`/gyms/${branchId}/halls/${hallId}`} replace/>;
};

const Application: FC = () => {
	const dispatch = useGlobalDispatch();
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const microserviceState = useGlobalSelector(state => state.microserviceReducer);
	const location = useLocation();
	const onLoginRoute = location.pathname === "/login";
	const initialToken = useRef(tokenState.token);
	const restoreStarted = useRef(false);
	const previousToken = useRef(tokenState.token);
	const userRestoreStarted = useRef(false);

	const readyToUse = microserviceState.service?.readyToUse;
	const bootstrapRequired = readyToUse === false;

	useEffect(() => {
		if (!restoreStarted.current) {
			restoreStarted.current = true;
			dispatch(fetchMicroservice());
		}
	}, [dispatch]);

	useEffect(() => {
		if (previousToken.current !== null && tokenState.token === null) {
			dispatch(fetchMicroservice());
			initialToken.current = null;
			userRestoreStarted.current = false;
		}
		previousToken.current = tokenState.token;
	}, [dispatch, tokenState.token]);

	useEffect(() => {
		if (bootstrapRequired) {
			userRestoreStarted.current = false;
			if (tokenState.token !== null) {
				dispatch(logoutUser());
			}
			return;
		}
		if (readyToUse === true && tokenState.token !== null && !userRestoreStarted.current) {
			userRestoreStarted.current = true;
			dispatch(fetchUser());
		}
	}, [dispatch, bootstrapRequired, readyToUse, tokenState.token]);

	const hasAdminIdentity = tokenState.token !== null && userState.user?.role === "admin";
	const isAdmin = hasAdminIdentity;
	const isRestoring = tokenState.token !== null && !userState.user &&
		(userState.loading || (!userState.loading && !userState.errorKind));

	const coldSessionRestore = !bootstrapRequired &&
		isRestoring && initialToken.current !== null && !onLoginRoute;

	if (microserviceState.loading && microserviceState.service === undefined) {
		return (
			<SessionCheckPage
				layout="connecting"
				loading
				onRetry={() => dispatch(fetchMicroservice())}
			/>
		);
	}

	if (microserviceState.error && microserviceState.service === undefined) {
		return (
			<SessionCheckPage
				layout="error"
				errorCode="service"
				retryLabel="Повторить"
				onRetry={() => dispatch(fetchMicroservice())}
			/>
		);
	}

	if (bootstrapRequired) {
		return <AdminBootstrapPage/>;
	}

	if (coldSessionRestore) {
		return (
			<SessionCheckPage
				layout="restoring"
				loading
				onRetry={() => dispatch(fetchUser())}
				onLogout={() => dispatch(logoutUser())}
			/>
		);
	}

	if (!onLoginRoute && tokenState.token !== null && userState.errorKind === "service") {
		return (
			<SessionCheckPage
				layout="error"
				errorCode="service"
				onRetry={() => dispatch(fetchUser())}
				onLogout={() => dispatch(logoutUser())}
			/>
		);
	}

	return (
		<Routes>
			<Route path="/login" element={<LoginPage/>}/>
			<Route path="/logout" element={isAdmin ? <LogoutPage/> : <Navigate to="/login" replace/>}/>
			<Route path="/" element={isAdmin ? <HomePage/> : <Navigate to="/login" replace/>}>
				<Route index element={<SectionPlaceholder section="home"/>}/>
				<Route path="calendar" element={<Navigate to="/schedule" replace/>}/>
				<Route path="schedule/*" element={<SectionPlaceholder section="schedule"/>}/>
				<Route path="payments/*" element={<SectionPlaceholder section="payments"/>}/>
				<Route path="groups/*" element={<SectionPlaceholder section="groups"/>}/>
				<Route path="coaches" element={<CoachesPage/>}/>
				<Route path="coaches/:id" element={<CoachDetailPage/>}/>
				<Route path="gyms" element={<BranchesPage/>}/>
				<Route path="gyms/:branchId" element={<BranchDetailPage/>}/>
				<Route path="gyms/:branchId/halls/:hallId" element={<HallDetailPage/>}/>
				<Route
					path="gyms/:branchId/halls/:hallId/*"
					element={<HallDetailUrlCleanup/>}
				/>
				<Route path="attendance/*" element={<SectionPlaceholder section="attendance"/>}/>
				<Route path="athletes" element={<AthletesPage/>}/>
				<Route path="athletes/:id" element={<AthleteDetailPage/>}/>
				<Route path="*" element={<SectionPlaceholder section="notFound"/>}/>
			</Route>
		</Routes>
	);
};

export default Application;
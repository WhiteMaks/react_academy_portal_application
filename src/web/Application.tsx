import React, {FC, useEffect, useRef} from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import Block from "./component/common/block/Block";
import Logout from "./component/navigation_panel/logout/Logout";
import {fetchMicroservice} from "../data/state/microservice/MicroserviceReducer";
import {fetchUser} from "../data/state/user/UserReducer";
import {logoutUser} from "../data/state/user/UserTokenReducer";
import {useGlobalDispatch, useGlobalSelector} from "../data/state/store";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import SessionCheckPage from "./page/SessionCheckPage";
import AdminBootstrapPage from "./page/AdminBootstrapPage";
import SectionPlaceholder from "./page/SectionPlaceholder";
import AthletesPage from "./page/AthletesPage";
import AthleteCreatePage from "./page/AthleteCreatePage";
import AthleteProfilePage from "./page/AthleteProfilePage";

const Application: FC = () => {
	const dispatch = useGlobalDispatch();
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const microserviceState = useGlobalSelector(state => state.microserviceReducer);
	const initialToken = useRef(tokenState.token);
	const restoreStarted = useRef(false);
	const previousToken = useRef(tokenState.token);

	useEffect(() => {
		if (!restoreStarted.current) {
			restoreStarted.current = true;
			dispatch(fetchMicroservice());
			if (initialToken.current) dispatch(fetchUser());
		}
	}, [dispatch]);

	useEffect(() => {
		if (previousToken.current !== null && tokenState.token === null) {
			dispatch(fetchMicroservice());
		}
		previousToken.current = tokenState.token;
	}, [dispatch, tokenState.token]);

	const hasAdminIdentity = tokenState.token !== null && userState.user?.role === "admin";
	const isAdmin = hasAdminIdentity;
	const isRestoring = tokenState.token !== null && !userState.user &&
		(userState.loading || (!userState.loading && !userState.errorKind));

	if (isRestoring) {
		return <SessionCheckPage loading onRetry={() => dispatch(fetchUser())} onLogout={() => dispatch(logoutUser())}/>;
	}

	if (tokenState.token !== null && userState.errorKind === "service") {
		return <SessionCheckPage onRetry={() => dispatch(fetchUser())} onLogout={() => dispatch(logoutUser())}/>;
	}

	if (!hasAdminIdentity && tokenState.token === null) {
		if (microserviceState.loading) {
			return <SessionCheckPage
				loading
				title="Проверяем состояние сервиса…"
				message="Проверяем, завершена ли первоначальная настройка."
				onRetry={() => dispatch(fetchMicroservice())}
			/>;
		}
		if (microserviceState.error || !microserviceState.service) {
			return <SessionCheckPage
				title="Не удалось проверить состояние сервиса"
				message="Не получилось определить, завершена ли первичная настройка. Повторите проверку."
				retryLabel="Повторить проверку"
				onRetry={() => dispatch(fetchMicroservice())}
			/>;
		}
		if (microserviceState.service.readyToUse === false) {
			return <AdminBootstrapPage/>;
		}
	}

	const renderContentRoutes = () => (
		<Route path="/" element={isAdmin ? <HomePage/> : <Navigate to="/login" replace/>}>
			<Route index element={<SectionPlaceholder title="Сегодня" today/>}/>
			<Route path="calendar" element={<SectionPlaceholder title="Тренировки"/>}/>
			<Route path="payments" element={<SectionPlaceholder title="Оплата"/>}/>
			<Route path="groups" element={<SectionPlaceholder title="Группы"/>}/>
			<Route path="couches" element={<SectionPlaceholder title="Тренеры"/>}/>
			<Route path="athletes" element={<AthletesPage/>}/>
			<Route path="athletes/new" element={<AthleteCreatePage/>}/>
			<Route path="athletes/:id/edit" element={<AthleteProfilePage editing/>}/>
			<Route path="athletes/:id" element={<AthleteProfilePage/>}/>
			<Route path="*" element={<SectionPlaceholder notFound/>}/>
		</Route>
	);

	return (
		<Block className="application">
			<Routes>
				<Route path="/login" element={isAdmin ? <Navigate to="/" replace/> : <LoginPage/>}/>
				<Route path="/logout" element={isAdmin ? <Logout/> : <Navigate to="/login" replace/>}/>
				{renderContentRoutes()}
			</Routes>
		</Block>
	);
};

export default Application;

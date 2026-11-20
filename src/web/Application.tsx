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

const Application: FC = () => {
	const dispatch = useGlobalDispatch();
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const microserviceState = useGlobalSelector(state => state.microserviceReducer);
	const initialToken = useRef(tokenState.token);
	const restoreStarted = useRef(false);

	useEffect(() => {
		if (!restoreStarted.current) {
			restoreStarted.current = true;
			dispatch(fetchMicroservice());
			if (initialToken.current) dispatch(fetchUser());
		}
	}, [dispatch]);

	const isWorkspaceReady = microserviceState.service?.readyToUse === true;
	const hasAdminIdentity = tokenState.token !== null && userState.user?.role === "admin";
	const isAdmin = isWorkspaceReady && hasAdminIdentity;
	const isRestoring = tokenState.token !== null && !userState.user &&
		(userState.loading || (!userState.loading && !userState.errorKind));

	if (microserviceState.loading) {
		return <div role="status" aria-live="polite">Проверяем готовность сервиса…</div>;
	}

	if (isRestoring) {
		return <SessionCheckPage loading onRetry={() => dispatch(fetchUser())} onLogout={() => dispatch(logoutUser())}/>;
	}

	if (tokenState.token !== null && userState.errorKind === "service") {
		return <SessionCheckPage onRetry={() => dispatch(fetchUser())} onLogout={() => dispatch(logoutUser())}/>;
	}

	if (hasAdminIdentity && microserviceState.error) {
		return <SessionCheckPage
			title="Не удалось проверить готовность сервиса"
			message="Сервис временно недоступен. Защищённые данные пока не отображаются."
			retryLabel="Повторить проверку сервиса"
			onRetry={() => dispatch(fetchMicroservice())}
			onLogout={() => dispatch(logoutUser())}
		/>;
	}

	if (hasAdminIdentity && !isWorkspaceReady) {
		return <SessionCheckPage
			title="Рабочее место пока недоступно"
			message="Сервис ещё не готов. Административные данные не отображаются."
			retryLabel="Повторить проверку сервиса"
			onRetry={() => dispatch(fetchMicroservice())}
			onLogout={() => dispatch(logoutUser())}
		/>;
	}

	const renderContentRoutes = () => (
		<Route path="/" element={isAdmin ? <HomePage/> : <Navigate to="/login" replace/>}>
			<Route index element={"Dashboard"}/>
			<Route path="calendar" element={"Календарь"}/>
			<Route path="groups" element={"Группы"}/>
			<Route path="couches" element={"Тренеры"}/>
			<Route path="athletes" element={"Спортсмены"}/>
			<Route path="gyms" element={"Спортзалы"}/>
			<Route path="events" element={"События"}/>
			<Route path="*" element={<Navigate to="/" replace/>}/>
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

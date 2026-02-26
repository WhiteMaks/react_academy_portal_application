import React, {FC, useEffect} from 'react';
import {useGlobalDispatch, useGlobalSelector} from "../data/state/store";
import {fetchMicroservice} from "../data/state/microservice/MicroserviceReducer";
import Block from "./component/common/block/Block";
import HomePage from "./page/HomePage";
import {Navigate, Route, Routes} from "react-router-dom";
import Logout from "./component/navigation_panel/logout/Logout";

const Application: FC = () => {
	const globalDispatch = useGlobalDispatch();
	const microserviceState = useGlobalSelector(state => state.microserviceReducer);

	useEffect(() => {
		globalDispatch(fetchMicroservice());
	}, [globalDispatch]);

	const renderContentRouters = () => {
		return (
			<Route path="*" element={<HomePage/>}>
				<Route path="*" element={"Dashboard"} />
				<Route path="calendar" element={"Календарь"} />
				<Route path="groups" element={"Группы"} />
				<Route path="couches" element={"Тренеры"} />
				<Route path="athletes" element={"Спортсмены"} />
				<Route path="gyms" element={"Спортзалы"} />
				<Route path="events" element={"События"} />
				<Route path="logout" element={<Logout/>} />
			</Route>
		);
	}

	if (microserviceState.loading) {
		return <Block>Loading service</Block>;
	}

	return (
		<Block className="application">
			<Routes>
				{microserviceState.service!.readyToUse ?
					renderContentRouters() : <Route path="*" element={<Navigate to="/login" replace/>}/>}
				<Route path="/login" element={"Login"}/>
			</Routes>
		</Block>
	);
}

export default Application;

import React, {FC, useEffect} from "react";
import NavigationPanel from "../component/navigation_panel/NavigationPanel";
import ContentPanel from "../component/content_panel/ContentPanel";
import Block from "../component/common/block/Block";
import {Navigate, Outlet} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import {fetchUser} from "../../data/state/user/UserReducer";

const HomePage : FC = () => {
	const globalDispatch = useGlobalDispatch();
	const userState = useGlobalSelector(state => state.userReducer);

	useEffect(() => {
		globalDispatch(fetchUser());
	}, [globalDispatch]);

	if (userState.loading) {
		return (
			<Block>Loading user</Block>
		);
	}

	if (userState.error) {
		return (
			<Navigate to="/login" replace />
		);
	}

	return (
		<Block className={"home_page"}>
			<NavigationPanel/>
			<ContentPanel>
				<Outlet/>
			</ContentPanel>
		</Block>
	);

}

export default HomePage;
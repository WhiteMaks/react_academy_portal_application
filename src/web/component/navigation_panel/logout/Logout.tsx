import React, {FC, useEffect} from "react";
import {useGlobalDispatch} from "../../../../data/state/store";
import {userTokenActions} from "../../../../data/state/user/UserTokenReducer";
import {Navigate} from "react-router-dom";

const Logout: FC = () => {
	const globalDispatch = useGlobalDispatch();

	useEffect(() => {
		globalDispatch(userTokenActions.removeUserToken());
	}, [globalDispatch]);

	return <Navigate to="/login" replace/>;
}

export default Logout;
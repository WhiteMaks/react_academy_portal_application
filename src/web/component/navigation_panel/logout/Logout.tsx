import React, {FC, useEffect} from "react";
import {Navigate} from "react-router-dom";
import {logoutUser} from "../../../../data/state/user/UserTokenReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../../../data/state/store";

const Logout: FC = () => {
	const dispatch = useGlobalDispatch();
	const token = useGlobalSelector(state => state.userTokenReducer.token);

	useEffect(() => {
		void dispatch(logoutUser());
	}, [dispatch]);

	if (token === null) {
		return <Navigate to="/login" replace/>;
	}

	return <div role="status" aria-live="polite">Выполняем выход…</div>;
};

export default Logout;

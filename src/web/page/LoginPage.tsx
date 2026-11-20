import React, {FC, FormEvent, useState} from "react";
import {Navigate, useNavigate} from "react-router-dom";
import {ApiErrorKind} from "../../api/ApiError";
import {fetchUser, userActions} from "../../data/state/user/UserReducer";
import {fetchUserToken, logoutUser} from "../../data/state/user/UserTokenReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import svg_logo from "../../img/svg/logo.svg";
import style from "./LoginPage.module.css";

const errorMessages: Record<ApiErrorKind, string> = {
	credentials: "Неверное имя пользователя или пароль.",
	unauthorized: "Сессия завершилась. Войдите снова.",
	forbidden: "Доступ в рабочее место разрешён только администратору.",
	service: "Сервис временно недоступен. Попробуйте ещё раз позже.",
	request: "Не удалось обработать запрос. Проверьте введённые данные.",
	superseded: "Сессия завершена. Войдите снова."
};

const LoginPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [requestError, setRequestError] = useState<ApiErrorKind | undefined>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [checkingAccess, setCheckingAccess] = useState(false);

	if (tokenState.token !== null && userState.user?.role === "admin") {
		return <Navigate to="/" replace/>;
	}

	const errorKind = requestError ?? userState.errorKind ?? tokenState.errorKind;
	const isBusy = isSubmitting || tokenState.loading || userState.loading;
	const hasUnverifiedToken = tokenState.token !== null && userState.errorKind === "service";

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isBusy) return;

		setIsSubmitting(true);
		setRequestError(undefined);
		dispatch(userActions.clearUser());
		try {
			await dispatch(fetchUserToken({username, password})).unwrap();
			setCheckingAccess(true);
			const user = await dispatch(fetchUser()).unwrap();
			if (user.role === "admin") {
				navigate("/", {replace: true});
			}
		} catch (error) {
			const failure = error as {kind?: ApiErrorKind};
			const kind = failure.kind ?? "service";
			if (kind !== "service") setPassword("");
			setRequestError(kind);
		} finally {
			setIsSubmitting(false);
			setCheckingAccess(false);
		}
	};

	const retrySessionCheck = async () => {
		setRequestError(undefined);
		try {
			await dispatch(fetchUser()).unwrap();
			navigate("/", {replace: true});
		} catch (error) {
			const failure = error as {kind?: ApiErrorKind};
			setRequestError(failure.kind ?? "service");
		}
	};

	const handleLogout = () => {
		void dispatch(logoutUser());
		setRequestError(undefined);
	};

	return (
		<main className={style.page}>
			<section className={style.card} aria-labelledby="login-title">
				<img className={style.logo} src={svg_logo} alt="Академия единоборств"/>
				<p className={style.brandCaption}>ПАНЕЛЬ АДМИНИСТРАТОРА</p>
				<h1 id="login-title">Вход администратора</h1>
				<p className={style.description}>Войдите, чтобы управлять списком спортсменов.</p>

				{errorKind && (
					<div id="login-error" className={style.alert} role="alert" aria-live="assertive">
						{errorMessages[errorKind]}
					</div>
				)}

				{hasUnverifiedToken && (
					<div className={style.sessionActions}>
						<button className={style.secondaryButton} type="button" onClick={retrySessionCheck} disabled={isBusy}>
							Повторить проверку сессии
						</button>
						<button className={style.textButton} type="button" onClick={handleLogout}>
							Выйти
						</button>
					</div>
				)}

				<form className={style.form} onSubmit={handleSubmit}>
					<label htmlFor="username">Имя пользователя <span aria-hidden="true">*</span></label>
					<input
						id="username"
						name="username"
						autoComplete="username"
						required
						value={username}
						onChange={event => {
							setUsername(event.target.value);
							setRequestError(undefined);
						}}
						aria-invalid={errorKind === "credentials"}
						aria-describedby={errorKind ? "login-error" : undefined}
					/>
					<label htmlFor="password">Пароль <span aria-hidden="true">*</span></label>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={event => {
							setPassword(event.target.value);
							setRequestError(undefined);
						}}
						aria-invalid={errorKind === "credentials"}
						aria-describedby={errorKind ? "login-error" : undefined}
					/>
					<button className={style.primaryButton} type="submit" disabled={isBusy || hasUnverifiedToken}>
						{checkingAccess ? "Проверяем доступ…" : isBusy ? "Входим…" : "Войти"}
					</button>
				</form>
				<p className={style.accessNote}>Доступ только для администратора.</p>
			</section>
		</main>
	);
};

export default LoginPage;

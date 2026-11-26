import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Location} from "react-router";
import {ApiErrorKind, toApiFailure} from "../../api/ApiError";
import {fetchUser} from "../../data/state/user/UserReducer";
import {fetchUserToken, logoutUser} from "../../data/state/user/UserTokenReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import TextField from "../component/common/text_field/TextField";
import AuthFormLayout from "../component/common/auth_form/AuthFormLayout";
import FormStack from "../component/common/form_stack/FormStack";
import FormMessage from "../component/common/form_message/FormMessage";
import style from "./LoginPage.module.css";

const errorMessages: Record<ApiErrorKind, string> = {
	credentials: "Неверное имя пользователя или пароль",
	unauthorized: "Сессия завершилась. Войдите снова.",
	forbidden: "Доступ только для администратора клуба.",
	notFound: "Запрошенные данные не найдены.",
	conflict: "Данные изменились. Обновите карточку и повторите попытку.",
	service: "Сервис временно недоступен. Попробуйте ещё раз.",
	request: "Не удалось обработать запрос. Проверьте введённые данные.",
	superseded: "Сессия завершена. Войдите снова."
};

interface LoginNavigationState {
	username?: string;
	notice?: string;
}

const readNavigationState = (location: Location): LoginNavigationState => {
	if (typeof location.state !== "object" || location.state === null) return {};
	const state = location.state as Record<string, unknown>;
	return {
		username: typeof state.username === "string" ? state.username : undefined,
		notice: typeof state.notice === "string" ? state.notice : undefined
	};
};

const LoginPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const navigationState = readNavigationState(location);
	const storedToken = useGlobalSelector(state => state.userTokenReducer.token);
	const profile = useGlobalSelector(state => state.userReducer.user);
	const profileError = useGlobalSelector(state => state.userReducer.errorKind);
	const profileLoading = useGlobalSelector(state => state.userReducer.loading);
	const [username, setUsername] = useState(navigationState.username ?? "");
	const [password, setPassword] = useState("");
	const [requestError, setRequestError] = useState<ApiErrorKind | undefined>();
	const [phase, setPhase] = useState<"idle" | "signingIn" | "checkingAccess">("idle");
	const submitLock = useRef(false);

	const hasUnverifiedToken = storedToken !== null && profileError === "service";
	const errorKind = requestError ?? (hasUnverifiedToken ? profileError : undefined);
	const isEstablishedAdmin = storedToken !== null && profile?.role === "admin";
	const resumingSession = phase === "idle" && storedToken !== null && !profile && profileLoading;
	const isBusy = phase !== "idle" || resumingSession || (hasUnverifiedToken && profileLoading);
	const invalidCredentials = errorKind === "credentials";

	useEffect(() => {
		if (phase !== "idle" || !storedToken || profile || profileLoading) return;
		void dispatch(fetchUser());
	}, [dispatch, phase, profile, profileLoading, storedToken]);

	useEffect(() => {
		if (isEstablishedAdmin && phase === "idle") {
			navigate("/", {replace: true});
		}
	}, [isEstablishedAdmin, navigate, phase]);

	const finishLoginAttempt = () => {
		submitLock.current = false;
		setPhase("idle");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitLock.current || isBusy || hasUnverifiedToken) return;

		submitLock.current = true;
		setPhase("signingIn");

		let navigatedAway = false;
		try {
			await dispatch(fetchUserToken({username, password})).unwrap();
			setPhase("checkingAccess");
			const user = await dispatch(fetchUser()).unwrap();
			if (user.role === "admin") {
				navigate("/", {replace: true});
				navigatedAway = true;
			}
		} catch (error) {
			const {kind} = toApiFailure(error);
			if (kind === "superseded") return;
			if (kind !== "service") setPassword("");
			setRequestError(kind);
		} finally {
			if (!navigatedAway) {
				finishLoginAttempt();
			}
		}
	};

	const retrySessionCheck = async () => {
		if (profileLoading) return;
		setRequestError(undefined);
		try {
			await dispatch(fetchUser()).unwrap();
			navigate("/", {replace: true});
		} catch (error) {
			const {kind} = toApiFailure(error);
			if (kind !== "superseded") setRequestError(kind);
		}
	};

	const handleLogout = () => {
		void dispatch(logoutUser());
		setRequestError(undefined);
	};

	const submitLabel =
		resumingSession ? "Проверяем сессию…" :
			phase === "checkingAccess" ? "Проверяем доступ…" :
				phase === "signingIn" ? "Входим…" : "Войти";

	return (
		<AuthFormLayout
			ariaLabelledBy="login-title"
			eyebrow="Панель администратора"
			title="Вход"
			lead="Войдите, чтобы управлять клубом: спортсмены, группы, расписание и оплаты."
			footnote="Доступ только для администратора клуба."
		>
			{navigationState.notice && (
				<FormMessage variant="notice">{navigationState.notice}</FormMessage>
			)}

			<div className={style.errorSlot} aria-live="assertive">
				{errorKind ? (
					<FormMessage id="login-error">{errorMessages[errorKind]}</FormMessage>
				) : null}
			</div>

			{hasUnverifiedToken && (
				<div className={style.sessionActions}>
					<Button variant="gold" type="button" onClick={retrySessionCheck} disabled={profileLoading} fullWidth>
						Повторить
					</Button>
					<Button variant="text" type="button" onClick={handleLogout}>
						Выйти
					</Button>
				</div>
			)}

			<FormStack onSubmit={handleSubmit} noValidate>
				<TextField
					id="username"
					name="username"
					label="Имя пользователя"
					placeholder="5–64 символа, латиница и цифры"
					autoComplete="username"
					required
					value={username}
					onChange={event => {
						setUsername(event.target.value);
						setRequestError(undefined);
					}}
					invalid={invalidCredentials}
					describedBy={errorKind ? "login-error" : undefined}
				/>
				<TextField
					id="password"
					name="password"
					label="Пароль"
					placeholder="Не менее 8 символов"
					type="password"
					autoComplete="current-password"
					required
					value={password}
					onChange={event => {
						setPassword(event.target.value);
						setRequestError(undefined);
					}}
					invalid={invalidCredentials}
					describedBy={errorKind ? "login-error" : undefined}
				/>
				<Button variant="gold" type="submit" disabled={isBusy || hasUnverifiedToken} fullWidth>
					{submitLabel}
				</Button>
			</FormStack>
		</AuthFormLayout>
	);
};

export default LoginPage;
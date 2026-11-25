import React, {FC, FormEvent, useState} from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import {Location} from "react-router";
import {ApiErrorKind, toApiFailure} from "../../api/ApiError";
import {fetchUser, userActions} from "../../data/state/user/UserReducer";
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
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const [username, setUsername] = useState(navigationState.username ?? "");
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
			const {kind} = toApiFailure(error);
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
			setRequestError(toApiFailure(error).kind);
		}
	};

	const handleLogout = () => {
		void dispatch(logoutUser());
		setRequestError(undefined);
	};

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

			{errorKind && (
				<FormMessage id="login-error">{errorMessages[errorKind]}</FormMessage>
			)}

			{hasUnverifiedToken && (
				<div className={style.sessionActions}>
					<Button variant="gold" type="button" onClick={retrySessionCheck} disabled={isBusy} fullWidth>
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
					invalid={errorKind === "credentials"}
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
					invalid={errorKind === "credentials"}
					describedBy={errorKind ? "login-error" : undefined}
				/>
				<Button variant="gold" type="submit" disabled={isBusy || hasUnverifiedToken} fullWidth>
					{checkingAccess ? "Проверяем доступ…" : isBusy ? "Входим…" : "Войти"}
				</Button>
			</FormStack>
		</AuthFormLayout>
	);
};

export default LoginPage;
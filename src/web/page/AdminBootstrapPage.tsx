import React, {FC, FormEvent, useState} from "react";
import {useNavigate} from "react-router-dom";
import {ApiFailure} from "../../api/ApiError";
import {createInitialAdmin} from "../../data/state/user/AdminBootstrapReducer";
import {fetchUser} from "../../data/state/user/UserReducer";
import {fetchUserToken} from "../../data/state/user/UserTokenReducer";
import {microserviceActions} from "../../data/state/microservice/MicroserviceReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import TextField from "../component/common/text_field/TextField";
import AuthFormLayout from "../component/common/auth_form/AuthFormLayout";
import FormStack from "../component/common/form_stack/FormStack";
import FormMessage from "../component/common/form_message/FormMessage";
import style from "./AdminBootstrapPage.module.css";

interface FieldErrors {
	username?: string;
	password?: string;
}

const isValidUsername = (value: string): boolean => /^[A-Za-z0-9]{5,64}$/.test(value);
const isValidPassword = (value: string): boolean => value.length >= 8 && value.length <= 64;

const failureFrom = (error: unknown): ApiFailure => {
	if (typeof error === "object" && error !== null && "kind" in error &&
		typeof error.kind === "string") {
		const failure = error as ApiFailure;
		return failure;
	}
	return {kind: "service"};
};

const AdminBootstrapPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const bootstrapState = useGlobalSelector(state => state.adminBootstrapReducer);
	const tokenState = useGlobalSelector(state => state.userTokenReducer);
	const userState = useGlobalSelector(state => state.userReducer);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [requestMessage, setRequestMessage] = useState<string>();
	const [checkingAccess, setCheckingAccess] = useState(false);
	const busy = bootstrapState.loading || tokenState.loading || userState.loading || checkingAccess;

	const goToLogin = (notice: string, usernameValue = username, markAsReady = false) => {
		setPassword("");
		navigate("/login", {replace: true, state: {username: usernameValue, notice}});
		if (markAsReady) dispatch(microserviceActions.markReady());
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (busy) return;

		const nextErrors: FieldErrors = {};
		if (!isValidUsername(username)) {
			nextErrors.username = "Введите от 5 до 64 символов: только латинские буквы и цифры.";
		}
		if (!isValidPassword(password)) {
			nextErrors.password = "Пароль должен содержать от 8 до 64 символов.";
		}
		setFieldErrors(nextErrors);
		setRequestMessage(undefined);
		if (Object.keys(nextErrors).length > 0) return;

		const credentials = {username, password};
		try {
			await dispatch(createInitialAdmin(credentials)).unwrap();
			setPassword("");
			setCheckingAccess(true);

			try {
				await dispatch(fetchUserToken(credentials)).unwrap();
			} catch {
				goToLogin("Администратор создан, но выполнить вход не удалось. Войдите с указанными данными.", username, true);
				return;
			}
			dispatch(microserviceActions.markReady());

			try {
				const user = await dispatch(fetchUser()).unwrap();
				if (user.role === "admin") {
					navigate("/", {replace: true});
					return;
				}
				goToLogin("Администратор создан. Войдите, чтобы продолжить.", username, true);
			} catch (error) {
				const failure = failureFrom(error);
				if (failure.kind === "service") {
					// The stored token is retained for the existing session-check retry flow.
					return;
				}
				goToLogin("Администратор создан. Войдите, чтобы продолжить.", username, true);
			}
		} catch (error) {
			const failure = failureFrom(error);
			if (failure.status === 404) {
				goToLogin("Первичная настройка уже выполнена. Войдите в аккаунт.", username, true);
				return;
			}
			if (failure.status === 409) {
				setPassword("");
				setFieldErrors({username: "Это имя пользователя уже занято. Выберите другое."});
				return;
			}
			if (failure.status === 400) {
				setPassword("");
				setRequestMessage("Проверьте имя пользователя и пароль и попробуйте ещё раз.");
				return;
			}
			setPassword("");
			setRequestMessage("Сервис временно недоступен. Повторите попытку.");
		} finally {
			setCheckingAccess(false);
		}
	};

	const errorMessage = requestMessage ?? (fieldErrors.username || fieldErrors.password
		? "Проверьте поля формы."
		: undefined);

	return (
		<AuthFormLayout ariaLabelledBy="bootstrap-title" title="Создайте администратора">
				{errorMessage && (
					<FormMessage id="bootstrap-error">{errorMessage}</FormMessage>
				)}
				<FormStack className={style.form} onSubmit={handleSubmit} noValidate>
					<TextField
						id="bootstrap-username"
						name="username"
						label="Создайте имя пользователя"
						placeholder="Имя пользователя"
						autoComplete="username"
						value={username}
						onChange={event => {
							setUsername(event.target.value);
							setFieldErrors(current => ({...current, username: undefined}));
							setRequestMessage(undefined);
						}}
						required
						maxLength={64}
						invalid={Boolean(fieldErrors.username)}
						describedBy={fieldErrors.username ? "bootstrap-username-error" : errorMessage ? "bootstrap-error" : undefined}
					/>
					{fieldErrors.username && <p id="bootstrap-username-error" className={style.fieldError}>{fieldErrors.username}</p>}
					<TextField
						id="bootstrap-password"
						name="password"
						label="Создайте пароль"
						placeholder="Пароль"
						type="password"
						autoComplete="new-password"
						value={password}
						onChange={event => {
							setPassword(event.target.value);
							setFieldErrors(current => ({...current, password: undefined}));
							setRequestMessage(undefined);
						}}
						required
						maxLength={64}
						invalid={Boolean(fieldErrors.password)}
						describedBy={fieldErrors.password ? "bootstrap-password-error" : errorMessage ? "bootstrap-error" : undefined}
					/>
					{fieldErrors.password && <p id="bootstrap-password-error" className={style.fieldError}>{fieldErrors.password}</p>}
					<Button className={style.submit} type="submit" fullWidth disabled={busy}>
						{checkingAccess ? "Входим…" : busy ? "Создаём…" : "Создать администратора"}
					</Button>
				</FormStack>
		</AuthFormLayout>
	);
};

export default AdminBootstrapPage;

import React, {FC, FormEvent, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toApiFailure} from "../../api/ApiError";
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

interface FieldErrors {
	username?: string;
	password?: string;
}

const isValidUsername = (value: string): boolean => /^[A-Za-z0-9]{5,64}$/.test(value);
const isValidPassword = (value: string): boolean => value.length >= 8 && value.length <= 64;


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
				const failure = toApiFailure(error);
				if (failure.kind === "service") {
					return;
				}
				goToLogin("Администратор создан. Войдите, чтобы продолжить.", username, true);
			}
		} catch (error) {
			const failure = toApiFailure(error);
			if (failure.status === 404) {
				goToLogin("Первичная настройка уже выполнена. Войдите в панель администратора.", username, true);
				return;
			}
			if (failure.status === 409) {
				setPassword("");
				setFieldErrors({username: "Имя пользователя уже занято"});
				return;
			}
			if (failure.status === 400) {
				setPassword("");
				setRequestMessage("Проверьте имя пользователя и пароль. Имя: 5–64 символа, латиница и цифры; пароль: 8–64 символа.");
				return;
			}
			setPassword("");
			setRequestMessage("Сервис временно недоступен. Попробуйте ещё раз.");
		} finally {
			setCheckingAccess(false);
		}
	};

	return (
		<AuthFormLayout
			ariaLabelledBy="bootstrap-title"
			eyebrow="Первичная настройка"
			title="Создайте администратора"
			lead="Выполняется один раз. Задайте учётную запись главного администратора клуба."
			footnote="После создания вы войдёте в панель. Повторная регистрация администратора недоступна."
		>
			{requestMessage && (
				<FormMessage id="bootstrap-error">{requestMessage}</FormMessage>
			)}
			<FormStack onSubmit={handleSubmit} noValidate>
				<TextField
					id="bootstrap-username"
					name="username"
					label="Имя пользователя"
					placeholder="5–64 символа, латиница и цифры"
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
					error={fieldErrors.username}
					describedBy={requestMessage ? "bootstrap-error" : undefined}
				/>
				<TextField
					id="bootstrap-password"
					name="password"
					label="Пароль"
					placeholder="Не менее 8 символов"
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
					error={fieldErrors.password}
					describedBy={requestMessage ? "bootstrap-error" : undefined}
				/>
				<Button variant="gold" type="submit" fullWidth disabled={busy}>
					{checkingAccess ? "Входим…" : busy ? "Создаём…" : "Создать администратора"}
				</Button>
			</FormStack>
		</AuthFormLayout>
	);
};

export default AdminBootstrapPage;
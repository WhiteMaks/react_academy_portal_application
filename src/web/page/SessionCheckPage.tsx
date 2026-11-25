import React, {FC} from "react";
import Button from "../component/common/button/Button";
import AuthFormLayout, {AuthStack, AuthStatusBlock} from "../component/common/auth_form/AuthFormLayout";
import FormMessage from "../component/common/form_message/FormMessage";
import style from "./SessionCheckPage.module.css";

export type SessionCheckLayout = "connecting" | "restoring" | "error";

export interface SessionCheckPageProps {
	layout: SessionCheckLayout;
	loading?: boolean;
	title?: string;
	lead?: string;
	alertMessage?: string;
	retryLabel?: string;
	errorCode?: string;
	onRetry: () => void;
	onLogout?: () => void;
}

const DEFAULT_ERROR_TITLE = "Не удалось подключиться";
const DEFAULT_ERROR_LEAD = "Проверьте сеть и доступность сервиса.";
const DEFAULT_SERVICE_ALERT = "Сервис временно недоступен. Попробуйте ещё раз.";

const SessionCheckPage: FC<SessionCheckPageProps> = ({
	layout,
	loading = false,
	title,
	lead,
	alertMessage,
	retryLabel = "Повторить",
	errorCode = "service",
	onRetry,
	onLogout
}) => {
	if (layout === "connecting") {
		return (
			<AuthFormLayout ariaLabelledBy="session-connecting">
				<AuthStatusBlock text={title ?? "Проверяем подключение…"} busy={loading}/>
			</AuthFormLayout>
		);
	}

	if (layout === "restoring" && loading) {
		return (
			<AuthFormLayout
				ariaLabelledBy="session-restore-title"
				eyebrow="Панель администратора"
				title="Сессия"
			>
				<AuthStatusBlock text="Восстанавливаем сессию…" busy/>
			</AuthFormLayout>
		);
	}

	const errorTitle = title ?? DEFAULT_ERROR_TITLE;
	const errorLead = lead ?? DEFAULT_ERROR_LEAD;
	const alert = alertMessage ?? DEFAULT_SERVICE_ALERT;

	return (
		<AuthFormLayout
			ariaLabelledBy="session-error-title"
			eyebrow="Панель администратора"
			title={errorTitle}
			lead={errorLead}
			footnote={<>Код ошибки: <code>{errorCode}</code>. JWT не сбрасывается до явного выхода.</>}
		>
			<FormMessage id="session-error">{alert}</FormMessage>
			<AuthStack>
				<Button variant="gold" type="button" onClick={onRetry} disabled={loading} fullWidth>
					{retryLabel}
				</Button>
				{onLogout && (
					<Button variant="text" type="button" onClick={onLogout} className={style.logout}>
						Выйти
					</Button>
				)}
			</AuthStack>
		</AuthFormLayout>
	);
};

export default SessionCheckPage;
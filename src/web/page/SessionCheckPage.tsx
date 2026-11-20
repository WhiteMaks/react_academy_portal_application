import React, {FC} from "react";
import style from "./SessionCheckPage.module.css";

interface SessionCheckPageProps {
	loading?: boolean;
	title?: string;
	message?: string;
	retryLabel?: string;
	onRetry: () => void;
	onLogout?: () => void;
}

const SessionCheckPage: FC<SessionCheckPageProps> = ({
	loading = false,
	title,
	message,
	retryLabel = "Повторить проверку",
	onRetry,
	onLogout
}) => (
	<main className={style.page}>
		<section className={style.card} aria-labelledby="session-title">
			<h1 id="session-title">{title ?? (loading ? "Проверяем доступ…" : "Не удалось проверить сессию")}</h1>
			<p role={loading ? "status" : "alert"} aria-live={loading ? "polite" : "assertive"}>
				{message ?? (loading
					? "Подтверждаем права администратора. Защищённые данные пока не отображаются."
					: "Сервис временно недоступен. Попробуйте проверить сессию ещё раз.")}
			</p>
			<div className={style.actions}>
				<button type="button" className={style.primaryButton} onClick={onRetry} disabled={loading}>
					{retryLabel}
				</button>
				{onLogout && (
					<button type="button" className={style.secondaryButton} onClick={onLogout}>
						Выйти
					</button>
				)}
			</div>
		</section>
	</main>
);

export default SessionCheckPage;

import React, {FC} from "react";
import Button from "../component/common/button/Button";
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
				<Button type="button" onClick={onRetry} disabled={loading}>
					{retryLabel}
				</Button>
				{onLogout && (
					<Button variant="secondary" type="button" onClick={onLogout}>
						Выйти
					</Button>
				)}
			</div>
		</section>
	</main>
);

export default SessionCheckPage;

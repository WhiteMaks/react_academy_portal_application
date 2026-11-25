import {FC} from "react";
import {Link} from "react-router-dom";
import style from "./SectionPlaceholder.module.css";

interface SectionPlaceholderProps {
	title?: string;
	today?: boolean;
	notFound?: boolean;
}

const SectionPlaceholder: FC<SectionPlaceholderProps> = ({title, today = false, notFound = false}) => {
	if (notFound) {
		return (
			<main className={style.page}>
				<h1>Страница не найдена</h1>
				<p className={style.subtitle}>Адрес не соответствует разделу админки.</p>
				<section className={style.card}>
					<p>Вернитесь на главный экран.</p>
					<Link className={style.homeLink} to="/">На сегодня</Link>
				</section>
			</main>
		);
	}

	return (
		<main className={style.page}>
			<h1>{title}</h1>
			{today && <p className={style.subtitle}>Обзор клуба</p>}
			<section className={style.card} aria-labelledby="section-status">
				<p className={style.status}>Скоро</p>
				<h2 id="section-status">Раздел в разработке</h2>
				<p>
					{today
						? "Сводка и тренировки появятся после реализации по макетам из design/."
						: "Экран будет собран заново по UI kit и утверждённому HTML-макету."}
				</p>
			</section>
		</main>
	);
};

export default SectionPlaceholder;
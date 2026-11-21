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
				<p className={style.subtitle}>Адрес не соответствует разделу рабочего места.</p>
				<section className={style.card}>
					<h2>Проверьте адрес страницы</h2>
					<p>Вернитесь в раздел «Сегодня», чтобы продолжить работу. Неизвестный адрес остаётся внутри административной оболочки.</p>
					<Link className={style.homeLink} to="/">На сегодня</Link>
				</section>
			</main>
		);
	}

	return (
		<main className={style.page}>
			<h1>{title}</h1>
			{today && <p className={style.subtitle}>Обзор Академии</p>}
			{/*{title === "Спортсмены" && <p className={style.subtitle}>Карточки спортсменов</p>}*/}
			{!today && title !== "Спортсмены" && (
				<section className={style.card} aria-labelledby="section-status">
					<div className={style.status}>Скоро</div>
					<h2 id="section-status">Раздел пока не подключён</h2>
					<p>Функции этого раздела появятся после реализации соответствующей задачи MVP.</p>
				</section>
			)}
			{today && (
				<section className={style.card} aria-labelledby="section-status">
					<h2 id="section-status">Панель «Сегодня» пока не подключена</h2>
					<p>Ближайшие тренировки и сводка появятся после реализации соответствующих задач MVP. Здесь пока нет рабочих данных или действий.</p>
				</section>
			)}
			{title === "Спортсмены" && (
				<section className={style.card} aria-labelledby="section-status">
					<h2 id="section-status">Раздел «Спортсмены» пока не подключён</h2>
					<p>Список появится после MVP-04. Сейчас здесь нет карточек, поиска или действий.</p>
				</section>
			)}
		</main>
	);
};

export default SectionPlaceholder;

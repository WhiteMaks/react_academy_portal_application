import {FC} from "react";
import {Link} from "react-router-dom";

export type PlaceholderSection =
	| "home"
	| "coaches"
	| "gyms"
	| "groups"
	| "schedule"
	| "attendance"
	| "payments"
	| "notFound";

const SECTION_COPY: Record<Exclude<PlaceholderSection, "notFound" | "home">, {eyebrow: string; title: string}> = {
	coaches: {eyebrow: "Кадры клуба", title: "Тренеры"},
	gyms: {eyebrow: "Инфраструктура", title: "Филиалы"},
	groups: {eyebrow: "Занятия", title: "Группы"},
	schedule: {eyebrow: "Планирование", title: "Расписание"},
	attendance: {eyebrow: "Учёт", title: "Посещаемость"},
	payments: {eyebrow: "Финансы", title: "Платежи"}
};

interface SectionPlaceholderProps {
	section?: PlaceholderSection;
}

const SectionPlaceholder: FC<SectionPlaceholderProps> = ({section = "home"}) => {
	if (section === "notFound") {
		return (
			<>
				<header className="page-head">
					<div>
						<h1>Страница не найдена</h1>
						<p className="page-head__sub">Адрес не соответствует разделу админки.</p>
					</div>
				</header>
				<p className="academy-app__placeholder">
					<Link to="/">На главную</Link>
				</p>
			</>
		);
	}

	if (section === "home") {
		return (
			<>
				<header className="page-head">
					<div>
						<p className="page-head__eyebrow">Панель управления</p>
						<h1>Добрый день!</h1>
						<p className="page-head__sub">Раздел в разработке — полный дашборд появится в отдельном эпике.</p>
					</div>
				</header>
				<p className="academy-app__placeholder">
					Вы вошли в панель администратора. Перейдите в раздел «Спортсмены», чтобы управлять базой клуба.
				</p>
			</>
		);
	}

	const copy = SECTION_COPY[section];
	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">{copy.eyebrow}</p>
					<h1>{copy.title}</h1>
					<p className="page-head__sub">Раздел в разработке.</p>
				</div>
			</header>
			<p className="academy-app__placeholder">Экран будет собран заново по UI kit и утверждённому HTML-макету.</p>
		</>
	);
};

export default SectionPlaceholder;
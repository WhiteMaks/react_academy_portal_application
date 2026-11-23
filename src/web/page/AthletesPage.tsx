import React, {FC, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {fetchAthletes} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import FormMessage from "../component/common/form_message/FormMessage";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import {formatDateInput} from "../../api/models/athlete/birthDate";
import style from "./AthletesPage.module.css";

const fullName = (athlete: AthleteV1Response) =>
	[athlete.secondName, athlete.firstName, athlete.middleName].filter(Boolean).join(" ");

const errorText = (kind?: string) => {
	switch (kind) {
		case "unauthorized": return "Сессия завершена. Войдите снова, чтобы открыть список спортсменов.";
		case "forbidden": return "У вашей учётной записи нет доступа к списку спортсменов.";
		default: return "Не удалось загрузить список. Проверьте соединение и повторите попытку.";
	}
};

const AthletesPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const state = useGlobalSelector(global => global.athleteReducer);
	const location = useLocation();
	const navigate = useNavigate();
	const created = Boolean((location.state as {created?: boolean} | null)?.created);

	useEffect(() => {
		if (created) {
			dispatch(fetchAthletes());
			navigate("/athletes", {replace: true, state: null});
			return;
		}
		if (!state.loaded && !state.loading && !state.listErrorKind) dispatch(fetchAthletes());
	}, [created, dispatch, navigate, state.loaded, state.loading, state.listErrorKind]);

	return (
		<main className={style.page}>
			<header className={style.header}>
				<div><h1>Спортсмены</h1><p>Карточки спортсменов Академии</p></div>
				<Link className={style.addLink} to="/athletes/new">Добавить спортсмена</Link>
			</header>
			{created && <FormMessage variant="notice">Спортсмен добавлен.</FormMessage>}
			{state.loading && <p className={style.state} role="status">Загружаем список спортсменов…</p>}
			{state.listErrorKind && <section className={style.statePanel}>
				<FormMessage>{errorText(state.listErrorKind)}</FormMessage>
				{state.listErrorKind === "unauthorized" && <Link className={style.inlineLink} to="/logout">Завершить сессию и войти снова</Link>}
				<Button onClick={() => dispatch(fetchAthletes())}>Повторить</Button>
			</section>}
			{state.loaded && !state.listErrorKind && state.athletes.length === 0 && (
				<section className={style.empty}><h2>Пока нет спортсменов</h2><p>Добавьте первую карточку, чтобы она появилась в списке.</p></section>
			)}
			{state.loaded && !state.listErrorKind && state.athletes.length > 0 && (
				<div className={style.tableWrap}>
					<table className={style.table}>
						<thead><tr><th scope="col">Фамилия и имя</th><th scope="col">Дата рождения</th><th scope="col">Родитель</th><th scope="col">Статус</th></tr></thead>
						<tbody>{state.athletes.map(athlete => (
							<tr key={athlete.id}>
								<td data-label="Фамилия и имя"><strong>{fullName(athlete)}</strong></td>
								<td data-label="Дата рождения">{formatDateInput(athlete.birthDate) ?? "—"}</td>
								<td data-label="Родитель">{[athlete.parentSecondName, athlete.parentFirstName, athlete.parentMiddleName].filter(Boolean).join(" ") || "—"}</td>
								<td data-label="Статус"><span className={style.active}>Активен</span></td>
							</tr>
						))}</tbody>
					</table>
				</div>
			)}
		</main>
	);
};

export default AthletesPage;

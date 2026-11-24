import React, {FC, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {fetchAthletes} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import Button from "../component/common/button/Button";
import FormMessage from "../component/common/form_message/FormMessage";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import {formatBirthDateDmy} from "../../api/models/athlete/birthDate";
import AthleteStatusBadge from "../component/athlete_status_badge/AthleteStatusBadge";
import style from "./AthletesPage.module.css";

const fullName = (athlete: AthleteV1Response) =>
	[athlete.secondName, athlete.firstName, athlete.middleName].map(name => name?.trim()).filter(Boolean).join(" ");

const activeCardCountLabel = (count: number) => {
	const lastTwoDigits = count % 100;
	const lastDigit = count % 10;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "активных карточек";
	if (lastDigit === 1) return "активная карточка";
	if (lastDigit >= 2 && lastDigit <= 4) return "активные карточки";
	return "активных карточек";
};

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
	const activeCount = state.athletes.filter(athlete => athlete.isActive).length;

	useEffect(() => {
		if (created) {
			dispatch(fetchAthletes());
			navigate("/athletes", {replace: true, state: null});
			return;
		}
		if (!state.loaded && !state.loading && !state.listErrorKind) dispatch(fetchAthletes());
	}, [created, dispatch, navigate, state.loaded, state.loading, state.listErrorKind]);

	return (
		<main className={`${style.page} ${style.listPage}`}>
			<header className={style.header}>
				<div><nav className={style.breadcrumb} aria-label="Навигационная цепочка"><span>Рабочее место</span><span aria-hidden="true">/</span><span>Спортсмены</span></nav><h1>Спортсмены</h1><p><span className={style.listDesktopDescription}>Карточки людей, которые занимаются в академии.</span><span className={style.listMobileDescription}>Карточки спортсменов</span></p></div>
				<Link className={style.addLink} to="/athletes/new"><svg className={style.addIcon} viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 4v12M4 10h12"/></svg>Добавить спортсмена</Link>
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
					<div className={style.tableSummary}>{activeCount} {activeCardCountLabel(activeCount)}</div>
					<table className={style.table}>
						<thead><tr><th scope="col">ФИО</th><th scope="col">Дата рождения</th><th scope="col">Активность</th></tr></thead>
						<tbody>{state.athletes.map(athlete => (
							<tr key={athlete.id}>
								<td data-label="ФИО"><Link aria-label={`Открыть карточку спортсмена: ${fullName(athlete)}`} className={`${style.inlineLink} ${style.athleteListLink}`} to={`/athletes/${athlete.id}`}><strong>{fullName(athlete)}</strong><span>Карточка спортсмена</span></Link></td>
								<td data-label="Дата рождения"><span className={style.mobileDateLabel}>Дата рождения · </span>{formatBirthDateDmy(athlete.birthDate) ?? "—"}</td>
								<td data-label="Активность"><AthleteStatusBadge active={athlete.isActive}/></td>
							</tr>
						))}</tbody>
					</table>
				</div>
			)}
		</main>
	);
};

export default AthletesPage;

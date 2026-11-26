import React, {FC, useEffect, useMemo} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import {athleteActions, fetchAthleteDetail} from "../../data/state/athlete/AthleteReducer";
import {
	activityStatusLabel,
	formatAgeRu,
	formatDateRu,
	formatPersonName
} from "../util/athleteDisplay";
import {useShellChrome} from "../component/app_shell/ShellChromeContext";
import {logoutUser} from "../../data/state/user/UserTokenReducer";

const AthleteDetailPage: FC = () => {
	const {id} = useParams<{id: string}>();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const {detail, detailLoading, detailErrorKind} = useGlobalSelector(state => state.athleteReducer);

	useEffect(() => {
		if (!id) return;
		void dispatch(fetchAthleteDetail(id));
		return () => {
			dispatch(athleteActions.clearAthleteDetail());
		};
	}, [dispatch, id]);

	useEffect(() => {
		if (detailErrorKind === "unauthorized") {
			void dispatch(logoutUser());
		}
		if (detailErrorKind === "notFound") {
			navigate("/athletes", {replace: true});
		}
	}, [detailErrorKind, dispatch, navigate]);

	const displayName = useMemo(() => {
		if (!detail) return "Спортсмен";
		return formatPersonName(detail.first_name, detail.last_name, detail.patronymic);
	}, [detail]);

	useEffect(() => {
		setMobileTitleOverride(displayName);
		setCrumbTrail([
			{label: "Спортсмены", href: "/athletes"},
			{label: displayName}
		]);
		return () => {
			setMobileTitleOverride(null);
			setCrumbTrail(null);
		};
	}, [displayName, setCrumbTrail, setMobileTitleOverride]);

	if (!id) {
		return null;
	}

	if (detailLoading || !detail) {
		return (
			<>
				<header className="page-head">
					<div>
						<p className="page-head__eyebrow">Карточка спортсмена</p>
						<h1>Загрузка…</h1>
					</div>
				</header>
			</>
		);
	}

	const status = activityStatusLabel(detail.activity_status);
	const subline = `${formatAgeRu(detail.birth_date)} · дата рождения ${formatDateRu(detail.birth_date)} · телефон ${detail.phone}`;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Карточка спортсмена</p>
					<h1>
						{displayName}{" "}
						<span className={`data-table__status data-table__status--${status.active ? "active" : "inactive"}`}>
							{status.text}
						</span>
					</h1>
					<p className="page-head__sub">{subline}</p>
				</div>
				<div className="page-head__actions">
					<Link className="btn" to="/athletes">
						← К списку
					</Link>
				</div>
			</header>
			<p className="athletes-detail__lead">
				Полный просмотр и редактирование — в следующем эпике. Сейчас зафиксирован переход из списка по клику на
				строку.
			</p>
		</>
	);
};

export default AthleteDetailPage;
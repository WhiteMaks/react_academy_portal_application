import React, {FC, KeyboardEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import {createCoach, fetchCoaches} from "../../data/state/coach/CoachReducer";
import CoachV1Response from "../../api/models/coach/CoachV1Response";
import PostCoachV1Request from "../../api/models/coach/PostCoachV1Request";
import {COACHES_SEARCH_Q_MAX_LEN, trimToMax} from "../../api/constants/coachFieldLimits";
import {FORM_CHECK_BANNER} from "../component/common/design_form/formContract";
import CoachCreateModal from "../component/coach/CoachCreateModal";
import {CoachFormFieldErrors} from "../component/coach/coachFormTypes";
import {
	activityStatusLabel,
	athleteInitials,
	formatAgeRu,
	formatDateRu,
	formatNoteCell,
	formatPersonName
} from "../util/athleteDisplay";
import {logoutUser} from "../../data/state/user/UserTokenReducer";

const SEARCH_DEBOUNCE_MS = 300;
const COACH_GROUPS_PLACEHOLDER = "Пока не назначены";
const PHONE_CONFLICT_BANNER = "Тренер с таким телефоном уже есть в базе";
const PHONE_CONFLICT_FIELD = "Этот номер уже используется другим тренером";

const CoachesPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {list, total, limit, offset, listLoading, listErrorKind, createLoading} = useGlobalSelector(
		state => state.coachReducer
	);

	const [searchInput, setSearchInput] = useState("");
	const [debouncedQ, setDebouncedQ] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [createBanner, setCreateBanner] = useState<string | null>(null);
	const [createFieldErrors, setCreateFieldErrors] = useState<CoachFormFieldErrors | undefined>();

	useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedQ(searchInput.trim()), SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(handle);
	}, [searchInput]);

	const loadList = useCallback(
		(q: string, nextOffset: number) => {
			void dispatch(fetchCoaches({q, offset: nextOffset}));
		},
		[dispatch]
	);

	useEffect(() => {
		loadList(debouncedQ, 0);
	}, [debouncedQ, loadList]);

	useEffect(() => {
		if (listErrorKind === "unauthorized") {
			void dispatch(logoutUser());
		}
	}, [listErrorKind, dispatch]);

	const openModal = () => {
		setCreateBanner(null);
		setCreateFieldErrors(undefined);
		setModalOpen(true);
	};

	const closeModal = () => {
		if (createLoading) return;
		setModalOpen(false);
		setCreateBanner(null);
		setCreateFieldErrors(undefined);
	};

	const handleCreate = async (body: PostCoachV1Request) => {
		setCreateBanner(null);
		setCreateFieldErrors(undefined);
		try {
			await dispatch(createCoach(body)).unwrap();
			setModalOpen(false);
			if (debouncedQ !== "" || offset !== 0) {
				loadList(debouncedQ, offset);
			}
		} catch (error) {
			const failure = error as {kind?: string};
			if (failure.kind === "conflict") {
				setCreateBanner(PHONE_CONFLICT_BANNER);
				setCreateFieldErrors({phone: PHONE_CONFLICT_FIELD});
				return;
			}
			if (failure.kind === "unauthorized") {
				void dispatch(logoutUser());
				return;
			}
			if (failure.kind === "request") {
				setCreateBanner(FORM_CHECK_BANNER);
				return;
			}
			setCreateBanner("Не удалось сохранить. Проверьте сеть и повторите попытку.");
		}
	};

	const showEmptyList = !listLoading && listErrorKind === undefined && list.length === 0;
	const showUnavailable = listErrorKind !== undefined && list.length === 0;
	const emptyRowMessage =
		debouncedQ !== "" && showEmptyList ? "По запросу тренеров не найдено" : "Пока нет тренеров";

	const listAlert = useMemo(() => {
		if (listErrorKind === "forbidden") {
			return "Доступ только для администратора клуба.";
		}
		if (listErrorKind === "service" || listErrorKind === "request") {
			return "Не удалось загрузить список. Проверьте подключение и попробуйте снова.";
		}
		return null;
	}, [listErrorKind]);

	const openCoach = (coach: CoachV1Response) => {
		navigate(`/coaches/${coach.id}`);
	};

	const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, coach: CoachV1Response) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openCoach(coach);
		}
	};

	const canPageBack = offset > 0;
	const canPageForward = offset + limit < total;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Команда</p>
					<h1>Тренеры</h1>
					<p className="page-head__sub">Специализация, контакты и закреплённые группы.</p>
				</div>
				<div className="page-head__actions">
					<button type="button" className="btn btn--gold" aria-haspopup="dialog" onClick={openModal}>
						＋ Добавить тренера
					</button>
				</div>
			</header>

			<div className="data-table-toolbar coaches-toolbar">
				<label className="academy-field">
					<span className="academy-field__label">Поиск</span>
					<input
						className="academy-field__control academy-field__control--toolbar"
						type="search"
						name="q"
						maxLength={COACHES_SEARCH_Q_MAX_LEN}
						value={searchInput}
						placeholder="Поиск: ФИО, телефон, дата рождения, специализация…"
						aria-label="Поиск: ФИО, телефон, дата рождения, специализация"
						onChange={event => setSearchInput(trimToMax(event.target.value, COACHES_SEARCH_Q_MAX_LEN))}
					/>
				</label>
			</div>

			{listAlert ? (
				<p className="academy-alert academy-alert--error" role="alert">
					{listAlert}{" "}
					{listErrorKind !== "forbidden" ? (
						<button type="button" className="btn btn--link" onClick={() => loadList(debouncedQ, offset)}>
							Повторить
						</button>
					) : null}
				</p>
			) : null}

			<div
				className={[
					"data-table-wrap",
					"data-table-wrap--stacked",
					listLoading ? "data-table-wrap--loading" : ""
				].filter(Boolean).join(" ")}
			>
				{listLoading ? (
					<div className="data-table__loading" role="status" aria-live="polite">
						<div className="data-table__spinner" aria-hidden="true"/>
						<p className="data-table__loading-text">Загрузка списка…</p>
					</div>
				) : null}
				<table className="data-table coaches-list-table">
					<thead>
						<tr>
							<th scope="col">Тренер</th>
							<th scope="col">Направление</th>
							<th scope="col">Группы</th>
							<th scope="col">Телефон</th>
							<th scope="col">Примечание</th>
						</tr>
					</thead>
					<tbody>
						{listLoading ? (
							<tr className="data-table__skeleton">
								<td colSpan={5}>
									<span className="data-table__skeleton-bar data-table__skeleton-bar--short"/>
								</td>
							</tr>
						) : null}
						{!listLoading && showEmptyList ? (
							<tr className="data-table__empty">
								<td colSpan={5}>{emptyRowMessage}</td>
							</tr>
						) : null}
						{!listLoading && showUnavailable && !showEmptyList ? (
							<tr className="data-table__empty">
								<td colSpan={5}>Данные недоступны</td>
							</tr>
						) : null}
						{!listLoading
							? list.map(coach => {
								const name = formatPersonName(coach.first_name, coach.last_name, coach.patronymic);
								const status = activityStatusLabel(coach.activity_status);
								return (
									<tr
										key={coach.id}
										className="data-table__row--interactive"
										tabIndex={0}
										role="link"
										aria-label={`Открыть карточку: ${name}`}
										onClick={() => openCoach(coach)}
										onKeyDown={event => onRowKey(event, coach)}
									>
										<td className="data-table__cell-primary">
											<div className="data-table__person">
												<span className="data-table__mini-avatar" aria-hidden="true">
													{athleteInitials(coach.first_name, coach.last_name)}
												</span>
												<span className="data-table__person-main">
													<span className="data-table__person-line">
														{name}{" "}
														<span
															className={`data-table__status data-table__status--${
																status.active ? "active" : "inactive"
															}`}
														>
															{status.text}
														</span>
													</span>
													<span className="data-table__meta">
														{formatAgeRu(coach.birth_date)} · {formatDateRu(coach.birth_date)}
													</span>
												</span>
											</div>
										</td>
										<td data-label="Направление">{coach.specialization}</td>
										<td data-label="Группы">{COACH_GROUPS_PLACEHOLDER}</td>
										<td data-label="Телефон">{coach.phone}</td>
										<td className="data-table__note" data-label="Примечание">
											{formatNoteCell(coach.note)}
										</td>
									</tr>
								);
							})
							: null}
					</tbody>
				</table>
			</div>

			{total > limit ? (
				<div className="data-table-toolbar" style={{marginTop: 14}}>
					<button
						type="button"
						className="btn btn--small"
						disabled={!canPageBack || listLoading}
						onClick={() => loadList(debouncedQ, Math.max(0, offset - limit))}
					>
						Назад
					</button>
					<span style={{color: "var(--muted)", fontSize: 12}}>
						{offset + 1}–{Math.min(offset + limit, total)} из {total}
					</span>
					<button
						type="button"
						className="btn btn--small"
						disabled={!canPageForward || listLoading}
						onClick={() => loadList(debouncedQ, offset + limit)}
					>
						Вперёд
					</button>
				</div>
			) : null}

			<CoachCreateModal
				open={modalOpen}
				submitting={createLoading}
				bannerError={createBanner}
				serverFieldErrors={createFieldErrors}
				onClose={closeModal}
				onSubmit={body => void handleCreate(body)}
				onClearServerErrors={() => {
					setCreateBanner(null);
					setCreateFieldErrors(undefined);
				}}
			/>
		</>
	);
};

export default CoachesPage;
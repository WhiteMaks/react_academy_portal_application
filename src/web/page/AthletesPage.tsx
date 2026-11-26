import React, {FC, KeyboardEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import {createAthlete, fetchAthletes} from "../../data/state/athlete/AthleteReducer";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import PostAthleteV1Request from "../../api/models/athlete/PostAthleteV1Request";
import {ATHLETES_SEARCH_Q_MAX_LEN, trimToMax} from "../../api/constants/athleteFieldLimits";
import {FORM_CHECK_BANNER} from "../component/common/design_form/formContract";
import AthleteCreateModal from "../component/athlete/AthleteCreateModal";
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

const AthletesPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		list,
		total,
		limit,
		offset,
		listLoading,
		listErrorKind,
		createLoading
	} = useGlobalSelector(state => state.athleteReducer);

	const [searchInput, setSearchInput] = useState("");
	const [debouncedQ, setDebouncedQ] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [createBanner, setCreateBanner] = useState<string | null>(null);

	useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedQ(searchInput.trim()), SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(handle);
	}, [searchInput]);

	useEffect(() => {
		if (searchParams.get("modal") === "open") {
			setModalOpen(true);
		}
	}, [searchParams]);

	const loadList = useCallback(
		(q: string, nextOffset: number) => {
			void dispatch(fetchAthletes({q, offset: nextOffset}));
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
		setModalOpen(true);
	};

	const closeModal = () => {
		if (createLoading) return;
		setModalOpen(false);
		setCreateBanner(null);
		if (searchParams.get("modal") === "open") {
			const next = new URLSearchParams(searchParams);
			next.delete("modal");
			setSearchParams(next, {replace: true});
		}
	};

	const handleCreate = async (body: PostAthleteV1Request) => {
		setCreateBanner(null);
		try {
			await dispatch(createAthlete(body)).unwrap();
			setModalOpen(false);
			if (debouncedQ !== "" || offset !== 0) {
				loadList(debouncedQ, offset);
			}
		} catch (error) {
			const failure = error as {kind?: string};
			if (failure.kind === "conflict") {
				setCreateBanner("Спортсмен с таким телефоном уже есть в базе");
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

	const showEmpty = !listLoading && listErrorKind === undefined && list.length === 0;
	const showUnavailable = listErrorKind !== undefined && list.length === 0;

	const listAlert = useMemo(() => {
		if (listErrorKind === "forbidden") {
			return "Доступ только для администратора клуба.";
		}
		if (listErrorKind === "service" || listErrorKind === "request") {
			return "Не удалось загрузить список. Проверьте подключение и попробуйте снова.";
		}
		return null;
	}, [listErrorKind]);

	const openAthlete = (athlete: AthleteV1Response) => {
		navigate(`/athletes/${athlete.id}`);
	};

	const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, athlete: AthleteV1Response) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openAthlete(athlete);
		}
	};

	const canPageBack = offset > 0;
	const canPageForward = offset + limit < total;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">База клуба</p>
					<h1>Спортсмены</h1>
					<p className="page-head__sub">Создание и просмотр карточек спортсменов.</p>
				</div>
				<div className="page-head__actions">
					<button type="button" className="btn btn--gold" aria-haspopup="dialog" onClick={openModal}>
						＋ Добавить спортсмена
					</button>
				</div>
			</header>

			<div className="data-table-toolbar athletes-toolbar">
				<label className="academy-field">
					<span className="academy-field__label">Поиск</span>
					<input
						className="academy-field__control academy-field__control--toolbar"
						type="search"
						name="q"
						maxLength={ATHLETES_SEARCH_Q_MAX_LEN}
						value={searchInput}
						placeholder="Поиск: ФИО, телефон, дата рождения…"
						aria-label="Поиск: ФИО, телефон, дата рождения"
						onChange={event => setSearchInput(trimToMax(event.target.value, ATHLETES_SEARCH_Q_MAX_LEN))}
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
				<table className="data-table athletes-list-table">
					<thead>
						<tr>
							<th scope="col">Спортсмен</th>
							<th scope="col">Телефон</th>
							<th scope="col">Примечание</th>
						</tr>
					</thead>
					<tbody>
						{listLoading ? (
							<tr className="data-table__skeleton">
								<td colSpan={3}>
									<span className="data-table__skeleton-bar data-table__skeleton-bar--short"/>
								</td>
							</tr>
						) : null}
						{!listLoading && showEmpty ? (
							<tr className="data-table__empty">
								<td colSpan={3}>Пока нет спортсменов</td>
							</tr>
						) : null}
						{!listLoading && showUnavailable && !showEmpty ? (
							<tr className="data-table__empty">
								<td colSpan={3}>Данные недоступны</td>
							</tr>
						) : null}
						{!listLoading
							? list.map(athlete => {
								const name = formatPersonName(athlete.first_name, athlete.last_name, athlete.patronymic);
								const status = activityStatusLabel(athlete.activity_status);
								return (
									<tr
										key={athlete.id}
										className="data-table__row--interactive"
										tabIndex={0}
										role="link"
										aria-label={`Открыть карточку: ${name}`}
										onClick={() => openAthlete(athlete)}
										onKeyDown={event => onRowKey(event, athlete)}
									>
										<td className="data-table__cell-primary">
											<div className="data-table__person">
												<span className="data-table__mini-avatar" aria-hidden="true">
													{athleteInitials(athlete.first_name, athlete.last_name)}
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
														{formatAgeRu(athlete.birth_date)} · {formatDateRu(athlete.birth_date)}
													</span>
												</span>
											</div>
										</td>
										<td data-label="Телефон">{athlete.phone}</td>
										<td className="data-table__note" data-label="Примечание">
											{formatNoteCell(athlete.note)}
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

			<AthleteCreateModal
				open={modalOpen}
				submitting={createLoading}
				bannerError={createBanner}
				onClose={closeModal}
				onSubmit={body => void handleCreate(body)}
				onClearServerErrors={() => setCreateBanner(null)}
			/>
		</>
	);
};

export default AthletesPage;
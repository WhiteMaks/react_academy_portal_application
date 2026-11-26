import React, {FC, KeyboardEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import {
	createBranch,
	fetchBranchHallCounts,
	fetchBranches
} from "../../data/state/branch/BranchReducer";
import BranchV1Response from "../../api/models/branch/BranchV1Response";
import PostBranchV1Request from "../../api/models/branch/PostBranchV1Request";
import {BRANCHES_SEARCH_Q_MAX_LEN, trimToMax} from "../../api/constants/branchFieldLimits";
import {FORM_CHECK_BANNER} from "../component/common/design_form/formContract";
import BranchCreateModal from "../component/branch/BranchCreateModal";
import {BranchFormFieldErrors} from "../component/branch/branchFormTypes";
import {activityStatusLabel, formatNoteCell} from "../util/athleteDisplay";
import {branchInitials, formatHallsCountCell} from "../util/infrastructureDisplay";
import {logoutUser} from "../../data/state/user/UserTokenReducer";

const SEARCH_DEBOUNCE_MS = 300;
const BRANCH_NAME_CONFLICT_BANNER = "Филиал с таким названием уже есть";
const BRANCH_NAME_CONFLICT_FIELD = "Филиал с таким названием уже существует";

const BranchesPage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {list, total, limit, offset, listLoading, listErrorKind, createLoading, hallCounts} = useGlobalSelector(
		state => state.branchReducer
	);

	const [searchInput, setSearchInput] = useState("");
	const [debouncedQ, setDebouncedQ] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [createBanner, setCreateBanner] = useState<string | null>(null);
	const [createFieldErrors, setCreateFieldErrors] = useState<BranchFormFieldErrors | undefined>();

	useEffect(() => {
		const handle = window.setTimeout(() => setDebouncedQ(searchInput.trim()), SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(handle);
	}, [searchInput]);

	const loadList = useCallback(
		(q: string, nextOffset: number) => {
			void dispatch(fetchBranches({q, offset: nextOffset}));
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

	useEffect(() => {
		if (listLoading || list.length === 0) return;
		void dispatch(fetchBranchHallCounts(list.map(branch => branch.id)));
	}, [dispatch, list, listLoading]);

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

	const handleCreate = async (body: PostBranchV1Request) => {
		setCreateBanner(null);
		setCreateFieldErrors(undefined);
		try {
			const created = await dispatch(createBranch(body)).unwrap();
			setModalOpen(false);
			if (debouncedQ !== "" || offset !== 0) {
				loadList(debouncedQ, offset);
			} else {
				navigate(`/gyms/${created.id}`);
			}
		} catch (error) {
			const failure = error as {kind?: string};
			if (failure.kind === "conflict") {
				setCreateBanner(BRANCH_NAME_CONFLICT_BANNER);
				setCreateFieldErrors({name: BRANCH_NAME_CONFLICT_FIELD});
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
		debouncedQ !== "" && showEmptyList ? "По запросу филиалов не найдено" : "Пока нет филиалов";

	const listAlert = useMemo(() => {
		if (listErrorKind === "forbidden") {
			return "Доступ только для администратора клуба.";
		}
		if (listErrorKind === "service" || listErrorKind === "request") {
			return "Не удалось загрузить список. Проверьте подключение и попробуйте снова.";
		}
		return null;
	}, [listErrorKind]);

	const openBranch = (branch: BranchV1Response) => {
		navigate(`/gyms/${branch.id}`);
	};

	const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, branch: BranchV1Response) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openBranch(branch);
		}
	};

	const canPageBack = offset > 0;
	const canPageForward = offset + limit < total;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Инфраструктура</p>
					<h1>Филиалы</h1>
					<p className="page-head__sub">Адреса клуба и спортивные площадки в каждом филиале.</p>
				</div>
				<div className="page-head__actions">
					<button type="button" className="btn btn--gold" aria-haspopup="dialog" onClick={openModal}>
						＋ Добавить филиал
					</button>
				</div>
			</header>

			<div className="data-table-toolbar branches-toolbar">
				<label className="academy-field">
					<span className="academy-field__label">Поиск</span>
					<input
						className="academy-field__control academy-field__control--toolbar"
						type="search"
						name="q"
						maxLength={BRANCHES_SEARCH_Q_MAX_LEN}
						value={searchInput}
						placeholder="Поиск: название, адрес…"
						aria-label="Поиск: название, адрес"
						onChange={event => setSearchInput(trimToMax(event.target.value, BRANCHES_SEARCH_Q_MAX_LEN))}
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
				<table className="data-table branches-list-table">
					<thead>
						<tr>
							<th scope="col">Филиал</th>
							<th scope="col">Адрес</th>
							<th scope="col">Залы</th>
							<th scope="col">Примечание</th>
						</tr>
					</thead>
					<tbody>
						{listLoading ? (
							<tr className="data-table__skeleton">
								<td colSpan={4}>
									<span className="data-table__skeleton-bar data-table__skeleton-bar--short"/>
								</td>
							</tr>
						) : null}
						{!listLoading && showEmptyList ? (
							<tr className="data-table__empty">
								<td colSpan={4}>{emptyRowMessage}</td>
							</tr>
						) : null}
						{!listLoading && showUnavailable && !showEmptyList ? (
							<tr className="data-table__empty">
								<td colSpan={4}>Данные недоступны</td>
							</tr>
						) : null}
						{!listLoading
							? list.map(branch => {
								const status = activityStatusLabel(branch.activity_status);
								const counts = hallCounts[branch.id];
								return (
									<tr
										key={branch.id}
										className="data-table__row--interactive"
										tabIndex={0}
										role="link"
										aria-label={`Открыть карточку: ${branch.name}`}
										onClick={() => openBranch(branch)}
										onKeyDown={event => onRowKey(event, branch)}
									>
										<td className="data-table__cell-primary">
											<div className="data-table__person">
												<span className="data-table__mini-avatar" aria-hidden="true">
													{branchInitials(branch.name)}
												</span>
												<span className="data-table__person-main">
													<span className="data-table__person-line">
														{branch.name}{" "}
														<span
															className={`data-table__status data-table__status--${
																status.active ? "active" : "inactive"
															}`}
														>
															{status.text}
														</span>
													</span>
												</span>
											</div>
										</td>
										<td data-label="Адрес">{branch.address}</td>
										<td className="data-table__halls-count" data-label="Залы">
											{formatHallsCountCell(counts?.active, counts?.total)}
										</td>
										<td className="data-table__note" data-label="Примечание">
											{formatNoteCell(branch.note)}
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

			<BranchCreateModal
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

export default BranchesPage;
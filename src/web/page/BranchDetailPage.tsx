import React, {FC, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import PutBranchV1Request from "../../api/models/branch/PutBranchV1Request";
import PostHallV1Request from "../../api/models/hall/PostHallV1Request";
import HallV1Response from "../../api/models/hall/HallV1Response";
import {toApiFailure} from "../../api/ApiError";
import {
	branchActions,
	createHall,
	fetchBranchDetail,
	fetchBranchHalls,
	putBranchV1
} from "../../data/state/branch/BranchReducer";
import {activityStatusLabel, formatNoteCell} from "../util/athleteDisplay";
import {
	formatBranchHallsSummary,
	formatHallCapacity,
	HALL_GROUPS_PLACEHOLDER
} from "../util/infrastructureDisplay";
import {useShellChrome} from "../component/app_shell/ShellChromeContext";
import {logoutUser} from "../../data/state/user/UserTokenReducer";
import DesignForm from "../component/common/design_form/DesignForm";
import {focusFirstFieldByName} from "../component/common/design_form/formContract";
import BranchFormFields from "../component/branch/BranchFormFields";
import BranchDeactivateConfirmModal from "../component/branch/BranchDeactivateConfirmModal";
import HallCreateModal from "../component/hall/HallCreateModal";
import {branchResponseToFormValues, isBranchFormDirty} from "../component/branch/branchFormFromResponse";
import {
	BRANCH_FIELD_FOCUS_ORDER,
	BranchFormField,
	BranchFormFieldErrors,
	BranchFormValues,
	EMPTY_BRANCH_FORM
} from "../component/branch/branchFormTypes";
import {clearBranchFieldErrorsOnChange, updateBranchFormValue} from "../component/branch/branchFormFieldUtils";
import {branchFormToPutBody, validateBranchForm} from "../component/branch/branchFormValidate";
import {HallFormFieldErrors} from "../component/hall/hallFormTypes";

const DETAIL_VALIDATION_BANNER = "Исправьте ошибки в форме";
const BRANCH_NAME_CONFLICT_BANNER = "Филиал с таким названием уже есть";
const BRANCH_NAME_CONFLICT_FIELD = "Филиал с таким названием уже существует";
const NETWORK_SAVE_BANNER = "Не удалось сохранить. Проверьте сеть и повторите попытку.";
const DETAIL_LOAD_ERROR = "Не удалось загрузить карточку. Проверьте подключение и попробуйте снова.";
const SAVE_SUCCESS = "Изменения сохранены.";
const STATUS_INACTIVE_SUCCESS = "Статус обновлён. Все залы филиала отмечены как неактивные.";
const STATUS_ACTIVE_SUCCESS = "Статус обновлён. Филиал снова в активных.";
const HALLS_LOAD_ERROR = "Не удалось загрузить список залов. Попробуйте обновить страницу.";
const HALL_NAME_CONFLICT_BANNER = "Зал с таким названием уже есть в этом филиале";
const HALL_NAME_CONFLICT_FIELD = "В этом филиале уже есть зал с таким названием";

type SubmitMode = "save" | "status" | null;

const BranchDetailPage: FC = () => {
	const {branchId} = useParams<{branchId: string}>();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const {
		detail,
		detailLoading,
		detailErrorKind,
		updateLoading,
		halls,
		hallsTotal,
		hallsLoading,
		hallsErrorKind,
		createHallLoading
	} = useGlobalSelector(state => state.branchReducer);

	const [form, setForm] = useState<BranchFormValues>(EMPTY_BRANCH_FORM);
	const [baselineForm, setBaselineForm] = useState<BranchFormValues>(EMPTY_BRANCH_FORM);
	const [clientErrors, setClientErrors] = useState<BranchFormFieldErrors>({});
	const [serverFieldErrors, setServerFieldErrors] = useState<BranchFormFieldErrors>({});
	const [formBanner, setFormBanner] = useState<string | null>(null);
	const [pageSuccess, setPageSuccess] = useState<string | null>(null);
	const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
	const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
	const [hallModalOpen, setHallModalOpen] = useState(false);
	const [hallCreateBanner, setHallCreateBanner] = useState<string | null>(null);
	const [hallCreateFieldErrors, setHallCreateFieldErrors] = useState<HallFormFieldErrors | undefined>();
	const formCardRef = useRef<HTMLDivElement>(null);
	const loadedDetailIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!branchId) return;
		void dispatch(fetchBranchDetail(branchId));
		void dispatch(fetchBranchHalls(branchId));
		return () => {
			dispatch(branchActions.clearBranchDetail());
		};
	}, [dispatch, branchId]);

	useEffect(() => {
		if (detailErrorKind === "unauthorized") {
			void dispatch(logoutUser());
		}
		if (detailErrorKind === "notFound") {
			navigate("/gyms", {replace: true});
		}
	}, [detailErrorKind, dispatch, navigate]);

	useEffect(() => {
		if (!detail) return;
		const isNewBranch = loadedDetailIdRef.current !== detail.id;
		loadedDetailIdRef.current = detail.id;
		const values = branchResponseToFormValues(detail);
		setForm(values);
		setBaselineForm(values);
		if (isNewBranch) {
			setClientErrors({});
			setServerFieldErrors({});
			setFormBanner(null);
			setPageSuccess(null);
		}
	}, [detail]);

	const displayName = detail?.name ?? "Филиал";
	const subline = useMemo(() => {
		if (!detail) return "";
		return formatBranchHallsSummary(detail.address, hallsTotal);
	}, [detail, hallsTotal]);

	useEffect(() => {
		setMobileTitleOverride(displayName);
		setCrumbTrail([
			{label: "Филиалы", href: "/gyms"},
			{label: displayName}
		]);
		return () => {
			setMobileTitleOverride(null);
			setCrumbTrail(null);
		};
	}, [displayName, setCrumbTrail, setMobileTitleOverride]);

	const isDirty = useMemo(() => isBranchFormDirty(form, baselineForm), [form, baselineForm]);
	const branchActive = detail?.activity_status === "active";

	const fieldError = (field: BranchFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors[field];

	const focusFirstInvalidField = (errors: BranchFormFieldErrors) => {
		const names = BRANCH_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(formCardRef.current, names);
	};

	const onFieldChange = (key: keyof BranchFormValues, value: string) => {
		setForm(prev => updateBranchFormValue(prev, key, value));
		setClientErrors(prev => clearBranchFieldErrorsOnChange(prev, key));
		setServerFieldErrors(prev => clearBranchFieldErrorsOnChange(prev, key));
		setFormBanner(null);
		setPageSuccess(null);
	};

	const runPut = async (body: PutBranchV1Request, mode: SubmitMode) => {
		if (!branchId) return;
		setSubmitMode(mode);
		setFormBanner(null);
		setServerFieldErrors({});
		try {
			const updated = await dispatch(putBranchV1({id: branchId, body})).unwrap();
			setBaselineForm(branchResponseToFormValues(updated));
			setForm(branchResponseToFormValues(updated));
			setPageSuccess(
				mode === "status"
					? body.activity_status === "inactive"
						? STATUS_INACTIVE_SUCCESS
						: STATUS_ACTIVE_SUCCESS
					: SAVE_SUCCESS
			);
			setClientErrors({});
			if (mode === "status" && body.activity_status === "inactive") {
				void dispatch(fetchBranchHalls(branchId));
			}
		} catch (error) {
			const failure = toApiFailure(error);
			if (failure.kind === "unauthorized") {
				void dispatch(logoutUser());
				return;
			}
			if (failure.kind === "notFound") {
				navigate("/gyms", {replace: true});
				return;
			}
			if (failure.kind === "forbidden") {
				setFormBanner("Доступ только для администратора клуба.");
				return;
			}
			if (failure.kind === "conflict") {
				setFormBanner(BRANCH_NAME_CONFLICT_BANNER);
				setServerFieldErrors({name: BRANCH_NAME_CONFLICT_FIELD});
				focusFirstFieldByName(formCardRef.current, ["name"]);
				return;
			}
			if (failure.kind === "request") {
				const revalidate = validateBranchForm(form);
				if (!revalidate.ok) {
					setClientErrors(revalidate.errors);
					setFormBanner(DETAIL_VALIDATION_BANNER);
					focusFirstInvalidField(revalidate.errors);
				} else {
					setFormBanner(DETAIL_VALIDATION_BANNER);
				}
				return;
			}
			setFormBanner(NETWORK_SAVE_BANNER);
		} finally {
			setSubmitMode(null);
			setDeactivateConfirmOpen(false);
		}
	};

	const handleSave = (event: FormEvent) => {
		event.preventDefault();
		if (updateLoading || !detail || !isDirty) return;
		const result = validateBranchForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const body = branchFormToPutBody(form, detail.activity_status);
		if (!body) return;
		void runPut(body, "save");
	};

	const applyStatusToggle = () => {
		if (updateLoading || !detail) return;
		const result = validateBranchForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const nextStatus = detail.activity_status === "active" ? "inactive" : "active";
		const body = branchFormToPutBody(form, nextStatus);
		if (!body) return;
		void runPut(body, "status");
	};

	const handleToggleActivity = () => {
		if (!detail || updateLoading) return;
		if (detail.activity_status === "active") {
			setDeactivateConfirmOpen(true);
			return;
		}
		applyStatusToggle();
	};

	const openHallModal = () => {
		setHallCreateBanner(null);
		setHallCreateFieldErrors(undefined);
		setHallModalOpen(true);
	};

	const closeHallModal = () => {
		if (createHallLoading) return;
		setHallModalOpen(false);
		setHallCreateBanner(null);
		setHallCreateFieldErrors(undefined);
	};

	const handleCreateHall = async (body: Omit<PostHallV1Request, "branch_id">) => {
		if (!branchId || !detail) return;
		setHallCreateBanner(null);
		setHallCreateFieldErrors(undefined);
		try {
			const created = await dispatch(createHall({...body, branch_id: detail.id})).unwrap();
			setHallModalOpen(false);
			navigate(`/gyms/${branchId}/halls/${created.id}`);
		} catch (error) {
			const failure = toApiFailure(error);
			if (failure.kind === "unauthorized") {
				void dispatch(logoutUser());
				return;
			}
			if (failure.kind === "conflict") {
				setHallCreateBanner(HALL_NAME_CONFLICT_BANNER);
				setHallCreateFieldErrors({name: HALL_NAME_CONFLICT_FIELD});
				return;
			}
			setHallCreateBanner("Не удалось сохранить. Проверьте сеть и повторите попытку.");
		}
	};

	const openHall = (hall: HallV1Response) => {
		if (!branchId) return;
		navigate(`/gyms/${branchId}/halls/${hall.id}`);
	};

	const onHallRowKey = (event: KeyboardEvent<HTMLTableRowElement>, hall: HallV1Response) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openHall(hall);
		}
	};

	if (!branchId) {
		return null;
	}

	if (detailErrorKind === "forbidden" && !detail && !detailLoading) {
		return (
			<p className="academy-alert academy-alert--error branches-detail__page-message" role="alert">
				Доступ только для администратора клуба.
			</p>
		);
	}

	if (detailLoading && !detail) {
		return (
			<>
				<header className="page-head">
					<div>
						<p className="page-head__eyebrow">Карточка филиала</p>
						<h1>
							Филиал{" "}
							<span className="data-table__status data-table__status--active">Активен</span>
						</h1>
					</div>
					<div className="page-head__actions">
						<Link className="btn" to="/gyms">
							← К списку
						</Link>
					</div>
				</header>
				<div className="branches-detail__card branches-detail__card--loading">
					<div className="branches-detail__loading" role="status" aria-live="polite">
						<div className="data-table__spinner" aria-hidden="true"/>
						<p className="branches-detail__loading-text">Загрузка карточки…</p>
					</div>
					<div className="branches-detail__form" aria-hidden="true">
						<div className="branches-detail__skeleton-grid">
							<span className="branches-detail__skeleton-label"/>
							<span className="branches-detail__skeleton-input"/>
							<span className="branches-detail__skeleton-label"/>
							<span className="branches-detail__skeleton-input"/>
							<span className="branches-detail__skeleton-input branches-detail__skeleton-input--wide"/>
						</div>
					</div>
				</div>
			</>
		);
	}

	if (!detail) {
		if (detailErrorKind === "service" || detailErrorKind === "request") {
			return (
				<p className="academy-alert academy-alert--error branches-detail__page-message" role="alert">
					{DETAIL_LOAD_ERROR}{" "}
					<button type="button" className="btn btn--link" onClick={() => void dispatch(fetchBranchDetail(branchId))}>
						Повторить
					</button>
				</p>
			);
		}
		return null;
	}

	const status = activityStatusLabel(detail.activity_status);
	const toggleLabel = branchActive ? "Сделать неактивным" : "Вернуть в активные";
	const submitting = updateLoading;
	const saveLabel = submitMode === "save" && submitting ? "Сохранение…" : "Сохранить";
	const toggleButtonLabel = submitMode === "status" && submitting ? "Выполняется…" : toggleLabel;
	const statusBadgeId = "branch-detail-status-badge";
	const showHallsEmpty = !hallsLoading && hallsErrorKind === undefined && halls.length === 0;
	const showHallsUnavailable = hallsErrorKind !== undefined && halls.length === 0;
	const formInfoBanner =
		submitMode === "save" && submitting
			? "Сохранение изменений…"
			: null;
	const hideFormWhileStatusSubmit = submitMode === "status" && submitting;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Карточка филиала</p>
					<h1>
						{displayName}{" "}
						<span
							id={statusBadgeId}
							className={`data-table__status data-table__status--${status.active ? "active" : "inactive"}`}
						>
							{status.text}
						</span>
					</h1>
					<p className="page-head__sub">{subline}</p>
				</div>
				<div className="page-head__actions">
					<Link className="btn" to="/gyms">
						← К списку
					</Link>
					<button
						type="button"
						className="btn"
						disabled={submitting}
						aria-label={toggleLabel}
						aria-describedby={statusBadgeId}
						aria-busy={submitMode === "status" && submitting ? true : undefined}
						onClick={handleToggleActivity}
					>
						{toggleButtonLabel}
					</button>
					<button
						type="submit"
						className="btn btn--primary"
						form="branchDetailForm"
						disabled={submitting || !isDirty}
						aria-busy={submitMode === "save" && submitting ? true : undefined}
					>
						{saveLabel}
					</button>
				</div>
			</header>

			{hideFormWhileStatusSubmit ? (
				<p className="academy-alert academy-alert--info branches-detail__page-message" role="status">
					Меняем статус филиала…
				</p>
			) : null}

			{pageSuccess ? (
				<p className="academy-alert academy-alert--success branches-detail__page-message" role="status">
					{pageSuccess}
				</p>
			) : null}

			{!hideFormWhileStatusSubmit ? (
				<div className="branches-detail__card" ref={formCardRef}>
					{formInfoBanner ? (
						<p className="academy-alert academy-alert--info branches-detail__form-banner" role="status">
							{formInfoBanner}
						</p>
					) : null}
					{!formInfoBanner && formBanner ? (
						<p className="academy-alert academy-alert--error branches-detail__form-banner" role="alert">
							{formBanner}
						</p>
					) : null}
					<DesignForm id="branchDetailForm" className="branches-detail__form" onSubmit={handleSave}>
						<BranchFormFields
							form={form}
							fieldError={fieldError}
							onFieldChange={onFieldChange}
							idPrefix="branch-detail"
							sectionHeading="h2"
							noteAsTextarea
							fieldsDisabled={submitting}
						/>
					</DesignForm>
				</div>
			) : null}

			<section className="branches-detail__halls" aria-labelledby="halls-section-title">
				<div className="branches-detail__halls-head">
					<div>
						<h2 id="halls-section-title">Спортзалы</h2>
						<p className="branches-detail__halls-sub">Залы этого филиала. Адрес наследуется от филиала.</p>
					</div>
					<button type="button" className="btn btn--gold" aria-haspopup="dialog" onClick={openHallModal}>
						＋ Добавить зал
					</button>
				</div>

				{hallsErrorKind && !hallsLoading ? (
					<p className="academy-alert academy-alert--error" role="alert">
						{HALLS_LOAD_ERROR}{" "}
						<button type="button" className="btn btn--link" onClick={() => void dispatch(fetchBranchHalls(branchId))}>
							Повторить
						</button>
					</p>
				) : null}

				{!showHallsEmpty ? (
					<div
						className={[
							"data-table-wrap",
							"data-table-wrap--stacked",
							hallsLoading ? "data-table-wrap--loading" : ""
						].filter(Boolean).join(" ")}
					>
						{hallsLoading ? (
							<div className="data-table__loading" role="status" aria-live="polite">
								<div className="data-table__spinner" aria-hidden="true"/>
								<p className="data-table__loading-text">Загрузка списка…</p>
							</div>
						) : null}
						<table className="data-table branches-detail__halls-table">
							<thead>
								<tr>
									<th scope="col">Зал</th>
									<th scope="col">Описание</th>
									<th scope="col">Вместимость</th>
									<th scope="col">Группы</th>
								</tr>
							</thead>
							<tbody>
								{hallsLoading ? (
									<tr className="data-table__skeleton">
										<td colSpan={4}>
											<span className="data-table__skeleton-bar data-table__skeleton-bar--short"/>
										</td>
									</tr>
								) : null}
								{showHallsUnavailable && !showHallsEmpty ? (
									<tr className="data-table__empty">
										<td colSpan={4}>Данные недоступны</td>
									</tr>
								) : null}
								{!hallsLoading
									? halls.map(hall => {
										const hallStatus = activityStatusLabel(hall.activity_status);
										return (
											<tr
												key={hall.id}
												className="data-table__row--interactive"
												tabIndex={0}
												role="link"
												aria-label={`Открыть карточку: ${hall.name}`}
												onClick={() => openHall(hall)}
												onKeyDown={event => onHallRowKey(event, hall)}
											>
												<td className="data-table__cell-primary">
													<span className="data-table__person-line">
														{hall.name}{" "}
														<span
															className={`data-table__status data-table__status--${
																hallStatus.active ? "active" : "inactive"
															}`}
														>
															{hallStatus.text}
														</span>
													</span>
												</td>
												<td data-label="Описание">{formatNoteCell(hall.subtitle)}</td>
												<td className="branches-detail__capacity" data-label="Вместимость">
													{formatHallCapacity(hall.capacity)}
												</td>
												<td data-label="Группы">{HALL_GROUPS_PLACEHOLDER}</td>
											</tr>
										);
									})
									: null}
							</tbody>
						</table>
					</div>
				) : (
					<div className="branches-detail__halls-empty">
						<p>В этом филиале пока нет спортзалов.</p>
						<button type="button" className="btn btn--gold" onClick={openHallModal}>
							＋ Добавить зал
						</button>
					</div>
				)}
			</section>

			<BranchDeactivateConfirmModal
				open={deactivateConfirmOpen}
				submitting={submitMode === "status" && submitting}
				onClose={() => setDeactivateConfirmOpen(false)}
				onConfirm={applyStatusToggle}
			/>

			<HallCreateModal
				open={hallModalOpen}
				submitting={createHallLoading}
				bannerError={hallCreateBanner}
				serverFieldErrors={hallCreateFieldErrors}
				onClose={closeHallModal}
				onSubmit={body => void handleCreateHall(body)}
				onClearServerErrors={() => {
					setHallCreateBanner(null);
					setHallCreateFieldErrors(undefined);
				}}
			/>
		</>
	);
};

export default BranchDetailPage;
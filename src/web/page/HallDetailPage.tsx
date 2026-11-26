import React, {FC, FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import PutHallV1Request from "../../api/models/hall/PutHallV1Request";
import {toApiFailure} from "../../api/ApiError";
import {hallActions, fetchHallDetail, putHallV1} from "../../data/state/hall/HallReducer";
import {activityStatusLabel} from "../util/athleteDisplay";
import {formatHallDetailSummary} from "../util/infrastructureDisplay";
import {useShellChrome} from "../component/app_shell/ShellChromeContext";
import {logoutUser} from "../../data/state/user/UserTokenReducer";
import DesignForm from "../component/common/design_form/DesignForm";
import {focusFirstFieldByName} from "../component/common/design_form/formContract";
import TextField from "../component/common/text_field/TextField";
import HallFormFields from "../component/hall/HallFormFields";
import {hallResponseToFormValues, isHallFormDirty} from "../component/hall/hallFormFromResponse";
import {
	EMPTY_HALL_FORM,
	HALL_FIELD_FOCUS_ORDER,
	HallFormField,
	HallFormFieldErrors,
	HallFormValues
} from "../component/hall/hallFormTypes";
import {clearHallFieldErrorsOnChange, updateHallFormValue} from "../component/hall/hallFormFieldUtils";
import {hallFormToPutBody, validateHallForm} from "../component/hall/hallFormValidate";

const DETAIL_VALIDATION_BANNER = "Исправьте ошибки в форме";
const GENERIC_REQUEST_BANNER = "Не удалось сохранить. Проверьте данные и попробуйте снова.";
const HALL_NAME_CONFLICT_BANNER = "Зал с таким названием уже есть в этом филиале";
const HALL_NAME_CONFLICT_FIELD = "В этом филиале уже есть зал с таким названием";
const NETWORK_SAVE_BANNER = "Не удалось сохранить. Проверьте сеть и повторите попытку.";
const DETAIL_LOAD_ERROR = "Не удалось загрузить карточку. Проверьте подключение и попробуйте снова.";
const SAVE_SUCCESS = "Изменения сохранены.";
const STATUS_INACTIVE_SUCCESS = "Статус обновлён. Зал отмечен как неактивный.";
const STATUS_ACTIVE_SUCCESS = "Статус обновлён. Зал снова в активных.";
const ACTIVATE_BLOCKED_BANNER =
	"Нельзя сделать зал активным, пока филиал неактивен. Сначала верните филиал в активные.";

type SubmitMode = "save" | "status" | null;

const HallDetailPage: FC = () => {
	const {branchId, hallId} = useParams<{branchId: string; hallId: string}>();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const {detail, detailLoading, detailErrorKind, updateLoading} = useGlobalSelector(state => state.hallReducer);

	const [form, setForm] = useState<HallFormValues>(EMPTY_HALL_FORM);
	const [baselineForm, setBaselineForm] = useState<HallFormValues>(EMPTY_HALL_FORM);
	const [clientErrors, setClientErrors] = useState<HallFormFieldErrors>({});
	const [serverFieldErrors, setServerFieldErrors] = useState<HallFormFieldErrors>({});
	const [formBanner, setFormBanner] = useState<string | null>(null);
	const [pageSuccess, setPageSuccess] = useState<string | null>(null);
	const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
	const formCardRef = useRef<HTMLDivElement>(null);
	const loadedDetailIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!hallId) return;
		void dispatch(fetchHallDetail(hallId));
		return () => {
			dispatch(hallActions.clearHallDetail());
		};
	}, [dispatch, hallId]);

	useEffect(() => {
		if (detailErrorKind === "unauthorized") {
			void dispatch(logoutUser());
		}
		if (detailErrorKind === "notFound") {
			if (branchId) {
				navigate(`/gyms/${branchId}`, {replace: true});
			} else {
				navigate("/gyms", {replace: true});
			}
		}
	}, [detailErrorKind, dispatch, navigate, branchId]);

	useEffect(() => {
		if (!detail) return;
		if (branchId && String(detail.branch_id) !== branchId) {
			navigate(`/gyms/${detail.branch_id}/halls/${detail.id}`, {replace: true});
		}
		const isNewHall = loadedDetailIdRef.current !== detail.id;
		loadedDetailIdRef.current = detail.id;
		const values = hallResponseToFormValues(detail);
		setForm(values);
		setBaselineForm(values);
		if (isNewHall) {
			setClientErrors({});
			setServerFieldErrors({});
			setFormBanner(null);
			setPageSuccess(null);
		}
	}, [detail, branchId, navigate]);

	const displayName = detail?.name ?? "Спортзал";
	const branchName = detail?.branch_name?.trim() || "Филиал";
	const branchAddress = detail?.branch_address?.trim() || "—";

	const subline = useMemo(() => {
		if (!detail) return "";
		return formatHallDetailSummary(detail.capacity, detail.subtitle);
	}, [detail]);

	useEffect(() => {
		setMobileTitleOverride(displayName);
		setCrumbTrail([
			{label: "Филиалы", href: "/gyms"},
			{label: branchName, href: branchId ? `/gyms/${branchId}` : "/gyms"},
			{label: displayName}
		]);
		return () => {
			setMobileTitleOverride(null);
			setCrumbTrail(null);
		};
	}, [branchId, branchName, displayName, setCrumbTrail, setMobileTitleOverride]);

	const isDirty = useMemo(() => isHallFormDirty(form, baselineForm), [form, baselineForm]);

	const fieldError = (field: HallFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors[field];

	const focusFirstInvalidField = (errors: HallFormFieldErrors) => {
		const names = HALL_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(formCardRef.current, names);
	};

	const onFieldChange = (key: keyof HallFormValues, value: string) => {
		setForm(prev => updateHallFormValue(prev, key, value));
		setClientErrors(prev => clearHallFieldErrorsOnChange(prev, key));
		setServerFieldErrors(prev => clearHallFieldErrorsOnChange(prev, key));
		setFormBanner(null);
		setPageSuccess(null);
	};

	const runPut = async (body: PutHallV1Request, mode: SubmitMode) => {
		if (!hallId) return;
		setSubmitMode(mode);
		setFormBanner(null);
		setServerFieldErrors({});
		try {
			const updated = await dispatch(putHallV1({id: hallId, body})).unwrap();
			setBaselineForm(hallResponseToFormValues(updated));
			setForm(hallResponseToFormValues(updated));
			setPageSuccess(
				mode === "status"
					? body.activity_status === "inactive"
						? STATUS_INACTIVE_SUCCESS
						: STATUS_ACTIVE_SUCCESS
					: SAVE_SUCCESS
			);
			setClientErrors({});
		} catch (error) {
			const failure = toApiFailure(error);
			if (failure.kind === "unauthorized") {
				void dispatch(logoutUser());
				return;
			}
			if (failure.kind === "notFound") {
				if (branchId) {
					navigate(`/gyms/${branchId}`, {replace: true});
				} else {
					navigate("/gyms", {replace: true});
				}
				return;
			}
			if (failure.kind === "forbidden") {
				setFormBanner("Доступ только для администратора клуба.");
				return;
			}
			if (failure.kind === "conflict") {
				setFormBanner(HALL_NAME_CONFLICT_BANNER);
				setServerFieldErrors({name: HALL_NAME_CONFLICT_FIELD});
				focusFirstFieldByName(formCardRef.current, ["name"]);
				return;
			}
			if (failure.kind === "request") {
				const revalidate = validateHallForm(form);
				if (!revalidate.ok) {
					setClientErrors(revalidate.errors);
					setFormBanner(DETAIL_VALIDATION_BANNER);
					focusFirstInvalidField(revalidate.errors);
					return;
				}
				const serverMsg = failure.message?.toLowerCase() ?? "";
				if (serverMsg.includes("cannot activate hall while branch is inactive")) {
					setFormBanner(ACTIVATE_BLOCKED_BANNER);
					return;
				}
				if (failure.message && failure.message !== "hall validation failed") {
					setFormBanner(failure.message);
					return;
				}
				setFormBanner(GENERIC_REQUEST_BANNER);
				return;
			}
			setFormBanner(NETWORK_SAVE_BANNER);
		} finally {
			setSubmitMode(null);
		}
	};

	const handleSave = (event: FormEvent) => {
		event.preventDefault();
		if (updateLoading || !detail || !isDirty) return;
		const result = validateHallForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const body = hallFormToPutBody(form, detail.activity_status);
		if (!body) {
			setFormBanner(DETAIL_VALIDATION_BANNER);
			return;
		}
		void runPut(body, "save");
	};

	const handleToggleActivity = () => {
		if (updateLoading || !detail) return;
		const branchActive = detail.branch_activity_status !== "inactive";
		const hallActive = detail.activity_status === "active";
		if (!hallActive && !branchActive) {
			setFormBanner(ACTIVATE_BLOCKED_BANNER);
			return;
		}
		const snapshot = isDirty ? form : baselineForm;
		const result = validateHallForm(snapshot);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const nextStatus = detail.activity_status === "active" ? "inactive" : "active";
		const body = hallFormToPutBody(snapshot, nextStatus);
		if (!body) {
			setFormBanner(DETAIL_VALIDATION_BANNER);
			return;
		}
		void runPut(body, "status");
	};

	if (!hallId) {
		return null;
	}

	const branchBackHref = branchId
		? `/gyms/${branchId}`
		: detail
			? `/gyms/${detail.branch_id}`
			: "/gyms";

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
						<p className="page-head__eyebrow">Карточка спортзала</p>
						<h1>Спортзал</h1>
					</div>
					<div className="page-head__actions">
						<Link className="btn" to={branchBackHref}>
							← К филиалу
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
					<button type="button" className="btn btn--link" onClick={() => void dispatch(fetchHallDetail(hallId))}>
						Повторить
					</button>
				</p>
			);
		}
		return null;
	}

	const status = activityStatusLabel(detail.activity_status);
	const isActive = detail.activity_status === "active";
	const branchActive = detail.branch_activity_status !== "inactive";
	const canActivateHall = branchActive || isActive;
	const toggleLabel = isActive ? "Сделать неактивным" : "Вернуть в активные";
	const submitting = updateLoading;
	const saveLabel = submitMode === "save" && submitting ? "Сохранение…" : "Сохранить";
	const toggleButtonLabel = submitMode === "status" && submitting ? "Выполняется…" : toggleLabel;
	const statusBadgeId = "hall-detail-status-badge";

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Карточка спортзала</p>
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
					<Link className="btn" to={branchBackHref}>
						← К филиалу
					</Link>
					<button
						type="button"
						className="btn"
						disabled={submitting || (!isActive && !canActivateHall)}
						title={!isActive && !canActivateHall ? ACTIVATE_BLOCKED_BANNER : undefined}
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
						form="hallDetailForm"
						disabled={submitting || !isDirty}
						aria-busy={submitMode === "save" && submitting ? true : undefined}
					>
						{saveLabel}
					</button>
				</div>
			</header>

			{pageSuccess ? (
				<p className="academy-alert academy-alert--success branches-detail__page-message" role="status">
					{pageSuccess}
				</p>
			) : null}

			<div className="halls-detail__context" aria-labelledby="hall-context-title">
				<h2 className="halls-detail__context-title" id="hall-context-title">
					Филиал
				</h2>
				{!branchActive ? (
					<p className="academy-alert academy-alert--warning branches-detail__form-banner" role="status">
						{ACTIVATE_BLOCKED_BANNER} Данные зала при этом можно менять и сохранять.
					</p>
				) : null}
				<p className="halls-detail__context-branch">
					Филиал: <strong>{branchName}</strong>
				</p>
				<TextField
					useDesignKit
					id="branch-address"
					name="branch_address"
					label="Адрес филиала"
					value={branchAddress}
					readOnly
					onChange={() => undefined}
				/>
			</div>

			<div className="branches-detail__card" ref={formCardRef}>
				{formBanner ? (
					<p className="academy-alert academy-alert--error branches-detail__form-banner" role="alert">
						{formBanner}
					</p>
				) : null}
				<DesignForm id="hallDetailForm" className="branches-detail__form" onSubmit={handleSave}>
					<HallFormFields
						form={form}
						fieldError={fieldError}
						onFieldChange={onFieldChange}
						idPrefix="hall-detail"
						sectionHeading="h2"
						noteAsTextarea
						showCapacityHint
						fieldsDisabled={submitting}
					/>
				</DesignForm>
			</div>
		</>
	);
};

export default HallDetailPage;
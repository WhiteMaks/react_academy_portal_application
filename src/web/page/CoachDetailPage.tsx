import React, {FC, FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import PutCoachV1Request from "../../api/models/coach/PutCoachV1Request";
import {toApiFailure} from "../../api/ApiError";
import {coachActions, fetchCoachDetail, putCoachV1} from "../../data/state/coach/CoachReducer";
import {activityStatusLabel, formatAgeRu, formatDateRu, formatPersonName} from "../util/athleteDisplay";
import {useShellChrome} from "../component/app_shell/ShellChromeContext";
import {logoutUser} from "../../data/state/user/UserTokenReducer";
import DesignForm from "../component/common/design_form/DesignForm";
import {focusFirstFieldByName} from "../component/common/design_form/formContract";
import CoachFormFields from "../component/coach/CoachFormFields";
import {coachResponseToFormValues, isCoachFormDirty} from "../component/coach/coachFormFromResponse";
import {
	COACH_FIELD_FOCUS_ORDER,
	CoachFormField,
	CoachFormFieldErrors,
	CoachFormValues,
	EMPTY_COACH_FORM
} from "../component/coach/coachFormTypes";
import {clearCoachFieldErrorsOnChange, updateCoachFormValue} from "../component/coach/coachFormFieldUtils";
import {validateCoachForm} from "../component/coach/coachFormValidate";

const DETAIL_VALIDATION_BANNER = "Проверьте выделенные поля и исправьте ошибки.";
const PHONE_CONFLICT_BANNER = "Тренер с таким телефоном уже есть в базе";
const PHONE_CONFLICT_FIELD = "Этот номер уже используется другим тренером";
const NETWORK_SAVE_BANNER = "Не удалось сохранить. Проверьте сеть и повторите попытку.";
const DETAIL_LOAD_ERROR = "Не удалось загрузить карточку. Проверьте подключение и попробуйте снова.";
const SAVE_SUCCESS = "Изменения сохранены.";
const STATUS_INACTIVE_SUCCESS = "Статус обновлён. Тренер отмечен как неактивный.";
const STATUS_ACTIVE_SUCCESS = "Статус обновлён. Тренер снова в активных.";

type SubmitMode = "save" | "status" | null;

const CoachDetailPage: FC = () => {
	const {id} = useParams<{id: string}>();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const {detail, detailLoading, detailErrorKind, updateLoading} = useGlobalSelector(state => state.coachReducer);

	const [form, setForm] = useState<CoachFormValues>(EMPTY_COACH_FORM);
	const [baselineForm, setBaselineForm] = useState<CoachFormValues>(EMPTY_COACH_FORM);
	const [clientErrors, setClientErrors] = useState<CoachFormFieldErrors>({});
	const [serverFieldErrors, setServerFieldErrors] = useState<CoachFormFieldErrors>({});
	const [formBanner, setFormBanner] = useState<string | null>(null);
	const [pageSuccess, setPageSuccess] = useState<string | null>(null);
	const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
	const formCardRef = useRef<HTMLDivElement>(null);
	const loadedDetailIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!id) return;
		void dispatch(fetchCoachDetail(id));
		return () => {
			dispatch(coachActions.clearCoachDetail());
		};
	}, [dispatch, id]);

	useEffect(() => {
		if (detailErrorKind === "unauthorized") {
			void dispatch(logoutUser());
		}
		if (detailErrorKind === "notFound") {
			navigate("/coaches", {replace: true});
		}
	}, [detailErrorKind, dispatch, navigate]);

	useEffect(() => {
		if (!detail) return;
		const isNewCoach = loadedDetailIdRef.current !== detail.id;
		loadedDetailIdRef.current = detail.id;
		const values = coachResponseToFormValues(detail);
		setForm(values);
		setBaselineForm(values);
		if (isNewCoach) {
			setClientErrors({});
			setServerFieldErrors({});
			setFormBanner(null);
			setPageSuccess(null);
		}
	}, [detail]);

	const displayName = useMemo(() => {
		if (!detail) return "Тренер";
		return formatPersonName(detail.first_name, detail.last_name, detail.patronymic);
	}, [detail]);

	const subline = useMemo(() => {
		if (!detail) return "";
		return `${formatAgeRu(detail.birth_date)} · дата рождения ${formatDateRu(detail.birth_date)} · ${detail.specialization} · телефон ${detail.phone}`;
	}, [detail]);

	useEffect(() => {
		setMobileTitleOverride(displayName);
		setCrumbTrail([
			{label: "Тренеры", href: "/coaches"},
			{label: displayName}
		]);
		return () => {
			setMobileTitleOverride(null);
			setCrumbTrail(null);
		};
	}, [displayName, setCrumbTrail, setMobileTitleOverride]);

	const isDirty = useMemo(() => isCoachFormDirty(form, baselineForm), [form, baselineForm]);

	const fieldError = (field: CoachFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors[field];

	const focusFirstInvalidField = (errors: CoachFormFieldErrors) => {
		const names = COACH_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(formCardRef.current, names);
	};

	const onFieldChange = (key: keyof CoachFormValues, value: string) => {
		setForm(prev => updateCoachFormValue(prev, key, value));
		setClientErrors(prev => clearCoachFieldErrorsOnChange(prev, key));
		setServerFieldErrors(prev => clearCoachFieldErrorsOnChange(prev, key));
		setFormBanner(null);
		setPageSuccess(null);
		if (key === "phone") {
			setServerFieldErrors(prev => {
				const next = {...prev};
				delete next.phone;
				return next;
			});
		}
	};

	const runPut = async (body: PutCoachV1Request, mode: SubmitMode) => {
		if (!id) return;
		setSubmitMode(mode);
		setFormBanner(null);
		setServerFieldErrors({});
		try {
			const updated = await dispatch(putCoachV1({id, body})).unwrap();
			setBaselineForm(coachResponseToFormValues(updated));
			setForm(coachResponseToFormValues(updated));
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
				navigate("/coaches", {replace: true});
				return;
			}
			if (failure.kind === "forbidden") {
				setFormBanner("Доступ только для администратора клуба.");
				return;
			}
			if (failure.kind === "conflict") {
				setFormBanner(PHONE_CONFLICT_BANNER);
				setServerFieldErrors({phone: PHONE_CONFLICT_FIELD});
				focusFirstFieldByName(formCardRef.current, ["phone"]);
				return;
			}
			if (failure.kind === "request") {
				const revalidate = validateCoachForm(form);
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
		}
	};

	const handleSave = (event: FormEvent) => {
		event.preventDefault();
		if (updateLoading || !detail || !isDirty) return;
		const result = validateCoachForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const body: PutCoachV1Request = {
			...result.body,
			activity_status: detail.activity_status
		};
		void runPut(body, "save");
	};

	const handleToggleActivity = () => {
		if (updateLoading || !detail) return;
		const result = validateCoachForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormBanner(DETAIL_VALIDATION_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		const nextStatus = detail.activity_status === "active" ? "inactive" : "active";
		const body: PutCoachV1Request = {
			...result.body,
			activity_status: nextStatus
		};
		void runPut(body, "status");
	};

	if (!id) {
		return null;
	}

	if (detailErrorKind === "forbidden" && !detail && !detailLoading) {
		return (
			<p className="academy-alert academy-alert--error coaches-detail__page-message" role="alert">
				Доступ только для администратора клуба.
			</p>
		);
	}

	if (detailLoading && !detail) {
		return (
			<>
				<header className="page-head">
					<div>
						<h1>
							Тренер{" "}
							<span className="data-table__status data-table__status--active">Активен</span>
						</h1>
					</div>
					<div className="page-head__actions">
						<Link className="btn" to="/coaches">
							← К списку
						</Link>
					</div>
				</header>
				<div className="coaches-detail__card coaches-detail__card--loading">
					<div className="coaches-detail__loading" role="status" aria-live="polite">
						<div className="data-table__spinner" aria-hidden="true"/>
						<p className="coaches-detail__loading-text">Загрузка карточки…</p>
					</div>
					<div className="coaches-detail__form" aria-hidden="true">
						<div className="coaches-detail__skeleton-grid">
							<div className="coaches-detail__skeleton-col">
								<span className="coaches-detail__skeleton-label"/>
								<span className="coaches-detail__skeleton-input"/>
								<span className="coaches-detail__skeleton-label"/>
								<span className="coaches-detail__skeleton-input"/>
							</div>
							<div className="coaches-detail__skeleton-col">
								<span className="coaches-detail__skeleton-label"/>
								<span className="coaches-detail__skeleton-input"/>
								<span className="coaches-detail__skeleton-label"/>
								<span className="coaches-detail__skeleton-input"/>
							</div>
						</div>
						<span className="coaches-detail__skeleton-input coaches-detail__skeleton-input--wide coaches-detail__skeleton-note"/>
					</div>
				</div>
			</>
		);
	}

	if (!detail) {
		if (detailErrorKind === "service" || detailErrorKind === "request") {
			return (
				<p className="academy-alert academy-alert--error coaches-detail__page-message" role="alert">
					{DETAIL_LOAD_ERROR}{" "}
					<button type="button" className="btn btn--link" onClick={() => id && void dispatch(fetchCoachDetail(id))}>
						Повторить
					</button>
				</p>
			);
		}
		return null;
	}

	const status = activityStatusLabel(detail.activity_status);
	const isActive = detail.activity_status === "active";
	const toggleLabel = isActive ? "Сделать неактивным" : "Вернуть в активные";
	const toggleAria = toggleLabel;
	const submitting = updateLoading;
	const saveLabel = submitMode === "save" && submitting ? "Сохранение…" : "Сохранить";
	const toggleButtonLabel =
		submitMode === "status" && submitting ? "Выполняется…" : toggleLabel;
	const statusBadgeId = "coach-detail-status-badge";

	const formInfoBanner =
		submitMode === "save" && submitting
			? "Сохранение изменений…"
			: submitMode === "status" && submitting
				? "Меняем статус…"
				: null;
	const hideFormWhileStatusSubmit = submitMode === "status" && submitting;

	return (
		<>
			<header className="page-head">
				<div>
					<p className="page-head__eyebrow">Карточка тренера</p>
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
					<Link className="btn" to="/coaches">
						← К списку
					</Link>
					<button
						type="button"
						className="btn"
						disabled={submitting}
						aria-label={toggleAria}
						aria-describedby={statusBadgeId}
						aria-busy={submitMode === "status" && submitting ? true : undefined}
						onClick={handleToggleActivity}
					>
						{toggleButtonLabel}
					</button>
					<button
						type="submit"
						className="btn btn--primary"
						form="coachDetailForm"
						disabled={submitting || !isDirty}
						aria-busy={submitMode === "save" && submitting ? true : undefined}
					>
						{saveLabel}
					</button>
				</div>
			</header>

			{pageSuccess ? (
				<p className="academy-alert academy-alert--success coaches-detail__page-message" role="status">
					{pageSuccess}
				</p>
			) : null}

			<div className="coaches-detail__card" ref={formCardRef}>
				{formInfoBanner ? (
					<p className="academy-alert academy-alert--info coaches-detail__form-banner" role="status">
						{formInfoBanner}
					</p>
				) : null}
				{!hideFormWhileStatusSubmit && formBanner ? (
					<p className="academy-alert academy-alert--error coaches-detail__form-banner" role="alert">
						{formBanner}
					</p>
				) : null}
				{!hideFormWhileStatusSubmit ? (
					<DesignForm
						id="coachDetailForm"
						className="coaches-detail__form"
						onSubmit={handleSave}
					>
						<CoachFormFields
							form={form}
							fieldError={fieldError}
							onFieldChange={onFieldChange}
							idPrefix="coach-detail"
							sectionHeading="h2"
							noteAsTextarea
							fieldsDisabled={submitMode === "save" && submitting}
						/>
					</DesignForm>
				) : null}
			</div>
		</>
	);
};

export default CoachDetailPage;
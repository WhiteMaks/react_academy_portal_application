import React, {FC, FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import PutAthleteV1Request from "../../api/models/athlete/PutAthleteV1Request";
import {toApiFailure} from "../../api/ApiError";
import {athleteActions, fetchAthleteDetail, putAthleteV1} from "../../data/state/athlete/AthleteReducer";
import {
	activityStatusLabel,
	formatAgeRu,
	formatDateRu,
	formatPersonName
} from "../util/athleteDisplay";
import {useShellChrome} from "../component/app_shell/ShellChromeContext";
import {logoutUser} from "../../data/state/user/UserTokenReducer";
import DesignForm from "../component/common/design_form/DesignForm";
import {focusFirstFieldByName} from "../component/common/design_form/formContract";
import AthleteFormFields from "../component/athlete/AthleteFormFields";
import {athleteResponseToFormValues} from "../component/athlete/athleteFormFromResponse";
import {
	ATHLETE_FIELD_FOCUS_ORDER,
	AthleteFormField,
	AthleteFormFieldErrors,
	AthleteFormValues,
	EMPTY_ATHLETE_FORM
} from "../component/athlete/athleteFormTypes";
import {clearAthleteFieldErrorsOnChange, updateAthleteFormValue} from "../component/athlete/athleteFormFieldUtils";
import {validateAthleteForm} from "../component/athlete/athleteFormValidate";

const DETAIL_VALIDATION_BANNER = "Проверьте выделенные поля и исправьте ошибки.";
const PHONE_CONFLICT_BANNER = "Спортсмен с таким телефоном уже есть в базе";
const PHONE_CONFLICT_FIELD = "Этот номер уже используется другим спортсменом";
const NETWORK_SAVE_BANNER = "Не удалось сохранить. Проверьте сеть и повторите попытку.";
const DETAIL_LOAD_ERROR = "Не удалось загрузить карточку. Проверьте подключение и попробуйте снова.";
const SAVE_SUCCESS = "Изменения сохранены.";
const STATUS_INACTIVE_SUCCESS = "Статус обновлён. Спортсмен отмечен как неактивный.";
const STATUS_ACTIVE_SUCCESS = "Статус обновлён. Спортсмен снова в активных.";

type SubmitMode = "save" | "status" | null;

const AthleteDetailPage: FC = () => {
	const {id} = useParams<{id: string}>();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {setMobileTitleOverride, setCrumbTrail} = useShellChrome();
	const {detail, detailLoading, detailErrorKind, updateLoading} = useGlobalSelector(state => state.athleteReducer);

	const [form, setForm] = useState<AthleteFormValues>(EMPTY_ATHLETE_FORM);
	const [clientErrors, setClientErrors] = useState<AthleteFormFieldErrors>({});
	const [serverFieldErrors, setServerFieldErrors] = useState<AthleteFormFieldErrors>({});
	const [formBanner, setFormBanner] = useState<string | null>(null);
	const [pageSuccess, setPageSuccess] = useState<string | null>(null);
	const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
	const formCardRef = useRef<HTMLDivElement>(null);
	const loadedDetailIdRef = useRef<number | null>(null);

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

	useEffect(() => {
		if (!detail) return;
		const isNewAthlete = loadedDetailIdRef.current !== detail.id;
		loadedDetailIdRef.current = detail.id;
		setForm(athleteResponseToFormValues(detail));
		if (isNewAthlete) {
			setClientErrors({});
			setServerFieldErrors({});
			setFormBanner(null);
			setPageSuccess(null);
		}
	}, [detail]);

	const displayName = useMemo(() => {
		if (!detail) return "Спортсмен";
		return formatPersonName(detail.first_name, detail.last_name, detail.patronymic);
	}, [detail]);

	const subline = useMemo(() => {
		if (!detail) return "";
		return `${formatAgeRu(detail.birth_date)} · дата рождения ${formatDateRu(detail.birth_date)} · телефон ${detail.phone}`;
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

	const fieldError = (field: AthleteFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors[field];

	const focusFirstInvalidField = (errors: AthleteFormFieldErrors) => {
		const names = ATHLETE_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(formCardRef.current, names);
	};

	const onFieldChange = (key: keyof AthleteFormValues, value: string) => {
		setForm(prev => updateAthleteFormValue(prev, key, value));
		setClientErrors(prev => clearAthleteFieldErrorsOnChange(prev, key));
		setServerFieldErrors(prev => clearAthleteFieldErrorsOnChange(prev, key));
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

	const runPut = async (body: PutAthleteV1Request, mode: SubmitMode) => {
		if (!id) return;
		setSubmitMode(mode);
		setFormBanner(null);
		setServerFieldErrors({});
		try {
			await dispatch(putAthleteV1({id, body})).unwrap();
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
				navigate("/athletes", {replace: true});
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
				const revalidate = validateAthleteForm(form);
				if (!revalidate.ok) {
					setClientErrors(revalidate.errors);
					if (revalidate.errors.parent_block) {
						setFormBanner(revalidate.errors.parent_block);
					} else {
						setFormBanner(DETAIL_VALIDATION_BANNER);
					}
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
		if (updateLoading || !detail) return;
		const result = validateAthleteForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			if (result.errors.parent_block) {
				setFormBanner(result.errors.parent_block);
			} else {
				setFormBanner(DETAIL_VALIDATION_BANNER);
			}
			focusFirstInvalidField(result.errors);
			return;
		}
		const body: PutAthleteV1Request = {
			...result.body,
			activity_status: detail.activity_status
		};
		void runPut(body, "save");
	};

	const handleToggleActivity = () => {
		if (updateLoading || !detail) return;
		const result = validateAthleteForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			if (result.errors.parent_block) {
				setFormBanner(result.errors.parent_block);
			} else {
				setFormBanner(DETAIL_VALIDATION_BANNER);
			}
			focusFirstInvalidField(result.errors);
			return;
		}
		const nextStatus = detail.activity_status === "active" ? "inactive" : "active";
		const body: PutAthleteV1Request = {
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
			<p className="academy-alert academy-alert--error athletes-detail__page-message" role="alert">
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
							Спортсмен{" "}
							<span className="data-table__status data-table__status--active">Активен</span>
						</h1>
					</div>
					<div className="page-head__actions">
						<Link className="btn" to="/athletes">
							← К списку
						</Link>
					</div>
				</header>
				<div className="athletes-detail__card athletes-detail__card--loading">
					<div className="athletes-detail__loading" role="status" aria-live="polite">
						<div className="data-table__spinner" aria-hidden="true"/>
						<p className="athletes-detail__loading-text">Загрузка карточки…</p>
					</div>
					<div className="athletes-detail__form" aria-hidden="true">
						<div className="athletes-detail__skeleton-grid">
							<div className="athletes-detail__skeleton-col">
								<span className="athletes-detail__skeleton-label"/>
								<span className="athletes-detail__skeleton-input"/>
								<span className="athletes-detail__skeleton-label"/>
								<span className="athletes-detail__skeleton-input"/>
							</div>
							<div className="athletes-detail__skeleton-col">
								<span className="athletes-detail__skeleton-label"/>
								<span className="athletes-detail__skeleton-input"/>
								<span className="athletes-detail__skeleton-label"/>
								<span className="athletes-detail__skeleton-input"/>
							</div>
						</div>
						<span className="athletes-detail__skeleton-input athletes-detail__skeleton-input--wide athletes-detail__skeleton-note"/>
					</div>
				</div>
			</>
		);
	}

	if (!detail) {
		if (detailErrorKind === "service" || detailErrorKind === "request") {
			return (
				<p className="academy-alert academy-alert--error athletes-detail__page-message" role="alert">
					{DETAIL_LOAD_ERROR}
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
	const statusBadgeId = "athlete-detail-status-badge";

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
					<p className="page-head__eyebrow">Карточка спортсмена</p>
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
					<Link className="btn" to="/athletes">
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
						form="athleteDetailForm"
						disabled={submitting}
						aria-busy={submitMode === "save" && submitting ? true : undefined}
					>
						{saveLabel}
					</button>
				</div>
			</header>

			{pageSuccess ? (
				<p className="academy-alert academy-alert--success athletes-detail__page-message" role="status">
					{pageSuccess}
				</p>
			) : null}

			<div className="athletes-detail__card" ref={formCardRef}>
				{formInfoBanner ? (
					<p className="academy-alert academy-alert--info athletes-detail__form-banner" role="status">
						{formInfoBanner}
					</p>
				) : null}
				{!hideFormWhileStatusSubmit && formBanner ? (
					<p className="academy-alert academy-alert--error athletes-detail__form-banner" role="alert">
						{formBanner}
					</p>
				) : null}
				{!hideFormWhileStatusSubmit ? (
					<DesignForm
						id="athleteDetailForm"
						className="athletes-detail__form"
						onSubmit={handleSave}
					>
						<AthleteFormFields
							form={form}
							fieldError={fieldError}
							onFieldChange={onFieldChange}
							idPrefix="athlete-detail"
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

export default AthleteDetailPage;
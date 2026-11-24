import React, {ChangeEvent, FC, FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Link, useBlocker, useNavigate, useParams} from "react-router-dom";
import {createPortal} from "react-dom";
import AthleteV1Response from "../../api/models/athlete/AthleteV1Response";
import PutAthleteV1Request from "../../api/models/athlete/PutAthleteV1Request";
import {formatBirthDateDmy, formatBirthDateDisplayInput, parseBirthDateDisplayInput} from "../../api/models/athlete/birthDate";
import {athleteActions, fetchAthlete, updateAthlete} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import AthleteStatusBadge from "../component/athlete_status_badge/AthleteStatusBadge";
import Button from "../component/common/button/Button";
import ButtonLink from "../component/common/button/ButtonLink";
import FormMessage from "../component/common/form_message/FormMessage";
import TextField from "../component/common/text_field/TextField";
import style from "./AthletesPage.module.css";

interface Props { editing?: boolean; }
interface Values {
	secondName: string; firstName: string; middleName: string; birthDate: string; phone: string;
	parentSecondName: string; parentFirstName: string; parentMiddleName: string; parentPhone: string;
}
type FieldName = keyof Values;
type FieldErrors = Partial<Record<FieldName, string>>;
const phoneFields: readonly FieldName[] = ["phone", "parentPhone"];
const phonePattern = /^\+[1-9]\d{9,14}$/;
const emptyValues: Values = {secondName: "", firstName: "", middleName: "", birthDate: "", phone: "", parentSecondName: "", parentFirstName: "", parentMiddleName: "", parentPhone: ""};
const fromProfile = (profile: AthleteV1Response): Values => ({
	secondName: profile.secondName, firstName: profile.firstName, middleName: profile.middleName ?? "",
	birthDate: formatBirthDateDmy(profile.birthDate) ?? "",
	phone: profile.phone ?? "", parentSecondName: profile.parentSecondName ?? "", parentFirstName: profile.parentFirstName ?? "",
	parentMiddleName: profile.parentMiddleName ?? "", parentPhone: profile.parentPhone ?? ""
});
const optional = (value: string): string | null => value.trim() || null;
const fullName = (profile: AthleteV1Response) => [profile.firstName, profile.middleName, profile.secondName].filter(Boolean).join(" ");
const shortName = (profile: AthleteV1Response) => [profile.firstName, profile.secondName].filter(Boolean).join(" ");
const parentName = (profile: AthleteV1Response) => [profile.parentFirstName, profile.parentMiddleName, profile.parentSecondName].filter(Boolean).join(" ");
const isValidAthleteId = (id: string) => {
	if (!/^[1-9]\d*$/.test(id)) return false;
	return id.length < 19 || (id.length === 19 && id <= "9223372036854775807");
};

const AthleteProfilePage: FC<Props> = ({editing = false}) => {
	const {id = ""} = useParams();
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const sessionVersion = useGlobalSelector(state => state.userTokenReducer.sessionVersion);
	const detail = useGlobalSelector(state => state.athleteReducer);
	const profileId = detail.profileId;
	const profileLoaded = detail.profileLoaded;
	const profile = detail.profileId === id ? detail.profile : null;
	const [values, setValues] = useState<Values>(emptyValues);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [initialized, setInitialized] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const bypassBlockerRef = useRef(false);
	const isDirty = useMemo(() => Boolean(profile && JSON.stringify(values) !== JSON.stringify(fromProfile(profile))), [profile, values]);
	const hasUnsavedChanges = editing && initialized && isDirty;
	const blocker = useBlocker(({currentLocation, nextLocation}) =>
		hasUnsavedChanges && !bypassBlockerRef.current &&
		(currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search || currentLocation.hash !== nextLocation.hash)
	);
	const blockerRef = useRef(blocker);
	blockerRef.current = blocker;
	const confirmDiscard = blocker.state === "blocked";
	const activeDialog = confirmDiscard;

	useEffect(() => {
		setInitialized(false);
		if (!isValidAthleteId(id)) return;
		if (!profileLoaded || profileId !== id) dispatch(fetchAthlete({id, sessionVersion}));
	}, [dispatch, id, profileId, profileLoaded, sessionVersion]);

	useEffect(() => {
		// A success screen belongs to one completed edit flow. Clear it and re-arm
		// the navigation guard whenever the route enters a different athlete/mode.
		setSaveSuccess(false);
		bypassBlockerRef.current = false;
	}, [id, editing]);

	useEffect(() => {
		if (profile && !initialized) {
			setValues(fromProfile(profile));
			setErrors({});
			setInitialized(true);
		}
	}, [initialized, profile]);

	useEffect(() => {
		if (!hasUnsavedChanges) return;
		const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [hasUnsavedChanges]);

	useEffect(() => {
		if (!activeDialog) return;
		const appRoot = document.getElementById("root");
		const priorInert = appRoot?.inert ?? false;
		if (appRoot) appRoot.inert = true;
		previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const focusTimer = window.requestAnimationFrame(() => {
			const firstControl = dialogRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
			(firstControl ?? dialogRef.current)?.focus();
		});
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (confirmDiscard) blockerRef.current.reset?.();
				else return;
				return;
			}
			if (event.key !== "Tab") return;
			const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
			if (!controls.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
			const first = controls[0];
			const last = controls[controls.length - 1];
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
			else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			window.cancelAnimationFrame(focusTimer);
			document.removeEventListener("keydown", onKeyDown);
			if (appRoot) appRoot.inert = priorInert;
			if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
		};
	}, [activeDialog, confirmDiscard]);

	const change = (field: FieldName) => (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		let value = input.value;
		if (field === "birthDate") {
			const digitsBeforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
			value = formatBirthDateDisplayInput(input.value);
			setValues(current => ({...current, [field]: value}));
			const cursor = digitsBeforeCursor + Number(digitsBeforeCursor > 2) + Number(digitsBeforeCursor > 4);
			window.requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
		} else {
			value = phoneFields.includes(field) ? `${input.value.startsWith("+") ? "+" : ""}${input.value.replace(/\D/g, "")}`.slice(0, 16) : input.value;
			setValues(current => ({...current, [field]: value}));
		}
		setErrors(current => {
			const next = {...current};
			if (field === "birthDate" && value.length === 10 && !parseBirthDateDisplayInput(value)) next.birthDate = "Проверьте дату.";
			else delete next[field];
			return next;
		});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!profile || detail.profileSaving) return;
		const nextErrors: FieldErrors = {};
		if (!values.secondName.trim()) nextErrors.secondName = "Укажите фамилию.";
		if (!values.firstName.trim()) nextErrors.firstName = "Укажите имя.";
		if (!parseBirthDateDisplayInput(values.birthDate)) nextErrors.birthDate = "Проверьте дату.";
		for (const key of ["secondName", "firstName", "middleName", "parentSecondName", "parentFirstName", "parentMiddleName"] as const) {
			if (Array.from(values[key].trim()).length > 100) nextErrors[key] = "Не более 100 символов.";
		}
		if (values.phone && !phonePattern.test(values.phone)) nextErrors.phone = "Формат: + и 10–15 цифр без пробелов, например +79991234567.";
		if (values.parentPhone && !phonePattern.test(values.parentPhone)) nextErrors.parentPhone = "Формат: + и 10–15 цифр без пробелов, например +79991234567.";
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length) return;
		const birthDate = parseBirthDateDisplayInput(values.birthDate);
		if (!birthDate) return;
		const request: PutAthleteV1Request = {
			secondName: values.secondName.trim(), firstName: values.firstName.trim(), middleName: optional(values.middleName), birthDate,
			phone: optional(values.phone), parentSecondName: optional(values.parentSecondName), parentFirstName: optional(values.parentFirstName),
			parentMiddleName: optional(values.parentMiddleName), parentPhone: optional(values.parentPhone)
		};
		try {
			const updated = await dispatch(updateAthlete({id, sessionVersion, request})).unwrap();
			setValues(fromProfile(updated));
			bypassBlockerRef.current = true;
			setSaveSuccess(true);
		} catch { /* Ошибка сохранения отображается из Redux-состояния; введённые значения остаются в форме. */ }
	};

	const discard = () => navigate(`/athletes/${id}`);
	const continueDiscardPrompt = () => {
		blockerRef.current.reset?.();
	};
	const confirmDiscardChanges = () => {
		dispatch(athleteActions.clearAthleteProfile());
		setValues(emptyValues);
		setInitialized(false);
		blockerRef.current.proceed?.();
	};
	const field = (name: FieldName, label: string, required = false, type: "text" | "tel" = "text") => {
		const errorId = `${name}-error`;
		const isDate = name === "birthDate";
		const isPhone = phoneFields.includes(name);
		return <div className={style.fieldWrap} key={name}>
			<TextField id={name} name={name} label={label} type={isDate ? "text" : type} value={values[name]} onChange={change(name)} required={required} autoComplete="off" inputMode={isDate ? "numeric" : isPhone ? "tel" : undefined} placeholder={isDate ? "ДД.ММ.ГГГГ" : isPhone ? "+79991234567" : undefined} maxLength={isDate ? 10 : isPhone ? 16 : undefined} pattern={isDate ? "\\d{2}\\.\\d{2}\\.\\d{4}" : isPhone ? "\\+[1-9][0-9]{9,14}" : undefined} invalid={Boolean(errors[name])} describedBy={errors[name] ? errorId : undefined}/>
			{errors[name] && <p className={style.fieldError} id={errorId}>{errors[name]}</p>}
		</div>;
	};

	if (!isValidAthleteId(id)) return <main className={style.page}><header className={style.formHeader}><Link className={style.backLink} to="/athletes"><svg className={style.backArrow} viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M11.5 4.5 6 10l5.5 5.5M6.5 10H17" /></svg><span>Спортсмены</span></Link><h1>Карточка спортсмена недоступна</h1></header><section className={style.statePanel}><FormMessage>Проверьте ссылку: указан неверный идентификатор карточки.</FormMessage><Link className={style.inlineLink} to="/athletes">Вернуться к списку спортсменов</Link></section></main>;
	if (!profile && (detail.profileLoading || detail.profileId !== id)) return <main className={style.page}><p className={style.state} role="status">Загружаем карточку спортсмена…</p></main>;
	if (!profile) {
		const kind = detail.profileErrorKind;
		const text = kind === "notFound" ? "Карточка спортсмена не найдена или больше недоступна." : kind === "unauthorized" ? "Сессия завершена. Войдите снова, чтобы открыть карточку." : kind === "forbidden" ? "У вашей учётной записи нет доступа к карточке спортсмена." : "Не удалось загрузить карточку. Проверьте соединение и повторите попытку.";
		return <main className={style.page}><header className={style.formHeader}><Link className={style.backLink} to="/athletes"><svg className={style.backArrow} viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M11.5 4.5 6 10l5.5 5.5M6.5 10H17" /></svg><span>Спортсмены</span></Link><h1>Карточка спортсмена</h1></header><section className={style.statePanel}><FormMessage>{text}</FormMessage>{kind !== "notFound" && <Button onClick={() => dispatch(fetchAthlete({id, sessionVersion}))}>Повторить</Button>}</section></main>;
	}
	if (editing && saveSuccess) return <main className={`${style.page} ${style.detailPage}`}>
		<section className={style.successPanel} role="status" aria-labelledby="save-success-title">
			<h1 id="save-success-title">Изменения сохранены</h1>
			<p>Данные спортсмена обновлены.</p>
			<ButtonLink to={`/athletes/${id}`}>К карточке спортсмена</ButtonLink>
		</section>
	</main>;

	if (!editing) return <main className={`${style.page} ${style.detailPage}`}>
		<header className={style.profileHeader}><nav className={style.breadcrumb} aria-label="Навигационная цепочка"><Link to="/athletes">Спортсмены</Link><span aria-hidden="true">/</span><span>{fullName(profile)}</span></nav><h1>{fullName(profile)}</h1><p>Карточка спортсмена</p></header>
		<section className={`${style.formCard} ${style.profileCard}`} aria-labelledby="athlete-heading"><div className={style.cardHeading}><h2 id="athlete-heading" className={style.profileSectionTitle}>Данные спортсмена</h2><AthleteStatusBadge active={profile.isActive}/></div><dl className={style.profileGrid}>
			<div><dt>Дата рождения</dt><dd>{formatBirthDateDmy(profile.birthDate) ?? "—"}</dd></div><div><dt>Телефон спортсмена</dt><dd>{profile.phone ?? "—"}</dd></div>
			<div><dt>Родитель</dt><dd>{parentName(profile) || "—"}</dd></div><div><dt>Телефон родителя</dt><dd>{profile.parentPhone ?? "—"}</dd></div>
		</dl></section>
		<div className={style.profileActions}><ButtonLink to={`/athletes/${id}/edit`}>Редактировать</ButtonLink></div>
	</main>

	return <>
	<main className={`${style.page} ${style.detailPage}`}>
		<header className={`${style.formHeader} ${style.detailFormHeader}`}><nav className={style.breadcrumb} aria-label="Навигационная цепочка"><Link to="/athletes">Спортсмены</Link><span aria-hidden="true">/</span><Link to={`/athletes/${id}`}>{shortName(profile)}</Link><span aria-hidden="true">/</span><span>Редактирование</span></nav><h1 className={style.editDesktopTitle}>Редактирование карточки</h1><h1 className={style.editMobileTitle}>Редактировать</h1><p className={style.editDesktopDescription}>Измените данные спортсмена и сохраните карточку</p><p className={style.editMobileDescription}>{shortName(profile)}</p></header>
		{detail.profileSaveErrorKind && <FormMessage id="profile-message">{detail.profileSaveErrorKind === "unauthorized" ? "Сессия завершена. Черновик остался в форме." : detail.profileSaveErrorKind === "forbidden" ? "Нет доступа для сохранения. Черновик остался в форме." : detail.profileSaveErrorKind === "notFound" ? "Карточка больше недоступна. Черновик остался в форме." : "Не удалось сохранить карточку. Данные остались в форме — повторите попытку."}</FormMessage>}
		<form className={`${style.formCard} ${style.detailForm}`} onSubmit={handleSubmit} noValidate>
			{Object.values(errors).some(Boolean) && <FormMessage>Проверьте отмеченные поля.</FormMessage>}
			<section className={style.group} aria-labelledby="edit-athlete-heading"><div className={style.nameFields}><h2 id="edit-athlete-heading">Спортсмен</h2>{field("secondName", "Фамилия", true)}{field("firstName", "Имя", true)}{field("middleName", "Отчество · необязательно")}</div><div className={style.contactFields}>{field("birthDate", "Дата рождения", true)}{field("phone", "Телефон спортсмена · необязательно", false, "tel")}</div></section>
			<section className={`${style.group} ${style.parentGroup}`} aria-labelledby="edit-parent-heading"><div className={style.nameFields}><h2 id="edit-parent-heading">Родитель</h2>{field("parentSecondName", "Фамилия родителя · необязательно")}{field("parentFirstName", "Имя родителя · необязательно")}{field("parentMiddleName", "Отчество родителя · необязательно")}</div><div className={style.contactFields}>{field("parentPhone", "Телефон родителя · необязательно", false, "tel")}</div></section>
			<div className={style.actions}><Button type="button" variant="text" onClick={discard}>Отмена</Button><Button type="submit" disabled={detail.profileSaving}>{detail.profileSaving ? "Сохранение…" : "Сохранить изменения"}</Button></div>
		</form>
	</main>
	{activeDialog && createPortal(
		<div className={style.confirmOverlay}>
			<div ref={dialogRef} className={style.confirmPanel} role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description" tabIndex={-1}>
				<h2 id="discard-title">Отменить изменения?</h2><p id="discard-description">Вы изменили данные карточки. Несохранённый ввод будет потерян.</p><div className={style.actions}><Button onClick={continueDiscardPrompt}>Продолжить редактирование</Button><Button variant="text" onClick={confirmDiscardChanges}>Отменить ввод</Button></div>
			</div>
		</div>, document.body
	)}
	</>;
};

export default AthleteProfilePage;

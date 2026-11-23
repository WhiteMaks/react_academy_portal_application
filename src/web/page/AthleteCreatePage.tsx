import React, {ChangeEvent, FC, FormEvent, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {createAthlete} from "../../data/state/athlete/AthleteReducer";
import {useGlobalDispatch, useGlobalSelector} from "../../data/state/store";
import PostAthleteV1Request from "../../api/models/athlete/PostAthleteV1Request";
import {formatBirthDateDisplayInput, parseBirthDateDisplayInput} from "../../api/models/athlete/birthDate";
import Button from "../component/common/button/Button";
import FormMessage from "../component/common/form_message/FormMessage";
import TextField from "../component/common/text_field/TextField";
import style from "./AthletesPage.module.css";

interface FormValues {
	secondName: string; firstName: string; middleName: string; birthDate: string; phone: string;
	parentSecondName: string; parentFirstName: string; parentMiddleName: string; parentPhone: string;
}

const emptyValues: FormValues = {
	secondName: "", firstName: "", middleName: "", birthDate: "", phone: "",
	parentSecondName: "", parentFirstName: "", parentMiddleName: "", parentPhone: ""
};

type FieldName = keyof FormValues;

const phoneFields: readonly FieldName[] = ["phone", "parentPhone"];
const phonePattern = /^\+[1-9]\d{9,14}$/;

const normalizePhoneInput = (value: string): string => {
	const hasLeadingPlus = value.startsWith("+");
	const digits = value.replace(/\D/g, "");
	return `${hasLeadingPlus ? "+" : ""}${digits}`.slice(0, 16);
};
type Errors = Partial<Record<FieldName, string>>;
const trimOptional = (value: string): string | null => value.trim() || null;

const codePointLength = (value: string) => Array.from(value.trim()).length;

const errorText = (kind?: string) => {
	switch (kind) {
		case "unauthorized": return "Сессия завершена. Войдите снова, чтобы сохранить карточку.";
		case "forbidden": return "У вашей учётной записи нет доступа к созданию спортсменов.";
		case "request": return "Сервер не принял данные. Проверьте фамилию, имя, дату рождения и телефоны.";
		default: return "Не удалось сохранить карточку. Данные остались в форме — повторите попытку.";
	}
};

const AthleteCreatePage: FC = () => {
	const dispatch = useGlobalDispatch();
	const navigate = useNavigate();
	const {saving, createErrorKind} = useGlobalSelector(global => global.athleteReducer);
	const sessionVersion = useGlobalSelector(global => global.userTokenReducer.sessionVersion);
	const [values, setValues] = useState<FormValues>(emptyValues);
	const [errors, setErrors] = useState<Errors>({});
	const submitGuard = useRef(false);

	const change = (field: FieldName) => (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const isBirthDate = field === "birthDate";
		const digitsBeforeCursor = isBirthDate
			? input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length
			: 0;
		const value = isBirthDate
			? formatBirthDateDisplayInput(input.value)
			: phoneFields.includes(field) ? normalizePhoneInput(input.value) : input.value;
		setValues(current => ({...current, [field]: value}));
		if (isBirthDate) {
			const cursorPosition = digitsBeforeCursor + Number(digitsBeforeCursor > 2) + Number(digitsBeforeCursor > 4);
			window.requestAnimationFrame(() => input.setSelectionRange(cursorPosition, cursorPosition));
		}
		setErrors(current => {
			const next = {...current};
			delete next[field];
			return next;
		});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitGuard.current || saving) return;
		const nextErrors: Errors = {};
		if (!values.secondName.trim()) nextErrors.secondName = "Укажите фамилию.";
		if (!values.firstName.trim()) nextErrors.firstName = "Укажите имя.";
		if (!parseBirthDateDisplayInput(values.birthDate)) nextErrors.birthDate = "Проверьте дату.";
		for (const key of ["secondName", "firstName", "middleName", "parentSecondName", "parentFirstName", "parentMiddleName"] as const) {
			if (codePointLength(values[key]) > 100) nextErrors[key] = "Не более 100 символов.";
		}
		if (values.phone && !phonePattern.test(values.phone)) nextErrors.phone = "Формат: + и 10–15 цифр без пробелов, например +79991234567.";
		if (values.parentPhone && !phonePattern.test(values.parentPhone)) nextErrors.parentPhone = "Формат: + и 10–15 цифр без пробелов, например +79991234567.";
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;
		const birthDate = parseBirthDateDisplayInput(values.birthDate);
		if (!birthDate) return;

		const request: PostAthleteV1Request = {
			secondName: values.secondName.trim(), firstName: values.firstName.trim(), middleName: trimOptional(values.middleName),
			birthDate, photoUrl: null, phone: trimOptional(values.phone),
			parentSecondName: trimOptional(values.parentSecondName),
			parentFirstName: trimOptional(values.parentFirstName),
			parentMiddleName: trimOptional(values.parentMiddleName),
			parentPhone: trimOptional(values.parentPhone)
		};
		submitGuard.current = true;
		try {
			await dispatch(createAthlete({request, sessionVersion})).unwrap();
			navigate("/athletes", {replace: true, state: {created: true}});
		} catch {
			// Redux keeps the normalized API failure while form values stay intact.
		} finally {
			submitGuard.current = false;
		}
	};

	const field = (name: FieldName, label: string, required = false, type: "text" | "tel" = "text") => {
		const errorId = `${name}-error`;
		const isPhone = phoneFields.includes(name);
		const isBirthDate = name === "birthDate";
		return <div className={style.fieldWrap} key={name}>
			<TextField id={name} name={name} label={label} type={isBirthDate ? "text" : type} value={values[name]} onChange={change(name)} required={required} autoComplete="off" inputMode={isBirthDate ? "numeric" : isPhone ? "tel" : undefined} placeholder={isBirthDate ? "ДД.ММ.ГГГГ" : isPhone ? "+79991234567" : undefined} maxLength={isBirthDate ? 10 : isPhone ? 16 : undefined} minLength={isPhone && values[name] ? 11 : undefined} pattern={isBirthDate ? "\\d{2}\\.\\d{2}\\.\\d{4}" : isPhone ? "\\+[1-9][0-9]{9,14}" : undefined} invalid={Boolean(errors[name])} describedBy={errors[name] ? errorId : undefined}/>
			{errors[name] && <p className={style.fieldError} id={errorId}>{errors[name]}</p>}
		</div>;
	};

	return (
		<main className={style.page}>
			<header className={style.formHeader}><Link className={style.backLink} to="/athletes"><svg className={style.backArrow} viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M11.5 4.5 6 10l5.5 5.5M6.5 10H17" /></svg><span>Спортсмены</span></Link><h1>Добавить спортсмена</h1><p>Заполните данные спортсмена и родителя</p></header>
			{createErrorKind && <FormMessage>{errorText(createErrorKind)}</FormMessage>}
			{createErrorKind === "unauthorized" && <p><Link className={style.inlineLink} to="/logout">Завершить сессию и войти снова</Link></p>}
			<form className={style.formCard} onSubmit={handleSubmit} noValidate>
				{Object.values(errors).some(Boolean) && <FormMessage>Проверьте отмеченные поля.</FormMessage>}
				<section className={style.group} aria-labelledby="athlete-heading">
					<div className={style.nameFields}><h2 id="athlete-heading">Спортсмен</h2>{field("secondName", "Фамилия", true)}{field("firstName", "Имя", true)}{field("middleName", "Отчество (необязательно)")}</div>
					<div className={style.contactFields}>{field("birthDate", "Дата рождения", true)}{field("phone", "Номер телефона (необязательно)", false, "tel")}</div>
				</section>
				<section className={`${style.group} ${style.parentGroup}`} aria-labelledby="parent-heading">
					<div className={style.nameFields}><h2 id="parent-heading">Родитель</h2>{field("parentSecondName", "Фамилия (необязательно)")}{field("parentFirstName", "Имя (необязательно)")}{field("parentMiddleName", "Отчество (необязательно)")}</div>
					<div className={style.contactFields}>{field("parentPhone", "Номер телефона (необязательно)", false, "tel")}</div>
				</section>
				<div className={style.actions}><Link className={style.cancel} to="/athletes">Отмена</Link><Button type="submit" disabled={saving}>{saving ? "Сохранение…" : "Сохранить спортсмена"}</Button></div>
			</form>
		</main>
	);
};

export default AthleteCreatePage;

import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";
import {
	ATHLETE_FIELD_TOO_LONG_MSG,
	ATHLETE_NAME_MAX_LEN,
	ATHLETE_NOTE_MAX_LEN,
	ATHLETE_PHONE_INPUT_MAX_LEN,
	trimToMax
} from "../../../api/constants/athleteFieldLimits";
import DesignForm from "../common/design_form/DesignForm";
import {FORM_CHECK_BANNER, focusFirstFieldByName} from "../common/design_form/formContract";
import FormCheckBanner from "../common/form_check_banner/FormCheckBanner";
import TextField from "../common/text_field/TextField";
import {
	maskBirthDateInput,
	validateBirthDateMask,
	normalizePhoneE164,
	parentBlockComplete,
	parentBlockFilled
} from "../../util/athleteDisplay";
import {maskPhoneInput} from "../../util/phoneInput";

export type AthleteFormField =
	| "last_name"
	| "first_name"
	| "birth_date"
	| "phone"
	| "parent_last_name"
	| "parent_first_name"
	| "parent_birth_date"
	| "parent_phone"
	| "patronymic"
	| "parent_patronymic"
	| "note";

type FieldErrors = Partial<Record<AthleteFormField | "parent_block", string>>;

export type AthleteCreateModalProps = {
	open: boolean;
	submitting: boolean;
	bannerError?: string | null;
	onClose: () => void;
	onSubmit: (body: PostAthleteV1Request) => void;
	serverFieldErrors?: FieldErrors;
	onClearServerErrors?: () => void;
};

const INITIAL = {
	last_name: "",
	first_name: "",
	patronymic: "",
	birth_date: "",
	phone: "",
	parent_last_name: "",
	parent_first_name: "",
	parent_patronymic: "",
	parent_birth_date: "",
	parent_phone: "",
	note: ""
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_FOCUS_ORDER: AthleteFormField[] = [
	"last_name",
	"first_name",
	"patronymic",
	"birth_date",
	"phone",
	"parent_last_name",
	"parent_first_name",
	"parent_patronymic",
	"parent_birth_date",
	"parent_phone",
	"note"
];

const AthleteCreateModal: FC<AthleteCreateModalProps> = ({
	open,
	submitting,
	bannerError,
	onClose,
	onSubmit,
	serverFieldErrors,
	onClearServerErrors
}) => {
	const [form, setForm] = useState(INITIAL);
	const [clientErrors, setClientErrors] = useState<FieldErrors>({});
	const [formCheckBanner, setFormCheckBanner] = useState<string | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	const fieldError = (field: AthleteFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors?.[field];

	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			returnFocusRef.current = document.activeElement as HTMLElement | null;
			setForm(INITIAL);
			setClientErrors({});
			setFormCheckBanner(null);
			onClearServerErrors?.();
			window.requestAnimationFrame(() => titleRef.current?.focus());
		}
		wasOpenRef.current = open;
	}, [open, onClearServerErrors]);

	useEffect(() => {
		if (open) return;
		const el = returnFocusRef.current;
		if (el && typeof el.focus === "function") el.focus();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !submitting) {
				event.preventDefault();
				onClose();
			}
			if (event.key === "Tab" && dialogRef.current) {
				const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
				if (nodes.length === 0) return;
				const first = nodes[0];
				const last = nodes[nodes.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose, submitting]);

	const focusFirstInvalidField = (errors: FieldErrors) => {
		const names = FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(dialogRef.current, names);
	};

	const update = (key: keyof typeof INITIAL, value: string) => {
		let next = value;
		if (key === "note") {
			next = trimToMax(value, ATHLETE_NOTE_MAX_LEN);
		} else if (key === "phone" || key === "parent_phone") {
			next = maskPhoneInput(value, ATHLETE_PHONE_INPUT_MAX_LEN);
		} else if (key !== "birth_date" && key !== "parent_birth_date") {
			next = trimToMax(value, ATHLETE_NAME_MAX_LEN);
		}
		setForm(prev => ({...prev, [key]: next}));
		setClientErrors(prev => {
			const fieldKey = key as AthleteFormField;
			if (!prev[fieldKey] && !prev.parent_block) return prev;
			const copy = {...prev};
			delete copy[fieldKey];
			if (
				key === "parent_last_name" ||
				key === "parent_first_name" ||
				key === "parent_patronymic" ||
				key === "parent_birth_date" ||
				key === "parent_phone"
			) {
				delete copy.parent_block;
			}
			return copy;
		});
		setFormCheckBanner(null);
	};

	const tooLong = (value: string, max: number) => value.trim().length > max;

	const validate = (): PostAthleteV1Request | null => {
		const errors: FieldErrors = {};
		const lastName = form.last_name.trim();
		const firstName = form.first_name.trim();
		if (!lastName) errors.last_name = "Укажите фамилию";
		else if (tooLong(lastName, ATHLETE_NAME_MAX_LEN)) {
			errors.last_name = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
		}
		if (!firstName) errors.first_name = "Укажите имя";
		else if (tooLong(firstName, ATHLETE_NAME_MAX_LEN)) {
			errors.first_name = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
		}
		const patronymic = form.patronymic.trim();
		if (patronymic && tooLong(patronymic, ATHLETE_NAME_MAX_LEN)) {
			errors.patronymic = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
		}

		const athleteBirth = validateBirthDateMask(form.birth_date);
		if (athleteBirth.error) errors.birth_date = athleteBirth.error;
		const phoneRaw = form.phone.trim();
		const phone = normalizePhoneE164(form.phone);
		if (!phoneRaw) errors.phone = "Укажите номер с «+» и кодом страны";
		else if (!phone) errors.phone = "Неверный формат: +, код страны и от 8 до 15 цифр";

		const parentFields = {
			parent_last_name: form.parent_last_name,
			parent_first_name: form.parent_first_name,
			parent_patronymic: form.parent_patronymic,
			parent_birth_date: form.parent_birth_date,
			parent_phone: form.parent_phone
		};
		const parentAny = parentBlockFilled(parentFields);
		const parentAll = parentBlockComplete(parentFields);
		if (parentAny && !parentAll) {
			errors.parent_block = "Заполните все поля родителя или оставьте блок пустым";
		}
		let parentBirth = validateBirthDateMask("");
		if (parentAll) {
			parentBirth = validateBirthDateMask(form.parent_birth_date);
			if (parentBirth.error) errors.parent_birth_date = parentBirth.error;
			const parentPhoneRaw = form.parent_phone.trim();
			if (!parentPhoneRaw) {
				errors.parent_phone = "Укажите номер с «+» и кодом страны";
			} else if (!normalizePhoneE164(form.parent_phone)) {
				errors.parent_phone = "Неверный формат: +, код страны и от 8 до 15 цифр";
			}
			const parentLast = form.parent_last_name.trim();
			if (!parentLast) errors.parent_last_name = "Укажите фамилию";
			else if (tooLong(parentLast, ATHLETE_NAME_MAX_LEN)) {
				errors.parent_last_name = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
			}
			const parentFirst = form.parent_first_name.trim();
			if (!parentFirst) errors.parent_first_name = "Укажите имя";
			else if (tooLong(parentFirst, ATHLETE_NAME_MAX_LEN)) {
				errors.parent_first_name = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
			}
			const parentPatronymic = form.parent_patronymic.trim();
			if (parentPatronymic && tooLong(parentPatronymic, ATHLETE_NAME_MAX_LEN)) {
				errors.parent_patronymic = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NAME_MAX_LEN);
			}
		}

		const note = form.note.trim();
		if (note && tooLong(note, ATHLETE_NOTE_MAX_LEN)) {
			errors.note = ATHLETE_FIELD_TOO_LONG_MSG(ATHLETE_NOTE_MAX_LEN);
		}

		setClientErrors(errors);
		if (Object.keys(errors).length > 0) {
			setFormCheckBanner(FORM_CHECK_BANNER);
			focusFirstInvalidField(errors);
			return null;
		}
		setFormCheckBanner(null);

		const body: PostAthleteV1Request = {
			last_name: lastName,
			first_name: firstName,
			birth_date: athleteBirth.iso as string,
			phone: phone as string
		};
		if (patronymic) body.patronymic = patronymic;
		if (note) body.note = note;

		if (parentAll) {
			body.parent_last_name = form.parent_last_name.trim();
			body.parent_first_name = form.parent_first_name.trim();
			const pp = form.parent_patronymic.trim();
			if (pp) body.parent_patronymic = pp;
			body.parent_birth_date = parentBirth.iso as string;
			body.parent_phone = normalizePhoneE164(form.parent_phone) as string;
		}
		return body;
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (submitting) return;
		onClearServerErrors?.();
		const body = validate();
		if (body) onSubmit(body);
	};

	if (!open) return null;

	return (
		<div
			className="academy-modal-backdrop academy-modal-backdrop--open"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !submitting) onClose();
			}}
		>
			<div
				className="academy-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="athlete-modal-title"
				ref={dialogRef}
			>
				<header className="academy-modal__head">
					<h2 id="athlete-modal-title" tabIndex={-1} ref={titleRef}>
						Добавить спортсмена
					</h2>
					<button
						type="button"
						className="academy-modal__close"
						aria-label="Закрыть"
						disabled={submitting}
						onClick={onClose}
					>
						×
					</button>
				</header>
				<DesignForm onSubmit={handleSubmit}>
					{formCheckBanner ? <FormCheckBanner message={formCheckBanner}/> : null}
					{bannerError && !formCheckBanner ? <FormCheckBanner message={bannerError}/> : null}
					{(clientErrors.parent_block ?? serverFieldErrors?.parent_block) ? (
						<FormCheckBanner message={clientErrors.parent_block ?? serverFieldErrors?.parent_block ?? ""}/>
					) : null}
					<div className="academy-modal__sections">
						<section className="academy-modal__section" aria-labelledby="athlete-block-title">
							<h3 className="academy-modal__section-title" id="athlete-block-title">Спортсмен</h3>
							<div className="academy-modal__split">
								<div className="academy-modal__split-col academy-modal__split-col--identity">
									<TextField
										useDesignKit showRequiredIndicator required
										id="athlete-last-name" name="last_name" label="Фамилия"
										autoComplete="family-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.last_name} error={fieldError("last_name")}
										invalid={Boolean(fieldError("last_name"))}
										onChange={e => update("last_name", e.target.value)}
									/>
									<TextField
										useDesignKit showRequiredIndicator required
										id="athlete-first-name" name="first_name" label="Имя"
										autoComplete="given-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.first_name} error={fieldError("first_name")}
										invalid={Boolean(fieldError("first_name"))}
										onChange={e => update("first_name", e.target.value)}
									/>
									<TextField
										useDesignKit
										id="athlete-patronymic" name="patronymic" label="Отчество"
										autoComplete="additional-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.patronymic} error={fieldError("patronymic")}
										invalid={Boolean(fieldError("patronymic"))}
										onChange={e => update("patronymic", e.target.value)}
									/>
								</div>
								<div className="academy-modal__split-col academy-modal__split-col--contacts">
									<TextField
										useDesignKit showRequiredIndicator required
										id="athlete-birth-date" name="birth_date" label="Дата рождения"
										inputMode="numeric" placeholder="дд.мм.гггг" autoComplete="bday"
										value={form.birth_date} error={fieldError("birth_date")}
										invalid={Boolean(fieldError("birth_date"))}
										onChange={e => update("birth_date", maskBirthDateInput(e.target.value))}
									/>
									<TextField
										useDesignKit showRequiredIndicator required
										id="athlete-phone" name="phone" label="Телефон" type="tel"
										autoComplete="tel" placeholder="+7 …" maxLength={ATHLETE_PHONE_INPUT_MAX_LEN}
										value={form.phone} error={fieldError("phone")}
										invalid={Boolean(fieldError("phone"))}
										onChange={e => update("phone", e.target.value)}
									/>
									<p className="academy-modal__col-hint">
										С кодом страны, с «+». Пробелы и дефисы можно — сохраним только цифры после «+».
									</p>
								</div>
							</div>
						</section>
						<section
							className="academy-modal__section academy-modal__section--grouped"
							aria-labelledby="guardian-block-title"
						>
							<h3 className="academy-modal__section-title" id="guardian-block-title">
								Родитель / законный представитель
							</h3>
							<p className="academy-modal__section-lead">
								Необязательно — для взрослых спортсменов блок можно оставить пустым.
							</p>
							<div className="academy-modal__split">
								<div className="academy-modal__split-col academy-modal__split-col--identity">
									<TextField
										useDesignKit
										id="parent-last-name" name="parent_last_name" label="Фамилия"
										autoComplete="family-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.parent_last_name} error={fieldError("parent_last_name")}
										invalid={Boolean(fieldError("parent_last_name"))}
										onChange={e => update("parent_last_name", e.target.value)}
									/>
									<TextField
										useDesignKit
										id="parent-first-name" name="parent_first_name" label="Имя"
										autoComplete="given-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.parent_first_name} error={fieldError("parent_first_name")}
										invalid={Boolean(fieldError("parent_first_name"))}
										onChange={e => update("parent_first_name", e.target.value)}
									/>
									<TextField
										useDesignKit
										id="parent-patronymic" name="parent_patronymic" label="Отчество"
										autoComplete="additional-name" maxLength={ATHLETE_NAME_MAX_LEN}
										value={form.parent_patronymic} error={fieldError("parent_patronymic")}
										invalid={Boolean(fieldError("parent_patronymic"))}
										onChange={e => update("parent_patronymic", e.target.value)}
									/>
								</div>
								<div className="academy-modal__split-col academy-modal__split-col--contacts">
									<TextField
										useDesignKit
										id="parent-birth-date" name="parent_birth_date" label="Дата рождения"
										inputMode="numeric" placeholder="дд.мм.гггг" autoComplete="bday"
										value={form.parent_birth_date} error={fieldError("parent_birth_date")}
										invalid={Boolean(fieldError("parent_birth_date"))}
										onChange={e => update("parent_birth_date", maskBirthDateInput(e.target.value))}
									/>
									<TextField
										useDesignKit
										id="parent-phone" name="parent_phone" label="Телефон" type="tel"
										autoComplete="tel" placeholder="+7 …" maxLength={ATHLETE_PHONE_INPUT_MAX_LEN}
										value={form.parent_phone} error={fieldError("parent_phone")}
										invalid={Boolean(fieldError("parent_phone"))}
										onChange={e => update("parent_phone", e.target.value)}
									/>
									<p className="academy-modal__col-hint">
										С кодом страны, с «+». Пробелы и дефисы можно — сохраним только цифры после «+».
									</p>
								</div>
							</div>
						</section>
						<TextField
							useDesignKit
							id="athlete-note" name="note" label="Примечание"
							maxLength={ATHLETE_NOTE_MAX_LEN} value={form.note}
							error={fieldError("note")} invalid={Boolean(fieldError("note"))}
							onChange={e => update("note", e.target.value)}
						/>
					</div>
					<footer className="academy-modal__actions">
						<button type="button" className="btn" disabled={submitting} onClick={onClose}>
							Отмена
						</button>
						<button type="submit" className="btn btn--gold" disabled={submitting}>
							Сохранить
						</button>
					</footer>
				</DesignForm>
			</div>
		</div>
	);
};

export default AthleteCreateModal;
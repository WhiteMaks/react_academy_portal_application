import PostAthleteV1Request from "../../../api/models/athlete/PostAthleteV1Request";
import {
	ATHLETE_FIELD_TOO_LONG_MSG,
	ATHLETE_NAME_MAX_LEN,
	ATHLETE_NOTE_MAX_LEN
} from "../../../api/constants/athleteFieldLimits";
import {
	normalizePhoneE164,
	parentBlockComplete,
	parentBlockFilled,
	validateBirthDateMask
} from "../../util/athleteDisplay";
import {AthleteFormFieldErrors, AthleteFormValues} from "./athleteFormTypes";

const tooLong = (value: string, max: number) => value.trim().length > max;

export type AthleteFormValidateResult =
	| {ok: true; body: PostAthleteV1Request}
	| {ok: false; errors: AthleteFormFieldErrors};

export const validateAthleteForm = (form: AthleteFormValues): AthleteFormValidateResult => {
	const errors: AthleteFormFieldErrors = {};
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
	else if (!phone) errors.phone = "Укажите номер с «+» и кодом страны";

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
			errors.parent_phone = "Укажите номер с «+» и кодом страны";
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

	if (Object.keys(errors).length > 0) {
		return {ok: false, errors};
	}

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
	return {ok: true, body};
};
import PostCoachV1Request from "../../../api/models/coach/PostCoachV1Request";
import {
	COACH_FIELD_TOO_LONG_MSG,
	COACH_NAME_MAX_LEN,
	COACH_NOTE_MAX_LEN,
	COACH_SPECIALIZATION_MAX_LEN
} from "../../../api/constants/coachFieldLimits";
import {normalizePhoneE164, validateBirthDateMask} from "../../util/athleteDisplay";
import {CoachFormFieldErrors, CoachFormValues} from "./coachFormTypes";

const tooLong = (value: string, max: number) => value.trim().length > max;

export type CoachFormValidateResult =
	| {ok: true; body: PostCoachV1Request}
	| {ok: false; errors: CoachFormFieldErrors};

export const validateCoachForm = (form: CoachFormValues): CoachFormValidateResult => {
	const errors: CoachFormFieldErrors = {};
	const lastName = form.last_name.trim();
	const firstName = form.first_name.trim();
	if (!lastName) errors.last_name = "Укажите фамилию";
	else if (tooLong(lastName, COACH_NAME_MAX_LEN)) {
		errors.last_name = COACH_FIELD_TOO_LONG_MSG(COACH_NAME_MAX_LEN);
	}
	if (!firstName) errors.first_name = "Укажите имя";
	else if (tooLong(firstName, COACH_NAME_MAX_LEN)) {
		errors.first_name = COACH_FIELD_TOO_LONG_MSG(COACH_NAME_MAX_LEN);
	}
	const patronymic = form.patronymic.trim();
	if (patronymic && tooLong(patronymic, COACH_NAME_MAX_LEN)) {
		errors.patronymic = COACH_FIELD_TOO_LONG_MSG(COACH_NAME_MAX_LEN);
	}

	const coachBirth = validateBirthDateMask(form.birth_date);
	if (coachBirth.error) errors.birth_date = coachBirth.error;

	const phoneRaw = form.phone.trim();
	const phone = normalizePhoneE164(form.phone);
	if (!phoneRaw) errors.phone = "Укажите номер с «+» и кодом страны";
	else if (!phone) errors.phone = "Укажите номер с «+» и кодом страны";

	const specialization = form.specialization.trim();
	if (!specialization) errors.specialization = "Укажите специализацию";
	else if (tooLong(specialization, COACH_SPECIALIZATION_MAX_LEN)) {
		errors.specialization = COACH_FIELD_TOO_LONG_MSG(COACH_SPECIALIZATION_MAX_LEN);
	}

	const note = form.note.trim();
	if (note && tooLong(note, COACH_NOTE_MAX_LEN)) {
		errors.note = COACH_FIELD_TOO_LONG_MSG(COACH_NOTE_MAX_LEN);
	}

	if (Object.keys(errors).length > 0) {
		return {ok: false, errors};
	}

	const body: PostCoachV1Request = {
		last_name: lastName,
		first_name: firstName,
		birth_date: coachBirth.iso as string,
		phone: phone as string,
		specialization
	};
	if (patronymic) body.patronymic = patronymic;
	if (note) body.note = note;
	return {ok: true, body};
};
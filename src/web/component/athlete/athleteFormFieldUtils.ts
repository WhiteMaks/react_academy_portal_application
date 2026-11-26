import {
	ATHLETE_NAME_MAX_LEN,
	ATHLETE_NOTE_MAX_LEN,
	ATHLETE_PHONE_INPUT_MAX_LEN,
	trimToMax
} from "../../../api/constants/athleteFieldLimits";
import {maskBirthDateInput} from "../../util/athleteDisplay";
import {maskPhoneInput} from "../../util/phoneInput";
import {AthleteFormField, AthleteFormFieldErrors, AthleteFormValues} from "./athleteFormTypes";

export const updateAthleteFormValue = (
	form: AthleteFormValues,
	key: keyof AthleteFormValues,
	value: string
): AthleteFormValues => {
	let next = value;
	if (key === "note") {
		next = trimToMax(value, ATHLETE_NOTE_MAX_LEN);
	} else if (key === "phone" || key === "parent_phone") {
		next = maskPhoneInput(value, ATHLETE_PHONE_INPUT_MAX_LEN);
	} else if (key === "birth_date" || key === "parent_birth_date") {
		next = maskBirthDateInput(value);
	} else {
		next = trimToMax(value, ATHLETE_NAME_MAX_LEN);
	}
	return {...form, [key]: next};
};

export const clearAthleteFieldErrorsOnChange = (
	errors: AthleteFormFieldErrors,
	key: keyof AthleteFormValues
): AthleteFormFieldErrors => {
	const fieldKey = key as AthleteFormField;
	if (!errors[fieldKey] && !errors.parent_block) return errors;
	const copy = {...errors};
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
};
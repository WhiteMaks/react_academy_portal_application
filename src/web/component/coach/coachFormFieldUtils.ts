import {
	COACH_NAME_MAX_LEN,
	COACH_NOTE_MAX_LEN,
	COACH_PHONE_INPUT_MAX_LEN,
	COACH_SPECIALIZATION_MAX_LEN,
	trimToMax
} from "../../../api/constants/coachFieldLimits";
import {maskBirthDateInput} from "../../util/athleteDisplay";
import {maskPhoneInput} from "../../util/phoneInput";
import {CoachFormField, CoachFormFieldErrors, CoachFormValues} from "./coachFormTypes";

export const updateCoachFormValue = (
	form: CoachFormValues,
	key: keyof CoachFormValues,
	value: string
): CoachFormValues => {
	let next = value;
	if (key === "note") {
		next = trimToMax(value, COACH_NOTE_MAX_LEN);
	} else if (key === "birth_date") {
		next = maskBirthDateInput(value);
	} else if (key === "phone") {
		next = maskPhoneInput(value, COACH_PHONE_INPUT_MAX_LEN);
	} else if (key === "specialization") {
		next = trimToMax(value, COACH_SPECIALIZATION_MAX_LEN);
	} else {
		next = trimToMax(value, COACH_NAME_MAX_LEN);
	}
	return {...form, [key]: next};
};

export const clearCoachFieldErrorsOnChange = (
	errors: CoachFormFieldErrors,
	key: keyof CoachFormValues
): CoachFormFieldErrors => {
	const fieldKey = key as CoachFormField;
	if (!errors[fieldKey]) return errors;
	const copy = {...errors};
	delete copy[fieldKey];
	return copy;
};
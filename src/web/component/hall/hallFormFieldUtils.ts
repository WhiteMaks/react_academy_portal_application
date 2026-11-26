import {HallFormField, HallFormFieldErrors, HallFormValues} from "./hallFormTypes";

export const updateHallFormValue = (
	prev: HallFormValues,
	key: keyof HallFormValues,
	value: string
): HallFormValues => ({...prev, [key]: value});

export const clearHallFieldErrorsOnChange = (
	prev: HallFormFieldErrors,
	key: keyof HallFormValues
): HallFormFieldErrors => {
	if (key === "name" || key === "subtitle" || key === "capacity" || key === "note") {
		const next = {...prev};
		delete next[key as HallFormField];
		return next;
	}
	return prev;
};
import {BranchFormField, BranchFormFieldErrors, BranchFormValues} from "./branchFormTypes";

export const updateBranchFormValue = (
	prev: BranchFormValues,
	key: keyof BranchFormValues,
	value: string
): BranchFormValues => ({...prev, [key]: value});

export const clearBranchFieldErrorsOnChange = (
	prev: BranchFormFieldErrors,
	key: keyof BranchFormValues
): BranchFormFieldErrors => {
	if (key === "name" || key === "address" || key === "note") {
		const next = {...prev};
		delete next[key as BranchFormField];
		return next;
	}
	return prev;
};
import PostBranchV1Request from "../../../api/models/branch/PostBranchV1Request";
import PutBranchV1Request from "../../../api/models/branch/PutBranchV1Request";
import {
	BRANCH_ADDRESS_MAX_LEN,
	BRANCH_FIELD_TOO_LONG_MSG,
	BRANCH_NAME_MAX_LEN,
	BRANCH_NOTE_MAX_LEN
} from "../../../api/constants/branchFieldLimits";
import {BranchFormFieldErrors, BranchFormValues} from "./branchFormTypes";

const tooLong = (value: string, max: number) => value.trim().length > max;

export type BranchFormValidateResult =
	| {ok: true; body: PostBranchV1Request}
	| {ok: false; errors: BranchFormFieldErrors};

export const validateBranchForm = (form: BranchFormValues): BranchFormValidateResult => {
	const errors: BranchFormFieldErrors = {};
	const name = form.name.trim();
	const address = form.address.trim();

	if (!name) errors.name = "Укажите название филиала";
	else if (tooLong(name, BRANCH_NAME_MAX_LEN)) {
		errors.name = BRANCH_FIELD_TOO_LONG_MSG(BRANCH_NAME_MAX_LEN);
	}

	if (!address) errors.address = "Укажите адрес";
	else if (tooLong(address, BRANCH_ADDRESS_MAX_LEN)) {
		errors.address = BRANCH_FIELD_TOO_LONG_MSG(BRANCH_ADDRESS_MAX_LEN);
	}

	const note = form.note.trim();
	if (note && tooLong(note, BRANCH_NOTE_MAX_LEN)) {
		errors.note = BRANCH_FIELD_TOO_LONG_MSG(BRANCH_NOTE_MAX_LEN);
	}

	if (Object.keys(errors).length > 0) {
		return {ok: false, errors};
	}

	const body: PostBranchV1Request = {name, address};
	if (note) body.note = note;
	return {ok: true, body};
};

export const branchFormToPutBody = (
	form: BranchFormValues,
	activityStatus: string
): PutBranchV1Request | null => {
	const validated = validateBranchForm(form);
	if (!validated.ok) return null;
	return {...validated.body, activity_status: activityStatus};
};
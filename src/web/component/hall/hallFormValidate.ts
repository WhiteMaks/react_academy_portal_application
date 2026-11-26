import PostHallV1Request from "../../../api/models/hall/PostHallV1Request";
import PutHallV1Request from "../../../api/models/hall/PutHallV1Request";
import {
	HALL_CAPACITY_MAX,
	HALL_CAPACITY_MIN,
	HALL_FIELD_TOO_LONG_MSG,
	HALL_NAME_MAX_LEN,
	HALL_NOTE_MAX_LEN,
	HALL_SUBTITLE_MAX_LEN
} from "../../../api/constants/hallFieldLimits";
import {HallFormFieldErrors, HallFormValues} from "./hallFormTypes";

const tooLong = (value: string, max: number) => value.trim().length > max;

export type HallFormValidateResult =
	| {ok: true; body: Omit<PostHallV1Request, "branch_id">}
	| {ok: false; errors: HallFormFieldErrors};

export const validateHallForm = (form: HallFormValues): HallFormValidateResult => {
	const errors: HallFormFieldErrors = {};
	const name = form.name.trim();

	if (!name) errors.name = "Укажите название";
	else if (tooLong(name, HALL_NAME_MAX_LEN)) {
		errors.name = HALL_FIELD_TOO_LONG_MSG(HALL_NAME_MAX_LEN);
	}

	const subtitle = form.subtitle.trim();
	if (subtitle && tooLong(subtitle, HALL_SUBTITLE_MAX_LEN)) {
		errors.subtitle = HALL_FIELD_TOO_LONG_MSG(HALL_SUBTITLE_MAX_LEN);
	}

	const capacityRaw = form.capacity.trim();
	if (!capacityRaw) errors.capacity = "Укажите вместимость";
	else {
		const capacity = Number(capacityRaw);
		if (!Number.isInteger(capacity) || capacity < HALL_CAPACITY_MIN || capacity > HALL_CAPACITY_MAX) {
			errors.capacity = `Укажите вместимость от ${HALL_CAPACITY_MIN} до ${HALL_CAPACITY_MAX} человек`;
		}
	}

	const note = form.note.trim();
	if (note && tooLong(note, HALL_NOTE_MAX_LEN)) {
		errors.note = HALL_FIELD_TOO_LONG_MSG(HALL_NOTE_MAX_LEN);
	}

	if (Object.keys(errors).length > 0) {
		return {ok: false, errors};
	}

	const capacity = Number(capacityRaw);
	const body: Omit<PostHallV1Request, "branch_id"> = {name, capacity};
	if (subtitle) body.subtitle = subtitle;
	if (note) body.note = note;
	return {ok: true, body};
};

export const hallFormToPutBody = (form: HallFormValues, activityStatus: string): PutHallV1Request | null => {
	const validated = validateHallForm(form);
	if (!validated.ok) return null;
	return {...validated.body, activity_status: activityStatus};
};
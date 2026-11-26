import CoachV1Response from "../../../api/models/coach/CoachV1Response";
import {formatDateRu} from "../../util/athleteDisplay";
import {CoachFormValues} from "./coachFormTypes";

export const coachResponseToFormValues = (detail: CoachV1Response): CoachFormValues => ({
	last_name: detail.last_name,
	first_name: detail.first_name,
	patronymic: detail.patronymic?.trim() ?? "",
	birth_date: formatDateRu(detail.birth_date),
	phone: detail.phone,
	specialization: detail.specialization,
	note: detail.note?.trim() ?? ""
});

export const isCoachFormDirty = (form: CoachFormValues, baseline: CoachFormValues): boolean =>
	form.last_name !== baseline.last_name ||
	form.first_name !== baseline.first_name ||
	form.patronymic !== baseline.patronymic ||
	form.birth_date !== baseline.birth_date ||
	form.phone !== baseline.phone ||
	form.specialization !== baseline.specialization ||
	form.note !== baseline.note;
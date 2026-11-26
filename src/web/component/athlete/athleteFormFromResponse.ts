import AthleteV1Response from "../../../api/models/athlete/AthleteV1Response";
import {formatDateRu} from "../../util/athleteDisplay";
import {AthleteFormValues} from "./athleteFormTypes";

export const athleteResponseToFormValues = (detail: AthleteV1Response): AthleteFormValues => ({
	last_name: detail.last_name,
	first_name: detail.first_name,
	patronymic: detail.patronymic?.trim() ?? "",
	birth_date: formatDateRu(detail.birth_date),
	phone: detail.phone,
	parent_last_name: detail.parent_last_name?.trim() ?? "",
	parent_first_name: detail.parent_first_name?.trim() ?? "",
	parent_patronymic: detail.parent_patronymic?.trim() ?? "",
	parent_birth_date: detail.parent_birth_date ? formatDateRu(detail.parent_birth_date) : "",
	parent_phone: detail.parent_phone?.trim() ?? "",
	note: detail.note?.trim() ?? ""
});

export const isAthleteFormDirty = (form: AthleteFormValues, baseline: AthleteFormValues): boolean =>
	form.last_name !== baseline.last_name ||
	form.first_name !== baseline.first_name ||
	form.patronymic !== baseline.patronymic ||
	form.birth_date !== baseline.birth_date ||
	form.phone !== baseline.phone ||
	form.parent_last_name !== baseline.parent_last_name ||
	form.parent_first_name !== baseline.parent_first_name ||
	form.parent_patronymic !== baseline.parent_patronymic ||
	form.parent_birth_date !== baseline.parent_birth_date ||
	form.parent_phone !== baseline.parent_phone ||
	form.note !== baseline.note;
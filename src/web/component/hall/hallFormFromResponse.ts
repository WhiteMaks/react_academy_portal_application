import HallV1Response from "../../../api/models/hall/HallV1Response";
import {HallFormValues} from "./hallFormTypes";

export const hallResponseToFormValues = (hall: HallV1Response): HallFormValues => ({
	name: hall.name,
	subtitle: hall.subtitle?.trim() ?? "",
	capacity: String(hall.capacity),
	note: hall.note?.trim() ?? ""
});

export const isHallFormDirty = (current: HallFormValues, baseline: HallFormValues): boolean =>
	current.name !== baseline.name ||
	current.subtitle !== baseline.subtitle ||
	current.capacity !== baseline.capacity ||
	current.note !== baseline.note;
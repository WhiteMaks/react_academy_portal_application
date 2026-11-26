export type HallFormField = "name" | "subtitle" | "capacity" | "note";

export type HallFormFieldErrors = Partial<Record<HallFormField, string>>;

export type HallFormValues = {
	name: string;
	subtitle: string;
	capacity: string;
	note: string;
};

export const EMPTY_HALL_FORM: HallFormValues = {
	name: "",
	subtitle: "",
	capacity: "",
	note: ""
};

export const HALL_FIELD_FOCUS_ORDER: HallFormField[] = ["name", "subtitle", "capacity", "note"];
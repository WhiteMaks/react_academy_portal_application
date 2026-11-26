export type CoachFormField =
	| "last_name"
	| "first_name"
	| "patronymic"
	| "birth_date"
	| "phone"
	| "specialization"
	| "note";

export type CoachFormFieldErrors = Partial<Record<CoachFormField, string>>;

export type CoachFormValues = {
	last_name: string;
	first_name: string;
	patronymic: string;
	birth_date: string;
	phone: string;
	specialization: string;
	note: string;
};

export const EMPTY_COACH_FORM: CoachFormValues = {
	last_name: "",
	first_name: "",
	patronymic: "",
	birth_date: "",
	phone: "",
	specialization: "",
	note: ""
};

export const COACH_FIELD_FOCUS_ORDER: CoachFormField[] = [
	"last_name",
	"first_name",
	"patronymic",
	"birth_date",
	"phone",
	"specialization",
	"note"
];
export type AthleteFormField =
	| "last_name"
	| "first_name"
	| "birth_date"
	| "phone"
	| "parent_last_name"
	| "parent_first_name"
	| "parent_birth_date"
	| "parent_phone"
	| "patronymic"
	| "parent_patronymic"
	| "note";

export type AthleteFormFieldErrors = Partial<Record<AthleteFormField | "parent_block", string>>;

export type AthleteFormValues = {
	last_name: string;
	first_name: string;
	patronymic: string;
	birth_date: string;
	phone: string;
	parent_last_name: string;
	parent_first_name: string;
	parent_patronymic: string;
	parent_birth_date: string;
	parent_phone: string;
	note: string;
};

export const EMPTY_ATHLETE_FORM: AthleteFormValues = {
	last_name: "",
	first_name: "",
	patronymic: "",
	birth_date: "",
	phone: "",
	parent_last_name: "",
	parent_first_name: "",
	parent_patronymic: "",
	parent_birth_date: "",
	parent_phone: "",
	note: ""
};

export const ATHLETE_FIELD_FOCUS_ORDER: AthleteFormField[] = [
	"last_name",
	"first_name",
	"patronymic",
	"birth_date",
	"phone",
	"parent_last_name",
	"parent_first_name",
	"parent_patronymic",
	"parent_birth_date",
	"parent_phone",
	"note"
];
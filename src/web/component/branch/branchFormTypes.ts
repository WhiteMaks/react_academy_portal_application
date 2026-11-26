export type BranchFormField = "name" | "address" | "note";

export type BranchFormFieldErrors = Partial<Record<BranchFormField, string>>;

export type BranchFormValues = {
	name: string;
	address: string;
	note: string;
};

export const EMPTY_BRANCH_FORM: BranchFormValues = {
	name: "",
	address: "",
	note: ""
};

export const BRANCH_FIELD_FOCUS_ORDER: BranchFormField[] = ["name", "address", "note"];
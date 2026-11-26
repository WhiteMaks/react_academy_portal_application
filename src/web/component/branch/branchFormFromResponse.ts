import BranchV1Response from "../../../api/models/branch/BranchV1Response";
import {BranchFormValues} from "./branchFormTypes";

export const branchResponseToFormValues = (branch: BranchV1Response): BranchFormValues => ({
	name: branch.name,
	address: branch.address,
	note: branch.note?.trim() ?? ""
});

export const isBranchFormDirty = (current: BranchFormValues, baseline: BranchFormValues): boolean =>
	current.name !== baseline.name ||
	current.address !== baseline.address ||
	current.note !== baseline.note;
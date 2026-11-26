import BranchV1Response from "./BranchV1Response";

export default interface GetBranchesV1Response {
	branches: BranchV1Response[];
	total: number;
	limit: number;
	offset: number;
}
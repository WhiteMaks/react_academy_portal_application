import HallV1Response from "./HallV1Response";

export default interface GetBranchHallsV1Response {
	halls: HallV1Response[];
	total: number;
	limit: number;
	offset: number;
}
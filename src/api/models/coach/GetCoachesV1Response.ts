import CoachV1Response from "./CoachV1Response";

export default interface GetCoachesV1Response {
	coaches: CoachV1Response[];
	total: number;
	limit: number;
	offset: number;
}
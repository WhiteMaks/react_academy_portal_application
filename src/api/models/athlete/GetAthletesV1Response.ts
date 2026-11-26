import AthleteV1Response from "./AthleteV1Response";

export default interface GetAthletesV1Response {
	athletes: AthleteV1Response[];
	total: number;
	limit: number;
	offset: number;
}
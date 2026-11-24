import AthleteV1Response from "./AthleteV1Response";

export interface GetAthletesV1Response {
	athletes: AthleteV1Response[];
	total: number;
	limit: number;
	offset: number;
}

export default GetAthletesV1Response;

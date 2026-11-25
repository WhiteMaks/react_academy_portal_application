import GroupAthleteV1Response from "./GroupAthleteV1Response";

export interface GetGroupV1Response {
	id: string;
	name: string;
	memberCount: number;
	athletes: GroupAthleteV1Response[];
}

export default GetGroupV1Response;

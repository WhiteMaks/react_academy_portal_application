export default interface PostHallV1Request {
	branch_id: number;
	name: string;
	subtitle?: string;
	capacity: number;
	note?: string;
}
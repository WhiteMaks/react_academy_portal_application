export default interface PutHallV1Request {
	name: string;
	subtitle?: string;
	capacity: number;
	note?: string;
	activity_status: string;
}
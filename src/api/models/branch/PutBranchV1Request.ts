export default interface PutBranchV1Request {
	name: string;
	address: string;
	note?: string;
	activity_status: string;
}
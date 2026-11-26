export default interface BranchV1Response {
	id: number;
	name: string;
	address: string;
	note?: string | null;
	activity_status: string;
	archived_at?: string | null;
	created_at: string;
	updated_at: string;
}
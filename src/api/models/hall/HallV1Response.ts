export default interface HallV1Response {
	id: number;
	branch_id: number;
	name: string;
	subtitle?: string | null;
	capacity: number;
	note?: string | null;
	activity_status: string;
	branch_name?: string | null;
	branch_address?: string | null;
	branch_activity_status?: string | null;
	archived_at?: string | null;
	created_at: string;
	updated_at: string;
}
export default interface CoachV1Response {
	id: number;
	last_name: string;
	first_name: string;
	patronymic?: string | null;
	birth_date: string;
	phone: string;
	specialization: string;
	note?: string | null;
	activity_status: string;
	archived_at?: string | null;
	created_at: string;
	updated_at: string;
}
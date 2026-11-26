export default interface AthleteV1Response {
	id: number;
	last_name: string;
	first_name: string;
	patronymic?: string | null;
	birth_date: string;
	phone: string;
	parent_last_name?: string | null;
	parent_first_name?: string | null;
	parent_patronymic?: string | null;
	parent_birth_date?: string | null;
	parent_phone?: string | null;
	note?: string | null;
	activity_status: string;
	archived_at?: string | null;
	created_at: string;
	updated_at: string;
}
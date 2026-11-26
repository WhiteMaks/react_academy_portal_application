export default interface PostAthleteV1Request {
	last_name: string;
	first_name: string;
	patronymic?: string;
	birth_date: string;
	phone: string;
	parent_last_name?: string;
	parent_first_name?: string;
	parent_patronymic?: string;
	parent_birth_date?: string;
	parent_phone?: string;
	note?: string;
}
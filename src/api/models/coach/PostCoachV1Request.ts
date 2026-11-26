export default interface PostCoachV1Request {
	last_name: string;
	first_name: string;
	patronymic?: string;
	birth_date: string;
	phone: string;
	specialization: string;
	note?: string;
}
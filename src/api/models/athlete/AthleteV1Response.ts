export interface AthleteV1Response {
	id: string;
	secondName: string;
	firstName: string;
	middleName: string | null;
	birthDate: Date;
	photoUrl: string | null;
	phone: string | null;
	parentSecondName: string | null;
	parentFirstName: string | null;
	parentMiddleName: string | null;
	parentPhone: string | null;
	isActive: boolean;
}

export default AthleteV1Response;

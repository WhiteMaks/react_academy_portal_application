export interface PutAthleteV1Request {
	secondName: string;
	firstName: string;
	middleName: string | null;
	birthDate: Date;
	phone: string | null;
	parentSecondName: string | null;
	parentFirstName: string | null;
	parentMiddleName: string | null;
	parentPhone: string | null;
}

export default PutAthleteV1Request;

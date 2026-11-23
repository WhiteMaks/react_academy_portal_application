export interface PostAthleteV1Request {
	secondName: string;
	firstName: string;
	middleName: string | null;
	birthDate: Date;
	photoUrl: null;
	phone: string | null;
	parentSecondName: string | null;
	parentFirstName: string | null;
	parentMiddleName: string | null;
	parentPhone: string | null;
}

export default PostAthleteV1Request;

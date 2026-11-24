export interface AthleteV1Response {
	id: string;
	secondName: string;
	firstName: string;
	middleName: string | null;
	// Keep API responses Redux-serializable; requests still use Date values.
	birthDate: string;
	photoUrl: string | null;
	phone: string | null;
	parentSecondName: string | null;
	parentFirstName: string | null;
	parentMiddleName: string | null;
	parentPhone: string | null;
	isActive: boolean;
	isCoach: boolean;
	updatedAt: string;
}

export default AthleteV1Response;

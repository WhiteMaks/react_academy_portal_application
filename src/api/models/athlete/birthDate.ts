export const parseDateInput = (value: unknown): Date | null => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [year, month, day] = value.split("-").map(Number);
	if (year < 1 || month < 1 || month > 12 || day < 1) return null;
	const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (day > daysInMonth[month - 1]) return null;
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(0, 0, 0, 0);
	return date;
};

export const formatBirthDateDisplayInput = (value: string): string => {
	const digits = value.replace(/\D/g, "").slice(0, 8);
	if (digits.length <= 2) return digits;
	if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
	return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

export const parseBirthDateDisplayInput = (value: unknown): Date | null => {
	if (typeof value !== "string" || !/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return null;
	const [day, month, year] = value.split(".");
	return parseDateInput(`${year}-${month}-${day}`);
};

export const formatDateInput = (value: Date): string | null => {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
	const year = value.getUTCFullYear();
	const month = value.getUTCMonth() + 1;
	const day = value.getUTCDate();
	if (year < 1 || year > 9999) return null;
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const formatBirthDateDmy = (value: Date): string | null => {
	const date = formatDateInput(value);
	return date ? date.split("-").reverse().join(".") : null;
};

export const parseBirthDateWire = (value: unknown): Date | null => {
	if (typeof value !== "string" || !/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/.test(value)) return null;
	const datePart = value.slice(0, 10);
	return parseDateInput(datePart);
};

export const formatBirthDateWire = (value: Date): string | null => {
	const datePart = formatDateInput(value);
	if (!datePart || value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0 || value.getUTCMilliseconds() !== 0) return null;
	return value.toISOString();
};

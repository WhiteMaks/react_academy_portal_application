const pluralYears = (n: number): string => {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return `${n} год`;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} года`;
	return `${n} лет`;
};

export const parseIsoDate = (iso: string): Date | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		return null;
	}
	return date;
};

export const formatDateRu = (iso: string): string => {
	const date = parseIsoDate(iso);
	if (!date) return iso;
	const d = String(date.getUTCDate()).padStart(2, "0");
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const y = date.getUTCFullYear();
	return `${d}.${m}.${y}`;
};

export const computeAgeYears = (iso: string): number | null => {
	const birth = parseIsoDate(iso);
	if (!birth) return null;
	const today = new Date();
	let age = today.getFullYear() - birth.getUTCFullYear();
	const monthDiff = today.getMonth() - birth.getUTCMonth();
	const dayDiff = today.getDate() - birth.getUTCDate();
	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
	return age >= 0 ? age : null;
};

export const formatAgeRu = (iso: string): string => {
	const age = computeAgeYears(iso);
	return age === null ? "—" : pluralYears(age);
};

export const formatPersonName = (first: string, last: string, patronymic?: string | null): string => {
	const head = [first.trim(), last.trim()].filter(Boolean).join(" ");
	return patronymic?.trim() ? `${head} ${patronymic.trim()}` : head;
};

export const athleteInitials = (first: string, last: string): string => {
	const a = first.trim().charAt(0);
	const b = last.trim().charAt(0);
	return `${a}${b}`.toUpperCase();
};

export const activityStatusLabel = (status: string): {text: string; active: boolean} => {
	const active = status === "active";
	return {text: active ? "Активен" : "Неактивен", active};
};

export const formatNoteCell = (note?: string | null): string => {
	const trimmed = note?.trim();
	return trimmed ? trimmed : "—";
};

/** Ограничение сегментов: день 01–31, месяц 01–12 (как в реальном календаре). */
const clampBirthDateDigits = (digits: string): string => {
	let next = digits.slice(0, 8);
	if (next.length >= 2) {
		let day = Number(next.slice(0, 2));
		if (day > 31) day = 31;
		if (day < 1) day = 1;
		next = String(day).padStart(2, "0") + next.slice(2);
	}
	if (next.length >= 4) {
		let month = Number(next.slice(2, 4));
		if (month > 12) month = 12;
		if (month < 1) month = 1;
		next = next.slice(0, 2) + String(month).padStart(2, "0") + next.slice(4);
	}
	return next;
};

/** Mask input: digits only, auto dots, max 8 digits → dd.mm.yyyy display */
export const maskBirthDateInput = (raw: string): string => {
	const digits = clampBirthDateDigits(raw.replace(/\D/g, ""));
	if (digits.length <= 2) return digits;
	if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
	return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

export const isCompleteBirthDateMask = (value: string): boolean =>
	/^\d{2}\.\d{2}\.\d{4}$/.test(value.trim());

export const birthDateMaskToIso = (mask: string): string | null => {
	const trimmed = mask.trim();
	if (!isCompleteBirthDateMask(trimmed)) return null;
	const [d, m, y] = trimmed.split(".").map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
	return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

export const BIRTH_DATE_FUTURE_MSG = "Дата рождения не может быть в будущем";
const BIRTH_DATE_INVALID_MSG = "Укажите существующую дату в формате дд.мм.гггг";

/** Календарное сравнение с сегодня (локальная дата пользователя). */
export const isBirthDateNotAfterToday = (iso: string): boolean => {
	const birth = parseIsoDate(iso);
	if (!birth) return false;
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const birthLocal = new Date(
		birth.getUTCFullYear(),
		birth.getUTCMonth(),
		birth.getUTCDate()
	);
	return birthLocal.getTime() <= today.getTime();
};

export const validateBirthDateMask = (mask: string): {iso: string | null; error?: string} => {
	if (!isCompleteBirthDateMask(mask.trim())) {
		return {iso: null, error: BIRTH_DATE_INVALID_MSG};
	}
	const iso = birthDateMaskToIso(mask);
	if (!iso) {
		return {iso: null, error: BIRTH_DATE_INVALID_MSG};
	}
	if (!isBirthDateNotAfterToday(iso)) {
		return {iso: null, error: BIRTH_DATE_FUTURE_MSG};
	}
	return {iso};
};

export {maskPhoneInput, normalizePhoneE164} from "./phoneInput";

export const parentBlockFilled = (fields: Record<string, string>): boolean =>
	Object.values(fields).some(v => v.trim().length > 0);

export const parentBlockComplete = (fields: Record<string, string>): boolean =>
	Object.values(fields).every(v => v.trim().length > 0);
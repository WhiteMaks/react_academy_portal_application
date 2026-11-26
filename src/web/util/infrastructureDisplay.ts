import HallV1Response from "../../api/models/hall/HallV1Response";

export const branchInitials = (name: string): string => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "—";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

export const formatHallCapacity = (capacity: number): string => `${capacity} человек`;

export const formatHallsCountCell = (
	active: number | undefined,
	total: number | undefined
): string => {
	if (active === undefined || total === undefined) return "—";
	return `${active} / ${total}`;
};

export const computeHallCounts = (halls: HallV1Response[]): {active: number; total: number} => {
	const total = halls.length;
	const active = halls.filter(h => h.activity_status === "active").length;
	return {active, total};
};

const hallsWord = (n: number): string => {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return "зал";
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "зала";
	return "залов";
};

export const formatBranchHallsSummary = (address: string, hallsTotal: number): string =>
	hallsTotal === 0 ? `${address} · залов пока нет` : `${address} · ${hallsTotal} ${hallsWord(hallsTotal)} в филиале`;

export const formatHallDetailSummary = (capacity: number, subtitle?: string | null): string => {
	const cap = formatHallCapacity(capacity);
	const sub = subtitle?.trim();
	return sub ? `Вместимость ${cap} · ${sub.toLowerCase()}` : `Вместимость ${cap}`;
};

export const HALL_GROUPS_PLACEHOLDER = "Пока не назначены";
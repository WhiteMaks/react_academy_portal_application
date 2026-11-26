export type AdminNavItem = {
	path: string;
	label: string;
	icon: string;
	match: (pathname: string) => boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
	{path: "/", label: "Главная", icon: "⌂", match: p => p === "/"},
	{path: "/athletes", label: "Спортсмены", icon: "♙", match: p => p.startsWith("/athletes")},
	{path: "/coaches", label: "Тренеры", icon: "♟", match: p => p.startsWith("/coaches")},
	{path: "/gyms", label: "Спортзалы", icon: "▦", match: p => p.startsWith("/gyms")},
	{path: "/groups", label: "Группы", icon: "◉", match: p => p.startsWith("/groups")},
	{path: "/schedule", label: "Расписание", icon: "▣", match: p => p.startsWith("/schedule")},
	{path: "/attendance", label: "Посещаемость", icon: "✓", match: p => p.startsWith("/attendance")},
	{path: "/payments", label: "Платежи", icon: "₽", match: p => p.startsWith("/payments")}
];

export const resolveCrumbTitle = (pathname: string): string => {
	if (pathname === "/") return "Главная";
	const item = ADMIN_NAV_ITEMS.find(nav => nav.match(pathname) && nav.path !== "/");
	return item?.label ?? "Раздел";
};
/**
 * E.164 ввод — синхронно с go/util/phone_e164.go и mask в формах.
 * Не дублировать фильтры в страницах; импорт отсюда.
 */
export const maskPhoneInput = (value: string, maxLen = 32): string => {
	let out = "";
	for (const ch of value) {
		if (ch === "+" && out.length === 0) {
			out += ch;
		} else if (/\d/.test(ch)) {
			const digits = (out.match(/\d/g) ?? []).length;
			if (digits < 15) out += ch;
		} else if ((ch === " " || ch === "-") && out.length > 0 && !/[\s-]$/.test(out)) {
			out += ch;
		}
	}
	if (out.length <= maxLen) return out;
	return out.slice(0, maxLen);
};

export const normalizePhoneE164 = (raw: string): string | null => {
	const trimmed = raw.trim();
	const collapsed = trimmed.replace(/[\s-]/g, "");
	if (!/^\+[1-9]\d{7,14}$/.test(collapsed)) return null;
	return collapsed;
};
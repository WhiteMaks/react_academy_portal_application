import AcademyPortalService from "../AcademyPortalService";
import GetBranchHallsV1Response from "../models/hall/GetBranchHallsV1Response";
import HallV1Response from "../models/hall/HallV1Response";
import {LIST_QUERY_MAX_LIMIT} from "../constants/listPagination";

/** Собирает все страницы вложенного list залов (limit на API ≤ LIST_QUERY_MAX_LIMIT). */
export async function fetchAllBranchHalls(
	service: AcademyPortalService,
	branchId: string
): Promise<GetBranchHallsV1Response> {
	const halls: HallV1Response[] = [];
	let offset = 0;
	let total = 0;

	while (true) {
		const page = await service.getBranchHallsV1(branchId, {
			limit: LIST_QUERY_MAX_LIMIT,
			offset
		});
		total = page.total;
		halls.push(...page.halls);
		offset += page.halls.length;
		if (page.halls.length === 0 || halls.length >= total) {
			break;
		}
	}

	return {
		halls,
		total,
		limit: LIST_QUERY_MAX_LIMIT,
		offset: 0
	};
}
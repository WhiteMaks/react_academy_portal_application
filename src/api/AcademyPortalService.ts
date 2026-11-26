import GetMicroserviceV1Response from "./models/microservice/GetMicroserviceV1Response";
import PostUserTokenV1Response from "./models/user/PostUserTokenV1Response";
import PostUserTokenV1Request from "./models/user/PostUserTokenV1Request";
import GetUserV1Response from "./models/user/GetUserV1Response";
import {ApiError} from "./ApiError";
import PostUserV1Request from "./models/user/PostUserV1Request";
import PostUserV1Response from "./models/user/PostUserV1Response";
import GetAthletesV1Response from "./models/athlete/GetAthletesV1Response";
import AthleteV1Response from "./models/athlete/AthleteV1Response";
import PostAthleteV1Request from "./models/athlete/PostAthleteV1Request";
import PutAthleteV1Request from "./models/athlete/PutAthleteV1Request";
import GetCoachesV1Response from "./models/coach/GetCoachesV1Response";
import CoachV1Response from "./models/coach/CoachV1Response";
import PostCoachV1Request from "./models/coach/PostCoachV1Request";
import PutCoachV1Request from "./models/coach/PutCoachV1Request";
import GetBranchesV1Response from "./models/branch/GetBranchesV1Response";
import BranchV1Response from "./models/branch/BranchV1Response";
import PostBranchV1Request from "./models/branch/PostBranchV1Request";
import PutBranchV1Request from "./models/branch/PutBranchV1Request";
import GetBranchHallsV1Response from "./models/hall/GetBranchHallsV1Response";
import HallV1Response from "./models/hall/HallV1Response";
import PostHallV1Request from "./models/hall/PostHallV1Request";
import PutHallV1Request from "./models/hall/PutHallV1Request";

class AcademyPortalService {
	private static instance: AcademyPortalService | null = null;

	private readonly host: string;

	private readonly API: string = "/api";
	private readonly V1: string = "/v1";

	private readonly MICROSERVICE: string = this.API + "/microservice";
	private readonly MICROSERVICE_V1: string = this.MICROSERVICE + this.V1;

	private readonly USER: string = this.API + "/user";
	private readonly USER_V1: string = this.USER + this.V1;
	private readonly USER_TOKEN: string = this.USER + "/token";
	private readonly USER_TOKEN_V1: string = this.USER_TOKEN + this.V1;
	private readonly USER_ADMIN: string = this.USER + "/admin";
	private readonly USER_ADMIN_V1: string = this.USER_ADMIN + this.V1;

	private readonly ATHLETE: string = this.API + "/athlete";
	private readonly ATHLETE_V1: string = this.ATHLETE + this.V1;
	private readonly ATHLETES: string = this.API + "/athletes";
	private readonly ATHLETES_V1: string = this.ATHLETES + this.V1;

	private readonly COACH: string = this.API + "/coach";
	private readonly COACH_V1: string = this.COACH + this.V1;
	private readonly COACHES: string = this.API + "/coaches";
	private readonly COACHES_V1: string = this.COACHES + this.V1;

	private readonly BRANCH: string = this.API + "/branch";
	private readonly BRANCH_V1: string = this.BRANCH + this.V1;
	private readonly BRANCHES: string = this.API + "/branches";
	private readonly BRANCHES_V1: string = this.BRANCHES + this.V1;

	private readonly HALL: string = this.API + "/hall";
	private readonly HALL_V1: string = this.HALL + this.V1;
	private readonly HALLS: string = this.API + "/halls";
	private readonly HALLS_V1: string = this.HALLS + this.V1;

	private constructor(host: string) {
		this.host = host;
	}

	public static getInstance(): AcademyPortalService {
		if (AcademyPortalService.instance != null) {
			return AcademyPortalService.instance;
		}

		const host = process.env.REACT_APP_SERVICE_HOST;

		AcademyPortalService.instance = new AcademyPortalService(host ? host : "");
		return AcademyPortalService.instance;
	}

	public async getMicroserviceV1(): Promise<GetMicroserviceV1Response> {
		const url = this.host + this.MICROSERVICE_V1;
		let response: Response;
		try {
			response = await fetch(url, {method: "GET"});
		} catch {
			throw new ApiError("service");
		}

		if (!response.ok) {
			throw new ApiError("service", response.status);
		}

		try {
			const data: unknown = await response.json();
			if (!this.isRecord(data) || typeof data.readyToUse !== "boolean") {
				throw new ApiError("service", response.status);
			}
			return {readyToUse: data.readyToUse};
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async postUserV1(request: PostUserV1Request): Promise<PostUserV1Response> {
		const url = this.host + this.USER_ADMIN_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}

		if (response.status === 404 || response.status === 400 || response.status === 409) {
			throw new ApiError("request", response.status);
		}
		if (!response.ok) {
			throw new ApiError("service", response.status);
		}
		if (response.status !== 201) {
			throw new ApiError("service", response.status);
		}

		try {
			const data: unknown = await response.json();
			if (!this.isRecord(data) || typeof data.id !== "number" || !Number.isSafeInteger(data.id)) {
				throw new ApiError("service", response.status);
			}
			return {id: data.id};
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async getUserV1(): Promise<GetUserV1Response> {
		const url = this.host + this.USER_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "GET",
				headers: this.generateHeaders()
			});
		} catch {
			throw new ApiError("service");
		}

		if (!response.ok) {
			throw new ApiError(response.status === 401 ? "unauthorized" : "service", response.status);
		}

		try {
			const data: unknown = await response.json();
			if (!this.isUserResponse(data)) {
				throw new ApiError("service", response.status);
			}
			return data;
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async getAthletesV1(params: {q?: string; limit?: number; offset?: number}): Promise<GetAthletesV1Response> {
		const search = new URLSearchParams();
		if (params.q?.trim()) search.set("q", params.q.trim());
		if (params.limit !== undefined) search.set("limit", String(params.limit));
		if (params.offset !== undefined) search.set("offset", String(params.offset));
		const query = search.toString();
		const url = this.host + this.ATHLETES_V1 + (query ? `?${query}` : "");
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isAthletesListResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getAthleteV1(id: string): Promise<AthleteV1Response> {
		const url = `${this.host}${this.ATHLETES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isAthleteResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async putAthleteV1(id: string, request: PutAthleteV1Request): Promise<AthleteV1Response> {
		const url = `${this.host}${this.ATHLETES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "PUT",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isAthleteResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getCoachesV1(params: {q?: string; limit?: number; offset?: number}): Promise<GetCoachesV1Response> {
		const search = new URLSearchParams();
		if (params.q?.trim()) search.set("q", params.q.trim());
		if (params.limit !== undefined) search.set("limit", String(params.limit));
		if (params.offset !== undefined) search.set("offset", String(params.offset));
		const query = search.toString();
		const url = this.host + this.COACHES_V1 + (query ? `?${query}` : "");
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isCoachesListResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getCoachV1(id: string): Promise<CoachV1Response> {
		const url = `${this.host}${this.COACHES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isCoachResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async putCoachV1(id: string, request: PutCoachV1Request): Promise<CoachV1Response> {
		const url = `${this.host}${this.COACHES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "PUT",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isCoachResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getBranchesV1(params: {q?: string; limit?: number; offset?: number}): Promise<GetBranchesV1Response> {
		const search = new URLSearchParams();
		if (params.q?.trim()) search.set("q", params.q.trim());
		if (params.limit !== undefined) search.set("limit", String(params.limit));
		if (params.offset !== undefined) search.set("offset", String(params.offset));
		const query = search.toString();
		const url = this.host + this.BRANCHES_V1 + (query ? `?${query}` : "");
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isBranchesListResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getBranchV1(id: string): Promise<BranchV1Response> {
		const url = `${this.host}${this.BRANCHES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isBranchResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async putBranchV1(id: string, request: PutBranchV1Request): Promise<BranchV1Response> {
		const url = `${this.host}${this.BRANCHES_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "PUT",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isBranchResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async postBranchV1(request: PostBranchV1Request): Promise<BranchV1Response> {
		const url = this.host + this.BRANCH_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		if (response.status !== 201) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isBranchResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getBranchHallsV1(
		branchId: string,
		params?: {q?: string; limit?: number; offset?: number}
	): Promise<GetBranchHallsV1Response> {
		const search = new URLSearchParams();
		if (params?.q?.trim()) search.set("q", params.q.trim());
		if (params?.limit !== undefined) search.set("limit", String(params.limit));
		if (params?.offset !== undefined) search.set("offset", String(params.offset));
		const query = search.toString();
		const url =
			`${this.host}${this.BRANCHES_V1}/${encodeURIComponent(branchId)}/halls${this.V1}` +
			(query ? `?${query}` : "");
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isBranchHallsListResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async getHallV1(id: string): Promise<HallV1Response> {
		const url = `${this.host}${this.HALLS_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {method: "GET", headers: this.generateHeaders()});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isHallResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async putHallV1(id: string, request: PutHallV1Request): Promise<HallV1Response> {
		const url = `${this.host}${this.HALLS_V1}/${encodeURIComponent(id)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "PUT",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) {
			const message = await this.readErrorMessage(response);
			throw new ApiError("request", response.status, message);
		}
		if (!response.ok) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isHallResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async postHallV1(request: PostHallV1Request): Promise<HallV1Response> {
		const url = this.host + this.HALL_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		if (response.status !== 201) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isHallResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async postCoachV1(request: PostCoachV1Request): Promise<CoachV1Response> {
		const url = this.host + this.COACH_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		if (response.status !== 201) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isCoachResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async postAthleteV1(request: PostAthleteV1Request): Promise<AthleteV1Response> {
		const url = this.host + this.ATHLETE_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json", ...this.generateHeaders()},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError("service", response.status);
		if (response.status !== 201) throw new ApiError("service", response.status);
		try {
			const data: unknown = await response.json();
			if (!this.isAthleteResponse(data)) throw new ApiError("service", response.status);
			return data;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			throw new ApiError("service", response.status);
		}
	}

	public async postUserTokenV1(request: PostUserTokenV1Request): Promise<PostUserTokenV1Response> {
		const url = this.host + this.USER_TOKEN_V1;
		let response: Response;
		try {
			response = await fetch(url, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(request)
			});
		} catch {
			throw new ApiError("service");
		}

		if (!response.ok) {
			if (response.status === 401) {
				throw new ApiError("credentials", response.status);
			}
			throw new ApiError(response.status >= 500 ? "service" : "request", response.status);
		}

		try {
			const data: unknown = await response.json();
			if (!this.isTokenResponse(data)) {
				throw new ApiError("service", response.status);
			}
			return data;
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	private generateHeaders(): Record<string, string> {
		const token = localStorage.getItem("token");
		return token ? {"Authorization": `Bearer ${token}`} : {};
	}

	private async readErrorMessage(response: Response): Promise<string | undefined> {
		try {
			const data: unknown = await response.json();
			if (this.isRecord(data) && typeof data.message === "string" && data.message.trim() !== "") {
				return data.message.trim();
			}
		} catch {
			/* ignore */
		}
		return undefined;
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null;
	}

	private isUserResponse(value: unknown): value is GetUserV1Response {
		return this.isRecord(value) && typeof value.id === "number" &&
			typeof value.username === "string" && typeof value.role === "string";
	}

	private isTokenResponse(value: unknown): value is PostUserTokenV1Response {
		return this.isRecord(value) && typeof value.token === "string" && value.token.length > 0;
	}

	private isAthleteResponse(value: unknown): value is AthleteV1Response {
		return this.isRecord(value) &&
			typeof value.id === "number" &&
			typeof value.last_name === "string" &&
			typeof value.first_name === "string" &&
			typeof value.birth_date === "string" &&
			typeof value.phone === "string" &&
			typeof value.activity_status === "string";
	}

	private isAthletesListResponse(value: unknown): value is GetAthletesV1Response {
		if (!this.isRecord(value) || !Array.isArray(value.athletes)) return false;
		return typeof value.total === "number" &&
			typeof value.limit === "number" &&
			typeof value.offset === "number" &&
			value.athletes.every(item => this.isAthleteResponse(item));
	}

	private isCoachResponse(value: unknown): value is CoachV1Response {
		return this.isRecord(value) &&
			typeof value.id === "number" &&
			typeof value.last_name === "string" &&
			typeof value.first_name === "string" &&
			typeof value.birth_date === "string" &&
			typeof value.phone === "string" &&
			typeof value.specialization === "string" &&
			typeof value.activity_status === "string";
	}

	private isCoachesListResponse(value: unknown): value is GetCoachesV1Response {
		if (!this.isRecord(value) || !Array.isArray(value.coaches)) return false;
		return typeof value.total === "number" &&
			typeof value.limit === "number" &&
			typeof value.offset === "number" &&
			value.coaches.every(item => this.isCoachResponse(item));
	}

	private isBranchResponse(value: unknown): value is BranchV1Response {
		return this.isRecord(value) &&
			typeof value.id === "number" &&
			typeof value.name === "string" &&
			typeof value.address === "string" &&
			typeof value.activity_status === "string";
	}

	private isBranchesListResponse(value: unknown): value is GetBranchesV1Response {
		if (!this.isRecord(value) || !Array.isArray(value.branches)) return false;
		return typeof value.total === "number" &&
			typeof value.limit === "number" &&
			typeof value.offset === "number" &&
			value.branches.every(item => this.isBranchResponse(item));
	}

	private isHallResponse(value: unknown): value is HallV1Response {
		return this.isRecord(value) &&
			typeof value.id === "number" &&
			typeof value.branch_id === "number" &&
			typeof value.name === "string" &&
			typeof value.capacity === "number" &&
			typeof value.activity_status === "string";
	}

	private isBranchHallsListResponse(value: unknown): value is GetBranchHallsV1Response {
		if (!this.isRecord(value) || !Array.isArray(value.halls)) return false;
		return typeof value.total === "number" &&
			typeof value.limit === "number" &&
			typeof value.offset === "number" &&
			value.halls.every(item => this.isHallResponse(item));
	}
}

export default AcademyPortalService;
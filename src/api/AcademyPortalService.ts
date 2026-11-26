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
}

export default AcademyPortalService;
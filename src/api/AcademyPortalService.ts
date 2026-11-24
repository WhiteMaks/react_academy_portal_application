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
import {formatBirthDateWire, parseBirthDateWire} from "./models/athlete/birthDate";

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

	public async getAthletesV1(options: {status: "active" | "archived"; q?: string; limit: number; offset: number; isCoach?: boolean} = {status: "active", limit: 50, offset: 0}): Promise<GetAthletesV1Response> {
		const response = await this.fetchAthletes("GET", undefined, options);
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);

		try {
			const data: unknown = await response.json();
			if (!this.isRecord(data) || !Array.isArray(data.athletes) || !Number.isSafeInteger(data.total) || !Number.isSafeInteger(data.limit) || !Number.isSafeInteger(data.offset)) {
				throw new ApiError("service", response.status);
			}
			const athletes: AthleteV1Response[] = [];
			for (const item of data.athletes) {
				const athlete = this.parseAthleteResponse(item);
				if (!athlete) throw new ApiError("service", response.status);
				athletes.push(athlete);
			}
			return {athletes, total: data.total as number, limit: data.limit as number, offset: data.offset as number};
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async setAthleteCoachV1(id: string, isCoach: boolean): Promise<AthleteV1Response> {
		if (!/^[1-9]\d*$/.test(id)) throw new ApiError("request");
		const url = this.host + this.ATHLETE + "/" + id + "/coach" + this.V1;
		let response: Response;
		try { response = await fetch(url, {method: "PUT", headers: {...this.generateHeaders(), "Content-Type": "application/json"}, body: JSON.stringify({isCoach})}); }
		catch { throw new ApiError("service"); }
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);
		try { const athlete = this.parseAthleteResponse(await response.json()); if (!athlete || athlete.id !== id || athlete.isCoach !== isCoach) throw new ApiError("service", response.status); return athlete; }
		catch { throw new ApiError("service", response.status); }
	}

	public async postAthleteV1(request: PostAthleteV1Request): Promise<AthleteV1Response> {
		const response = await this.fetchAthletes("POST", request);
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);
		if (response.status !== 201) throw new ApiError("service", response.status);

		try {
			const data: unknown = await response.json();
			const athlete = this.parseAthleteResponse(data);
			if (!athlete) throw new ApiError("service", response.status);
			return athlete;
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async setAthleteArchivedV1(id: string, archived: boolean): Promise<AthleteV1Response> {
		if (!/^[1-9]\d*$/.test(id)) throw new ApiError("request");
		const url = this.host + this.ATHLETE + "/" + id + (archived ? "/archive" : "/restore") + this.V1;
		let response: Response;
		try { response = await fetch(url, {method: "POST", headers: this.generateHeaders()}); }
		catch { throw new ApiError("service"); }
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 409) throw new ApiError("conflict", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);
		try { const athlete = this.parseAthleteResponse(await response.json()); if (!athlete) throw new ApiError("service", response.status); return athlete; }
		catch { throw new ApiError("service", response.status); }
	}

	public async getAthleteV1(id: string): Promise<AthleteV1Response> {
		const response = await this.fetchAthleteItem("GET", id);
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);

		try {
			const data: unknown = await response.json();
			const athlete = this.parseAthleteResponse(data);
			if (!athlete) throw new ApiError("service", response.status);
			return athlete;
		} catch {
			throw new ApiError("service", response.status);
		}
	}

	public async putAthleteV1(id: string, request: PutAthleteV1Request): Promise<AthleteV1Response> {
		const birthDate = formatBirthDateWire(request.birthDate);
		if (!birthDate) throw new ApiError("request");
		const response = await this.fetchAthleteItem("PUT", id, {...request, birthDate});
		if (response.status === 401) throw new ApiError("unauthorized", response.status);
		if (response.status === 403) throw new ApiError("forbidden", response.status);
		if (response.status === 404) throw new ApiError("notFound", response.status);
		if (response.status === 400) throw new ApiError("request", response.status);
		if (!response.ok) throw new ApiError(response.status >= 500 ? "service" : "request", response.status);
		if (response.status !== 200) throw new ApiError("service", response.status);

		try {
			const data: unknown = await response.json();
			const athlete = this.parseAthleteResponse(data);
			if (!athlete) throw new ApiError("service", response.status);
			return athlete;
		} catch {
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

	private async fetchAthletes(method: "GET" | "POST", request?: PostAthleteV1Request, options?: {status: "active" | "archived"; q?: string; limit: number; offset: number; isCoach?: boolean}): Promise<Response> {
		const query = new URLSearchParams();
		if (method === "GET" && options) { query.set("status", options.status); if (options.q) query.set("q", options.q); if (options.isCoach !== undefined) query.set("isCoach", String(options.isCoach)); query.set("limit", String(options.limit)); query.set("offset", String(options.offset)); }
		const url = this.host + this.ATHLETE_V1 + (query.size ? `?${query.toString()}` : "");
		let body: string | undefined;
		if (request) {
			const birthDate = formatBirthDateWire(request.birthDate);
			if (!birthDate) throw new ApiError("request");
			body = JSON.stringify({...request, birthDate});
		}
		try {
			return await fetch(url, {
				method,
				headers: request ? {...this.generateHeaders(), "Content-Type": "application/json"} : this.generateHeaders(),
				...(body ? {body} : {})
			});
		} catch {
			throw new ApiError("service");
		}
	}

	private async fetchAthleteItem(method: "GET" | "PUT", id: string, request?: object): Promise<Response> {
		if (!/^[1-9]\d*$/.test(id)) throw new ApiError("request");
		const url = this.host + this.ATHLETE + "/" + id + this.V1;
		let body: string | undefined;
		if (request) body = JSON.stringify(request);
		try {
			return await fetch(url, {
				method,
				headers: request ? {...this.generateHeaders(), "Content-Type": "application/json"} : this.generateHeaders(),
				...(body ? {body} : {})
			});
		} catch {
			throw new ApiError("service");
		}
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

	private isNullableString(value: unknown): value is string | null {
		return value === null || typeof value === "string";
	}

	private isUpdatedAt(value: unknown): value is string {
		if (typeof value !== "string") return false;
		const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/.exec(value);
		if (!match || !parseBirthDateWire(`${match[1]}T00:00:00Z`)) return false;
		return Number(match[2]) <= 23 && Number(match[3]) <= 59 && Number(match[4]) <= 59;
	}

	private parseAthleteResponse(value: unknown): AthleteV1Response | null {
		if (!this.isRecord(value) || typeof value.id !== "string" || !/^\d+$/.test(value.id) ||
			typeof value.secondName !== "string" || typeof value.firstName !== "string" ||
			!this.isNullableString(value.middleName) || !this.isNullableString(value.photoUrl) ||
			!this.isNullableString(value.phone) || !this.isNullableString(value.parentSecondName) ||
			!this.isNullableString(value.parentFirstName) || !this.isNullableString(value.parentMiddleName) ||
			!this.isNullableString(value.parentPhone) || typeof value.isActive !== "boolean" || typeof value.isCoach !== "boolean" ||
			!this.isUpdatedAt(value.updatedAt)) return null;

		if (!parseBirthDateWire(value.birthDate)) return null;
		return {
			id: value.id, secondName: value.secondName, firstName: value.firstName,
			middleName: value.middleName, birthDate: value.birthDate as string, photoUrl: value.photoUrl, phone: value.phone,
			parentSecondName: value.parentSecondName, parentFirstName: value.parentFirstName,
			parentMiddleName: value.parentMiddleName, parentPhone: value.parentPhone, isActive: value.isActive, isCoach: value.isCoach,
			updatedAt: value.updatedAt
		};
	}
}

export default AcademyPortalService;

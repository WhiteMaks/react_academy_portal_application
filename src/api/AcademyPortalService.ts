import GetMicroserviceV1Response from "./models/microservice/GetMicroserviceV1Response";
import PostUserTokenV1Response from "./models/user/PostUserTokenV1Response";
import PostUserTokenV1Request from "./models/user/PostUserTokenV1Request";
import GetUserV1Response from "./models/user/GetUserV1Response";
import {ApiError} from "./ApiError";
import PostUserV1Request from "./models/user/PostUserV1Request";
import PostUserV1Response from "./models/user/PostUserV1Response";

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
}

export default AcademyPortalService;
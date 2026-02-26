import GetMicroserviceV1Response from "./models/microservice/GetMicroserviceV1Response";
import PostUserTokenV1Response from "./models/user/PostUserTokenV1Response";
import PostUserTokenV1Request from "./models/user/PostUserTokenV1Request";
import GetUserV1Response from "./models/user/GetUserV1Response";

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
		const response = await fetch(url, {method: "GET"});

		if (!response.ok) {
			throw new Error("Ошибка получения данных сервиса");
		}

		const data = await response.json();
		return data as GetMicroserviceV1Response;
	}

	public async getUserV1(): Promise<GetUserV1Response> {
		const url = this.host + this.USER_V1;
		const response = await fetch(
			url,
			{
				method: "GET",
				headers: this.generateHeaders()
			}
		);

		if (!response.ok) {
			throw new Error("Ошибка получения данных пользователя");
		}

		const data = await response.json();
		return data as GetUserV1Response;
	}

	public async postUserTokenV1(request: PostUserTokenV1Request): Promise<PostUserTokenV1Response> {
		const url = this.host + this.USER_TOKEN_V1;
		const response = await fetch(
			url,
			{
				method: "POST",
				body: JSON.stringify(request)
			}
		);

		if (!response.ok) {
			throw new Error("Ошибка получения токена");
		}

		const data = await response.json();
		return data as PostUserTokenV1Response;
	}

	private generateHeaders(): HeadersInit {
		return {
			"Authorization": `Bearer ${localStorage.getItem("token")}`
		}
	}
}

export default AcademyPortalService;
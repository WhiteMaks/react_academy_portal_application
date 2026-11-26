export type ApiErrorKind = "credentials" | "unauthorized" | "forbidden" | "notFound" | "conflict" | "service" | "request" | "superseded";

export interface ApiFailure {
	kind: ApiErrorKind;
	status?: number;
	message?: string;
}

export class ApiError extends Error {
	public readonly kind: ApiErrorKind;
	public readonly status?: number;
	public readonly serverMessage?: string;

	public constructor(kind: ApiErrorKind, status?: number, serverMessage?: string) {
		super(serverMessage ?? kind);
		Object.setPrototypeOf(this, ApiError.prototype);
		this.name = "ApiError";
		this.kind = kind;
		this.status = status;
		this.serverMessage = serverMessage;
	}
}

const API_ERROR_KINDS: ReadonlySet<string> = new Set([
	"credentials", "unauthorized", "forbidden", "notFound", "conflict", "service", "request", "superseded"
]);

export const isApiFailure = (error: unknown): error is ApiFailure => {
	if (typeof error !== "object" || error === null || !("kind" in error)) {
		return false;
	}
	const kind = (error as ApiFailure).kind;
	return typeof kind === "string" && API_ERROR_KINDS.has(kind);
};

/** Нормализует ApiError, payload из redux `unwrap()` или неизвестную ошибку. */
export const toApiFailure = (error: unknown, fallback: ApiErrorKind = "service"): ApiFailure => {
	if (error instanceof ApiError) {
		return {kind: error.kind, status: error.status, message: error.serverMessage};
	}
	if (isApiFailure(error)) {
		const failure = error as ApiFailure;
		return {kind: failure.kind, status: failure.status, message: failure.message};
	}
	return {kind: fallback};
};

export type ApiErrorKind = "credentials" | "unauthorized" | "forbidden" | "service" | "request" | "superseded";

export interface ApiFailure {
	kind: ApiErrorKind;
	status?: number;
}

export class ApiError extends Error {
	public readonly kind: ApiErrorKind;
	public readonly status?: number;

	public constructor(kind: ApiErrorKind, status?: number) {
		super(kind);
		Object.setPrototypeOf(this, ApiError.prototype);
		this.name = "ApiError";
		this.kind = kind;
		this.status = status;
	}
}

export const toApiFailure = (error: unknown, fallback: ApiErrorKind = "service"): ApiFailure => {
	if (error instanceof ApiError) {
		return {kind: error.kind, status: error.status};
	}

	return {kind: fallback};
};

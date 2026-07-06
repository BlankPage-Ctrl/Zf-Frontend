const BASE = ''

type ErrorCode =
    | 'VALIDATION_FAILED'
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'TOKEN_EXPIRED'
    | 'NOT_FOUND'
    | 'ALREADY_EXISTS'
    | 'PATH_NOT_FOUND'
    | 'PATH_TRAVERSAL'
    | 'NOT_A_DIRECTORY'
    | 'NOT_A_FILE'
    | 'PERMISSION_DENIED'
    | 'FILE_TOO_LARGE'
    | 'WORKSPACE_NOT_FOUND'
    | 'INTERNAL_ERROR'
    | 'SERVICE_UNAVAILABLE'

interface ApiResponseMeta {
    req_id: string
    output_id: string
    timestamp: string
    process_time_ms: number
}

interface ApiResponseError {
    error_code: ErrorCode
    error_message: string
    details?: Record<string, unknown>
}

interface ApiResponse<T = unknown> {
    meta: ApiResponseMeta
    data?: T
    error?: ApiResponseError
}

/** Thrown when the API returns an error envelope. */
export class ApiError extends Error {
    readonly code: ErrorCode
    readonly meta: ApiResponseMeta
    readonly details?: Record<string, unknown>

    constructor(error: ApiResponseError, meta: ApiResponseMeta) {
        super(error.error_message)
        this.name = 'ApiError'
        this.code = error.error_code
        this.meta = meta
        this.details = error.details
    }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
    })

    if (res.status === 204) return undefined as T

    const text = await res.text()
    if (!text) return undefined as T

    const envelope: ApiResponse<T> = JSON.parse(text)

    if (envelope.error) {
        throw new ApiError(envelope.error, envelope.meta)
    }

    return envelope.data as T
}

export { request }

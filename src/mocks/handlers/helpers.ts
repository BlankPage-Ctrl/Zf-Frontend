import { HttpResponse } from 'msw'

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

function makeMeta() {
    return {
        req_id: crypto.randomUUID(),
        output_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        process_time_ms: 0,
    }
}

/** Wrap data in ApiResponse envelope for success responses. */
export function ok<T>(data: T, init?: ResponseInit) {
    return HttpResponse.json({ meta: makeMeta(), data }, init)
}

/** Build an ApiResponse error envelope. */
export function fail(code: ErrorCode, message: string, init?: ResponseInit) {
    return HttpResponse.json(
        { meta: makeMeta(), error: { error_code: code, error_message: message } },
        init,
    )
}

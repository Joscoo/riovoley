import { corsHeaders } from '../../_shared/cors.ts';

export const jsonResponse = (body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  },
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeMessage = Reflect.get(error, 'message');
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }

    try {
      return JSON.stringify(error);
    } catch (_serializationError) {
      return 'Error desconocido';
    }
  }

  return 'Error desconocido';
};

export const methodNotAllowed = () => jsonResponse(
  {
    success: false,
    code: 'METHOD_NOT_ALLOWED',
    message: 'Solo se permite POST',
    details: null,
    data: null,
  },
  405,
);

export const internalError = (error: unknown) => jsonResponse(
  {
    success: false,
    code: 'INTERNAL_ERROR',
    message: getErrorMessage(error),
    details: null,
    data: null,
  },
  500,
);

interface SuccessEnvelopeInput {
  success?: boolean;
  code: string;
  message: string;
  details?: unknown;
  data?: Record<string, unknown>;
  includeLegacyRootData?: boolean;
}

export const successEnvelope = (input: SuccessEnvelopeInput) => ({
  success: input.success ?? true,
  code: input.code,
  message: input.message,
  details: input.details ?? null,
  data: input.data ?? null,
  ...(input.includeLegacyRootData !== false ? (input.data || {}) : {}),
});

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
    message: error instanceof Error ? error.message : 'Error desconocido',
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

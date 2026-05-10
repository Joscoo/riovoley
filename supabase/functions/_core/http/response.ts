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
  },
  405,
);

export const internalError = (error: unknown) => jsonResponse(
  {
    success: false,
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Error desconocido',
    details: null,
  },
  500,
);

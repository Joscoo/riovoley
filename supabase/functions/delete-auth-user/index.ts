import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new HttpError(500, 'MISSING_ENV', 'Faltan variables de entorno de Supabase para ejecutar la función')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'No se proporcionó un token Bearer válido en Authorization')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'El token de autorización está vacío')
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      throw new HttpError(401, 'AUTH_INVALID', 'No autorizado. Tu sesión puede haber expirado.')
    }

    let { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if ((profileError || !userProfile) && profileError?.code === 'PGRST116') {
      const { data: profileFallback, error: fallbackError } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', requestingUser.id)
        .single()

      if (!fallbackError && profileFallback) {
        userProfile = profileFallback
        profileError = null
      }
    }

    if (profileError) {
      throw new HttpError(500, 'PROFILE_QUERY_FAILED', 'Error verificando permisos del usuario', profileError)
    }

    if (!userProfile) {
      throw new HttpError(403, 'PROFILE_NOT_FOUND', 'Usuario solicitante no encontrado en la tabla users')
    }

    const allowedRoles = ['admin', 'administrador', 'entrenador']
    if (!allowedRoles.includes(userProfile.role)) {
      throw new HttpError(403, 'ROLE_NOT_ALLOWED', `No tienes permisos para eliminar usuarios de Auth. Rol actual: ${userProfile.role}`)
    }

    let payload: { userId?: string }
    try {
      payload = await req.json()
    } catch (parseError) {
      throw new HttpError(400, 'INVALID_JSON', 'El cuerpo de la solicitud no es JSON válido', parseError)
    }

    const { userId } = payload
    if (!userId) {
      throw new HttpError(400, 'MISSING_FIELDS', 'userId es requerido')
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw new HttpError(500, 'AUTH_DELETE_FAILED', `No se pudo eliminar el usuario de Auth: ${deleteError.message}`, deleteError)
    }

    return jsonResponse(
      {
        success: true,
        code: 'AUTH_USER_DELETED',
        message: 'Usuario eliminado de Auth exitosamente',
      },
      200,
    )
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          error: error.message,
          details: error.details ?? null,
        },
        error.status,
      )
    }

    const fallbackMessage = error instanceof Error ? error.message : 'Error desconocido'
    return jsonResponse(
      {
        success: false,
        code: 'UNEXPECTED_ERROR',
        message: fallbackMessage,
        error: fallbackMessage,
      },
      500,
    )
  }
})

// supabase/functions/update-user-password/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Crear cliente de Supabase con service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticación del usuario que hace la petición
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      throw new Error('No se proporcionó token de autorización')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      throw new Error('No autorizado')
    }

    // Verificar que el usuario tenga rol de admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      throw new Error('No tienes permisos de administrador')
    }

    // Obtener datos del request
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      throw new Error('userId y newPassword son requeridos')
    }

    // Actualizar la contraseña del usuario
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contraseña actualizada exitosamente',
        data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const statusCode = errorMessage.includes('No autorizado') || errorMessage.includes('permisos') ? 403 : 500
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})

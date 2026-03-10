# Solución: Error de tipo en payment_id

## Problema
Error al guardar pagos: `column "payment_id" is of type bigint but expression is of type uuid`

## Causa
La tabla `payments_audit` fue creada con `payment_id` de tipo `BIGINT`, pero la tabla `payments` usa `UUID` para su columna `id` (estándar de Supabase). Cuando el trigger de auditoría intenta insertar un registro, falla por incompatibilidad de tipos.

## Solución

### Opción 1: Ejecutar desde el SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Abre **SQL Editor** en el menú lateral
3. Crea un nuevo query y copia todo el contenido del archivo:
   ```
   database/fix_payments_audit_type.sql
   ```
4. Ejecuta el script (botón RUN o Ctrl+Enter)
5. Verifica que la última consulta muestre: `payment_id | uuid`

### Opción 2: Ejecutar con psql

```bash
psql -h <tu-host-supabase> -U postgres -d postgres -f database/fix_payments_audit_type.sql
```

## Qué hace el script

1. **Deshabilita temporalmente** el trigger de auditoría
2. **Convierte** la columna `payment_id` de BIGINT a UUID
3. **Actualiza** las funciones `soft_delete_payment()` y `restore_payment()` para usar UUID
4. **Reactiva** el trigger de auditoría
5. **Verifica** que el cambio se aplicó correctamente

## Verificación

Después de ejecutar el script, intenta registrar un nuevo pago. El error debería estar resuelto.

Si persiste el problema, verifica en Supabase SQL Editor:

```sql
-- Verificar tipo de la columna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments_audit' 
  AND column_name = 'payment_id';

-- Debe mostrar: payment_id | uuid
```

## Nota
Los archivos corregidos:
- ✅ `database/fix_payments_audit_type.sql` - Script de corrección
- ✅ `database/setup_soft_delete_protection.sql` - Actualizado para futuros usos

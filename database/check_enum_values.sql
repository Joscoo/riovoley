-- Verificar los valores actuales del enum user_role_enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role_enum'
)
ORDER BY enumsortorder;

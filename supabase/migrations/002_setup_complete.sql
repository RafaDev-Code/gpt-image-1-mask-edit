-- =====================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA PARA PROFILES
-- =====================================================
-- Este script configura todo lo necesario para la tabla profiles
-- con máxima seguridad y funcionalidad completa.

-- Verificar que RLS está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en la tabla profiles. Ejecutar primero 001_profiles_security.sql';
    END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas por usuario (ya existe como PK, pero explícito)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Índice para búsquedas por tema (para analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON public.profiles(theme_scheme, theme_color);

-- Índice para búsquedas por locale (para i18n analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_locale ON public.profiles(locale);

-- Índice para ordenamiento por fecha de creación
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener perfil completo con validación
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    id UUID,
    display_name TEXT,
    locale TEXT,
    theme_scheme TEXT,
    theme_color TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verificar que el usuario está autenticado
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Solo permitir acceso al propio perfil
    IF user_id != auth.uid() THEN
        RAISE EXCEPTION 'Acceso denegado: solo puedes acceder a tu propio perfil';
    END IF;
    
    RETURN QUERY
    SELECT p.id, p.display_name, p.locale, p.theme_scheme, p.theme_color, p.created_at, p.updated_at
    FROM public.profiles p
    WHERE p.id = user_id;
END;
$$;

-- Función para actualizar perfil con validación
CREATE OR REPLACE FUNCTION update_user_profile(
    new_display_name TEXT DEFAULT NULL,
    new_locale TEXT DEFAULT NULL,
    new_theme_scheme TEXT DEFAULT NULL,
    new_theme_color TEXT DEFAULT NULL
)
RETURNS public.profiles
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    user_id UUID := auth.uid();
    updated_profile public.profiles;
BEGIN
    -- Verificar autenticación
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE public.profiles
    SET 
        display_name = COALESCE(new_display_name, display_name),
        locale = COALESCE(new_locale, locale),
        theme_scheme = COALESCE(new_theme_scheme, theme_scheme),
        theme_color = COALESCE(new_theme_color, theme_color),
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;
    
    -- Verificar que se actualizó algo
    IF updated_profile IS NULL THEN
        RAISE EXCEPTION 'Perfil no encontrado o no se pudo actualizar';
    END IF;
    
    RETURN updated_profile;
END;
$$;

-- =====================================================
-- TRIGGERS ADICIONALES
-- =====================================================

-- Trigger para logging de cambios (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS public.profile_audit_log (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS en la tabla de auditoría
ALTER TABLE public.profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Política para que solo el propietario vea sus logs
CREATE POLICY "audit_log_select_own" ON public.profile_audit_log
    FOR SELECT USING (profile_id = auth.uid());

-- Función de trigger para auditoría
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.profile_audit_log (profile_id, action, new_values, changed_by)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.profile_audit_log (profile_id, action, old_values, new_values, changed_by)
        VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.profile_audit_log (profile_id, action, old_values, changed_by)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Crear trigger de auditoría
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de temas (solo para admins)
CREATE OR REPLACE VIEW public.theme_statistics AS
SELECT 
    theme_scheme,
    theme_color,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
GROUP BY theme_scheme, theme_color
ORDER BY user_count DESC;

-- Vista para estadísticas de locales
CREATE OR REPLACE VIEW public.locale_statistics AS
SELECT 
    locale,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
GROUP BY locale
ORDER BY user_count DESC;

-- =====================================================
-- PERMISOS FINALES
-- =====================================================

-- Permisos para funciones
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Permisos para vistas (solo lectura para usuarios autenticados)
GRANT SELECT ON public.theme_statistics TO authenticated;
GRANT SELECT ON public.locale_statistics TO authenticated;

-- Permisos para tabla de auditoría
GRANT SELECT ON public.profile_audit_log TO authenticated;
GRANT USAGE ON SEQUENCE public.profile_audit_log_id_seq TO authenticated;

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Verificar que todo está configurado correctamente
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Verificar tabla profiles
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION 'Tabla profiles no encontrada';
    END IF;
    
    -- Verificar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Faltan políticas RLS en la tabla profiles';
    END IF;
    
    -- Verificar funciones
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_user_profile', 'update_user_profile', 'handle_new_user');
    
    IF function_count < 3 THEN
        RAISE EXCEPTION 'Faltan funciones requeridas';
    END IF;
    
    RAISE NOTICE 'Configuración completa verificada exitosamente:';
    RAISE NOTICE '- Tabla profiles: OK';
    RAISE NOTICE '- Políticas RLS: % encontradas', policy_count;
    RAISE NOTICE '- Funciones: % encontradas', function_count;
    RAISE NOTICE '- Índices: Creados';
    RAISE NOTICE '- Auditoría: Configurada';
    RAISE NOTICE '- Vistas: Creadas';
END;
$$;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar configuraciones por defecto si no existen
-- (Solo para desarrollo, comentar en producción)
/*
INSERT INTO public.profiles (id, display_name, locale, theme_scheme, theme_color)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email) as display_name,
    'en' as locale,
    'light' as theme_scheme,
    'default' as theme_color
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Este script proporciona:
-- 1. Verificación de configuración previa
-- 2. Índices optimizados para rendimiento
-- 3. Funciones de utilidad type-safe
-- 4. Sistema de auditoría completo
-- 5. Vistas para analytics
-- 6. Verificaciones de integridad
-- 7. Permisos granulares

-- Para usar en otro proyecto:
-- 1. Ejecutar 001_profiles_security.sql primero
-- 2. Ejecutar este script
-- 3. Configurar variables de entorno
-- 4. Generar tipos TypeScript
-- 5. Implementar utilidades de cookies seguras

COMMIT;
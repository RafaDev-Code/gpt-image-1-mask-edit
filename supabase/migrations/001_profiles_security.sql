-- =====================================================
-- MIGRACIÓN: Seguridad completa para tabla profiles
-- =====================================================

-- 1. Crear tabla profiles con constraints y triggers
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'es')),
  theme_scheme TEXT DEFAULT 'light' CHECK (theme_scheme IN ('light', 'dark')),
  theme_color TEXT DEFAULT 'default' CHECK (theme_color IN ('default', 'purple', 'blue', 'olive', 'tangerine')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Índices para optimización
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON public.profiles(updated_at);

-- 3. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS a prueba de balas

-- SELECT: Solo el dueño puede ver su perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Solo se puede insertar si el ID coincide con el usuario autenticado
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Solo el dueño puede actualizar su perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Solo el dueño puede eliminar su perfil (opcional)
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 6. Grants de permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Función helper para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, locale, theme_scheme, theme_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'theme_scheme', 'light'),
    COALESCE(NEW.raw_user_meta_data->>'theme_color', 'default')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para crear perfil automáticamente al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICACIÓN DE SEGURIDAD
-- =====================================================

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- =====================================================
-- NOTAS PARA REPRODUCIR EN OTRO PROYECTO
-- =====================================================

/*
1. Ejecutar este script en Supabase SQL Editor o via CLI:
   supabase db reset --linked
   supabase migration new profiles_security
   # Copiar este contenido al archivo de migración
   supabase db push

2. Verificar que las políticas funcionan:
   - Crear usuario de prueba
   - Intentar acceder a perfiles de otros usuarios (debe fallar)
   - Verificar que solo puede ver/editar su propio perfil

3. Para desarrollo local:
   supabase start
   supabase db reset
   supabase migration up

4. Para producción:
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
*/
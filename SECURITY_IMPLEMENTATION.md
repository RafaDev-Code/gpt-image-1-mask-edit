# Implementación de Seguridad y Tipos

Este documento describe la implementación completa de seguridad, tipos TypeScript y cookies seguras en la aplicación.

## 🔒 Row Level Security (RLS)

### Tabla `profiles`

La tabla `profiles` está protegida con RLS a prueba de balas:

```sql
-- Estructura de la tabla
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'es', 'fr', 'de')),
    theme_scheme TEXT NOT NULL DEFAULT 'light' CHECK (theme_scheme IN ('light', 'dark')),
    theme_color TEXT NOT NULL DEFAULT 'default' CHECK (theme_color IN ('default', 'purple', 'blue', 'olive', 'tangerine')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Políticas RLS
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = id);
```

### Características de Seguridad

- **Owner-only access**: Solo el propietario puede acceder a su perfil
- **Trigger `updated_at`**: Actualización automática del timestamp
- **Constraints**: Validación de valores permitidos
- **Cascade delete**: Eliminación automática al borrar usuario
- **Auto-creation**: Perfil creado automáticamente para nuevos usuarios

### Migración

Ejecutar el archivo de migración:

```bash
# En Supabase Dashboard > SQL Editor
# O usando Supabase CLI:
supabase db push
```

## 🎯 Tipos TypeScript 100% Type-Safe

### Generación de Tipos

```bash
# Generar tipos desde la base de datos
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/db.types.ts

# O usando la URL local
supabase gen types typescript --local > src/lib/db.types.ts
```

### Clientes Tipados

Todos los clientes Supabase están tipados:

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db.types';

export const supabaseBrowser = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Tipos de Aplicación

```typescript
// Tipos derivados de la base de datos
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Tipos específicos de la aplicación
export type ThemeScheme = 'light' | 'dark';
export type ThemeColor = 'default' | 'purple' | 'blue' | 'olive' | 'tangerine';
export type Locale = 'en' | 'es' | 'fr' | 'de';
```

### Validación en Tiempo de Compilación

El build fallará si:
- Faltan tipos en las consultas
- Se usan columnas inexistentes
- Los tipos no coinciden con el schema

## 🍪 Cookies Seguras

### Configuración de Cookies

```typescript
// Opciones base para todas las cookies
export const COOKIE_OPTIONS = {
  base: {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
  theme: {
    maxAge: 60 * 60 * 24 * 365, // 1 año
  },
  session: {
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    httpOnly: true,
  },
} as const;
```

### Validación de URLs

Prevención de open redirects:

```typescript
export function validateRedirectUrl(url: string, origin: string): string {
  try {
    // URLs relativas son seguras
    if (url.startsWith('/')) {
      return `${origin}${url}`;
    }
    
    const parsedUrl = new URL(url);
    const originUrl = new URL(origin);
    
    // Solo permitir mismo origen
    if (parsedUrl.origin === originUrl.origin) {
      return url;
    }
    
    // Fallback seguro
    return origin;
  } catch {
    return origin;
  }
}
```

### Utilidades de Cookies

- **Server-side**: `getServerThemeCookies()`, `setServerThemeCookies()`
- **Client-side**: `getClientThemeCookies()`, `setClientThemeCookies()`
- **Validación**: `validateThemeValues()`
- **Normalización**: Valores por defecto seguros

## 🔧 Implementación en Componentes

### Layout Principal

```typescript
// Obtener preferencias del usuario autenticado o cookies
if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('theme_scheme, theme_color, locale')
    .eq('id', user.id)
    .single();
    
  themeData = validateThemeValues(profile);
} else {
  themeData = getServerThemeCookies(cookieStore);
}
```

### Formulario de Configuración

```typescript
// Guardar con validación y cookies seguras
const validatedData = validateThemeValues(formData);

const { error } = await supabase
  .from('profiles')
  .upsert(validatedData)
  .eq('id', user.id);

if (!error) {
  setClientThemeCookies(validatedData);
}
```

### Callback de Autenticación

```typescript
// Validar URL de redirección
const safeRedirectUrl = validateRedirectUrl(next, origin);

// Establecer cookies seguras
response.cookies.set('auth-callback', 'success', {
  path: '/',
  maxAge: 60,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
});
```

## 🚀 Despliegue

### Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Checklist de Seguridad

- [ ] RLS habilitado en todas las tablas
- [ ] Políticas restrictivas implementadas
- [ ] Tipos TypeScript generados y aplicados
- [ ] Cookies con opciones seguras
- [ ] Validación de URLs de redirección
- [ ] Variables de entorno configuradas
- [ ] HTTPS habilitado en producción

## 📝 Mantenimiento

### Actualizar Tipos

```bash
# Después de cambios en el schema
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/db.types.ts
```

### Verificar Seguridad

```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Logs de Seguridad

- Monitorear intentos de acceso no autorizados
- Verificar cookies en headers de respuesta
- Auditar cambios en perfiles de usuario

## 🔍 Troubleshooting

### Errores Comunes

1. **RLS Policy Error**: Verificar que el usuario esté autenticado
2. **Type Error**: Regenerar tipos después de cambios en schema
3. **Cookie Error**: Verificar configuración de dominio y HTTPS
4. **Redirect Error**: Validar URLs permitidas

### Debug

```typescript
// Verificar usuario actual
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);

// Verificar cookies
console.log('Theme cookies:', getClientThemeCookies());
```

Esta implementación garantiza máxima seguridad y type-safety en toda la aplicación.
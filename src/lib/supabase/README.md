# Supabase Configuration

Esta carpeta contiene la configuración limpia y separada de Supabase para el proyecto.

## Archivos

### `client.ts`
- **Uso**: Componentes del cliente (browser)
- **Función**: `supabaseBrowser()`
- **Variables**: Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Características**: Cliente browser con autenticación de usuario

### `server.ts`
- **Uso**: Server Components y API routes
- **Función**: `supabaseServer()`
- **Variables**: Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Características**: Cliente servidor con manejo de cookies para SSR

### `admin.ts`
- **Uso**: Solo en servidor para operaciones administrativas
- **Función**: `supabaseAdmin()`
- **Variables**: `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- **⚠️ IMPORTANTE**: NO importar en componentes cliente

## Uso

```typescript
// En componentes cliente
import { supabaseBrowser } from '@/lib/supabase/client';
const supabase = supabaseBrowser();

// En Server Components
import { supabaseServer } from '@/lib/supabase/server';
const supabase = await supabaseServer();

// En API routes (operaciones admin)
import { supabaseAdmin } from '@/lib/supabase/admin';
const supabase = supabaseAdmin();
```

## Variables de Entorno

Configura en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio # Solo para admin
```
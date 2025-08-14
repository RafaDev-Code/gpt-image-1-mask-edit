'use client';
import { useState, useTransition } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { ProfileFormData, ThemeScheme, ThemeColor, Locale } from '@/lib/db.types';
import { validateThemeValues } from '@/lib/secure-cookies';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';
import { useTheme } from '@/components/theme-provider';

interface SettingsFormProps {
  initial: Partial<ProfileFormData> | null;
}

export default function SettingsForm({ initial }: SettingsFormProps) {
  const supabase = supabaseBrowser();
  const { toast } = useToast();
  const { setScheme: setThemeScheme, setColor: setThemeColor, setLocale: setThemeLocale } = useTheme();
  
  // Validar y establecer valores iniciales
  const validatedInitial = validateThemeValues({
    scheme: initial?.theme_scheme,
    color: initial?.theme_color,
    locale: initial?.locale,
  });
  
  const [displayName, setDisplayName] = useState(initial?.display_name || '');
  const [locale, setLocale] = useState<Locale>(validatedInitial.locale);
  const [scheme, setScheme] = useState<ThemeScheme>(validatedInitial.scheme);
  const [color, setColor] = useState<ThemeColor>(validatedInitial.color);
  const [pending, start] = useTransition();

  const onSave = () => start(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.",
        });
        return;
      }

      // Validar datos antes de enviar
      const validatedData = validateThemeValues({ scheme, color, locale });
      
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        locale: validatedData.locale,
        theme_scheme: validatedData.scheme,
        theme_color: validatedData.color,
      }, { onConflict: 'id' });
      
      if (dbError) {
        console.error('Error updating profile:', dbError);
        toast({
          variant: "destructive",
          title: "Error al guardar",
          description: "No se pudieron guardar los cambios. Verifica tu conexión e inténtalo de nuevo.",
        });
        return;
      }

      // Sincronizar con ThemeProvider (esto maneja DOM, cookies y i18n automáticamente)
      setThemeScheme(validatedData.scheme);
      setThemeColor(validatedData.color);
      setThemeLocale(validatedData.locale);
      
      // Toast de éxito
      toast({
        title: "Cambios guardados",
        description: "Tus preferencias se han actualizado correctamente.",
      });
      
    } catch (err: unknown) {
      log.error('Settings save failed:', err);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un problema al guardar los cambios. Por favor, inténtalo de nuevo.",
      });
    }
  });

  return (
    <form className="mx-auto w-full max-w-2xl space-y-4">
      
      <div>
        <label className="block text-sm mb-1 font-medium">Display name</label>
        <input 
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" 
          value={displayName} 
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Tu nombre para mostrar"
          disabled={pending}
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Idioma / Language</label>
        <select 
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" 
          value={locale} 
          onChange={e => setLocale(e.target.value as Locale)}
          disabled={pending}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm mb-1 font-medium">Esquema de tema / Theme scheme</label>
        <select 
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" 
          value={scheme} 
          onChange={e => setScheme(e.target.value as ThemeScheme)}
          disabled={pending}
        >
          <option value="light">☀️ Light / Claro</option>
          <option value="dark">🌙 Dark / Oscuro</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm mb-1 font-medium">Color del tema / Theme color</label>
        <select 
           className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" 
          value={color} 
          onChange={e => setColor(e.target.value as ThemeColor)}
          disabled={pending}
        >
          <option value="default">🔵 Default / Por defecto</option>
          <option value="purple">🟣 Purple / Morado</option>
          <option value="blue">🔵 Blue / Azul</option>
          <option value="olive">🫒 Olive / Oliva</option>
          <option value="tangerine">🟠 Tangerine / Mandarina</option>
        </select>
      </div>
      
      <button 
        type="button" 
        onClick={onSave} 
        disabled={pending} 
        className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '⏳ Guardando...' : '💾 Guardar cambios'}
      </button>
    </form>
  );
}
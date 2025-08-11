'use client';
import { useState, useTransition } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database, ProfileFormData, ThemeScheme, ThemeColor, Locale } from '@/lib/db.types';
import { setClientThemeCookies, validateThemeValues } from '@/lib/secure-cookies';

interface SettingsFormProps {
  initial: Partial<ProfileFormData> | null;
}

export default function SettingsForm({ initial }: SettingsFormProps) {
  const supabase = createClientComponentClient<Database>();
  
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
  const [error, setError] = useState<string | null>(null);

  const onSave = () => start(async () => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
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
        setError('Error al guardar los cambios');
        return;
      }

      // Sync instantáneo y seguro (sin flicker)
      const html = document.documentElement;
      html.setAttribute('data-scheme', validatedData.scheme);
      html.setAttribute('data-color', validatedData.color);
      
      // Establecer cookies seguras
      setClientThemeCookies(validatedData);
      
    } catch (err) {
      console.error('Error in onSave:', err);
      setError('Error inesperado al guardar');
    }
  });

  return (
    <form className="mx-auto w-full max-w-2xl space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm mb-1 font-medium">Display name</label>
        <input 
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={displayName} 
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Tu nombre para mostrar"
          disabled={pending}
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Idioma / Language</label>
        <select 
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '⏳ Guardando...' : '💾 Guardar cambios'}
      </button>
    </form>
  );
}
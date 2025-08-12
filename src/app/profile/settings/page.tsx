import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';
import type { Database, Profile, Locale, ThemeScheme, ThemeColor } from '@/lib/db.types';
import { SettingsSkeleton } from '@/components/settings-skeleton';
import { SettingsNavigation } from '@/components/settings-navigation';
import { Suspense } from 'react';

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso denegado</h2>
          <p className="text-red-700">Debes iniciar sesión para acceder a la configuración.</p>
        </div>
      </div>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, locale, theme_scheme, theme_color')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError);
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <SettingsNavigation />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configuración del perfil</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en la aplicación.</p>
      </div>
      
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsForm 
          initial={profile ? {
            display_name: profile.display_name || user.email || '',
            locale: profile.locale as Locale,
            theme_scheme: profile.theme_scheme as ThemeScheme,
            theme_color: profile.theme_color as ThemeColor
          } : {
            display_name: user.email || '',
            locale: 'en',
            theme_scheme: 'light',
            theme_color: 'default'
          }} 
        />
      </Suspense>
    </div>
  );
}
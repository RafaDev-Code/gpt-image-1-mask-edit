import { supabaseServer } from '@/lib/supabase/server';
import SettingsForm from './settings-form';
import type { Database, Profile } from '@/lib/db.types';

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configuración del perfil</h1>
        <p className="text-gray-600">Personaliza tu experiencia en la aplicación.</p>
      </div>
      
      <SettingsForm 
        initial={profile || {
          display_name: user.email || '',
          locale: 'en',
          theme_scheme: 'light',
          theme_color: 'default'
        }} 
      />
    </div>
  );
}
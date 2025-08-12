'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

export const metadata = {
  title: 'Dashboard - QA Auth',
  description: 'Dashboard mínimo para QA de autenticación'
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect('/auth/login?next=/dashboard');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    redirect('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will handle this
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg border border-border p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard QA</h1>
          
          <div className="space-y-4 mb-6">
            <p className="text-foreground">
              Estás logueado como <strong>{user.email}</strong>
            </p>
            
            <div className="bg-background rounded border border-border p-3">
              <p className="text-sm text-muted-foreground mb-1">User ID:</p>
              <p className="font-mono text-sm text-foreground break-all">{user.id}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/profile/settings">
                Ir a Settings
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { log } from '@/lib/logger';
import { isError } from '@/lib/utils';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const supabase = supabaseBrowser();
                const { error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error getting session:', error);
                    router.push('/auth/login');
                    return;
                }
                
                // Obtener el parámetro 'next' para redirigir
                const next = searchParams.get('next') || '/';
                router.push(next);
            } catch (err: unknown) {
                log.error('Unexpected error in auth callback', {
                    component: 'AuthCallbackClient',
                    error: isError(err) ? err.message : String(err)
                });
                router.push('/auth/login');
            }
        };
        
        handleAuthCallback();
    }, [router, searchParams]);
    
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Completando autenticación...</p>
            </div>
        </div>
    );
}
'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export function UserMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const supabase = supabaseBrowser();
        
        // Obtener sesión inicial
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                logger.supabase('get_session', error);
                console.error('Error getting initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        getInitialSession();
        
        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
                setIsLoading(false);
                
                // Log auth events
                if (event === 'SIGNED_IN') {
                    logger.auth('login', session?.user?.id);
                } else if (event === 'SIGNED_OUT') {
                    logger.auth('logout', session?.user?.id);
                }
            }
        );
        
        return () => subscription.unsubscribe();
    }, []);
    
    const handleSignOut = async () => {
        try {
            const supabase = supabaseBrowser();
            await supabase.auth.signOut();
            
            // Limpiar cookies de tema al cerrar sesión
            document.cookie = 'scheme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'color=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'locale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            router.push('/');
        } catch (error) {
            logger.supabase('sign_out', error, { userId: user?.id });
            console.error('Error signing out:', error);
        }
    };
    
    const handleSignIn = () => {
        const currentPath = pathname;
        router.push(`/auth/login?next=${encodeURIComponent(currentPath)}`);
    };
    
    if (isLoading) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="inline-flex h-8 w-8 min-w-[32px] rounded-full bg-card border border-border opacity-50"
                disabled
                aria-label="Cargando..."
            >
                <User className="h-4 w-4 text-foreground flex-shrink-0" />
            </Button>
        );
    }
    
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="inline-flex h-8 w-8 min-w-[32px] rounded-full bg-card border border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Cuenta"
                >
                    <User className="h-4 w-4 text-foreground flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className="w-48 bg-card border border-border"
            >
                {!user ? (
                    <DropdownMenuItem 
                        onClick={handleSignIn}
                        className="text-foreground hover:bg-accent cursor-pointer"
                    >
                        Iniciar sesión
                    </DropdownMenuItem>
                ) : (
                    <>
                        <DropdownMenuItem asChild>
                            <Link 
                                href="/profile/settings" 
                                className="text-foreground hover:bg-accent cursor-pointer"
                            >
                                Perfil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                            onClick={handleSignOut}
                            className="text-foreground hover:bg-accent cursor-pointer"
                        >
                            Cerrar sesión
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
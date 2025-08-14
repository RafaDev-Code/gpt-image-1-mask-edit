'use client';

import { User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { log } from '@/lib/logger';
import { isError } from '@/lib/utils';

export function UserMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        const supabase = supabaseBrowser();
        
        // Obtener sesión inicial
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (err: unknown) {
                log.error('get_session error', { error: isError(err) ? err.message : String(err) });
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Error getting initial session:', isError(err) ? err.message : String(err));
                }
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
                    log.info('user login', { userId: session?.user?.id });
                } else if (event === 'SIGNED_OUT') {
                    log.info('user logout', { userId: session?.user?.id });
                }
            }
        );
        
        return () => subscription.unsubscribe();
    }, []);
    
    // Cerrar dropdown al cambiar de ruta con limpieza agresiva
    useEffect(() => {
        setOpen(false);
        
        // Limpieza adicional para overlays persistentes
        const cleanup = () => {
            // Forzar cierre de cualquier dropdown abierto
            const dropdownTrigger = document.querySelector('[data-testid="usermenu-trigger"]');
            if (dropdownTrigger) {
                dropdownTrigger.setAttribute('data-state', 'closed');
                dropdownTrigger.setAttribute('aria-expanded', 'false');
            }
            
            // Remover contenido del dropdown si existe
            const dropdownContent = document.querySelector('[data-radix-dropdown-menu-content]');
            if (dropdownContent && dropdownContent.getAttribute('data-state') === 'closed') {
                dropdownContent.remove();
            }
        };
        
        // Ejecutar limpieza después de un pequeño delay
        const timeoutId = setTimeout(cleanup, 50);
        return () => clearTimeout(timeoutId);
    }, [pathname]);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    useEffect(() => {
        const el = document.querySelector('[data-testid="usermenu-trigger"]') as HTMLElement | null;
        console.log('UserMenu trigger present:', !!el, 'classes:', el?.className);
    }, [mounted]);
    
    // Debug logging para análisis
    useEffect(() => {
        console.log('UserMenu render', { pathname, open, user: !!user, isLoading });
    }, [pathname, open, user, isLoading]);
    
    // Debug del trigger después de montar
    useEffect(() => {
        const el = document.querySelector('[data-testid="usermenu-trigger"]') as HTMLElement | null;
        console.log('UserMenu trigger classes:', el?.className);
        if (el) {
            const computedStyles = window.getComputedStyle(el);
            console.log('UserMenu trigger computed styles:', {
                display: computedStyles.display,
                alignItems: computedStyles.alignItems,
                justifyContent: computedStyles.justifyContent,
                height: computedStyles.height,
                width: computedStyles.width,
                padding: computedStyles.padding,
                lineHeight: computedStyles.lineHeight
            });
            
            const svg = el.querySelector('svg');
            if (svg) {
                const svgStyles = window.getComputedStyle(svg);
                console.log('UserMenu SVG computed styles:', {
                    display: svgStyles.display,
                    verticalAlign: svgStyles.verticalAlign
                });
            }
        }
    }, [user, isLoading]);
    
    if (!mounted) return null;
    
    const handleSignOut = async (e: Event) => {
        e.preventDefault();
        setOpen(false);
        try {
            const supabase = supabaseBrowser();
            await supabase.auth.signOut();
            
            // Limpiar cookies de tema al cerrar sesión
            document.cookie = 'scheme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'color=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'locale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            router.push('/');
        } catch (err: unknown) {
            log.error('sign_out error', { error: isError(err) ? err.message : String(err), userId: user?.id });
            if (process.env.NODE_ENV !== 'production') {
                console.error('Error signing out:', isError(err) ? err.message : String(err));
            }
        }
    };
    
    const handleSignIn = (e: Event) => {
        e.preventDefault();
        setOpen(false);
        const currentPath = pathname;
        router.push(`/auth/login?next=${encodeURIComponent(currentPath)}`);
    };
    
    if (isLoading) {
        return (
            <button
                type="button"
                className="inline-flex h-8 w-8 min-w-[32px] rounded-full bg-card border border-border opacity-50"
                disabled
                aria-label="Cargando..."
            >
                <User className="h-4 w-4 text-foreground flex-shrink-0" />
            </button>
        );
    }
    
    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    data-testid="userMenu-trigger"
                    className="
                        inline-flex size-8 items-center justify-center
                        rounded-full p-0 leading-none outline-none border border-border
                        bg-transparent text-foreground
                        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                        focus-visible:ring-offset-background
                    "
                >
                    <User className="block size-4 shrink-0" aria-hidden="true" />
                    <span className="sr-only">Cuenta</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="z-60 w-48 bg-card border border-border"
            >
                {!user ? (
                    <DropdownMenuItem 
                        onSelect={handleSignIn}
                        className="text-foreground hover:bg-accent cursor-pointer"
                    >
                        Iniciar sesión
                    </DropdownMenuItem>
                ) : (
                    <>
                        <DropdownMenuItem 
                            onSelect={(e) => {
                                e.preventDefault();
                                setOpen(false);
                                router.push('/profile');
                            }}
                            className="text-foreground hover:bg-accent cursor-pointer"
                        >
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                            onSelect={handleSignOut}
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
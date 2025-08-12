'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { validateRedirectUrl } from '@/lib/secure-cookies';
import { AuthError } from '@/components/auth-error';
import { logger, isError } from '@/lib/logger';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    
    const next = searchParams.get('next') || '/';
    
    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const supabase = supabaseBrowser();
            
            // Validar URL de redirección para OAuth
            const safeNext = validateRedirectUrl(next, window.location.origin);
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext.replace(window.location.origin, ''))}`,
                    scopes: 'email profile openid'
                }
            });
            
            if (error) {
                logger.auth('error', undefined, { 
                    provider: 'google', 
                    error: error.message,
                    code: error.status 
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Error during Google login:', error);
                }
            }
        } catch (err: unknown) {
            logger.auth('error', undefined, { 
                provider: 'google', 
                error: isError(err) ? err.message : String(err),
                type: 'unexpected' 
            });
            if (process.env.NODE_ENV !== 'production') {
                console.error('Unexpected error:', isError(err) ? err.message : String(err));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md mx-auto">
                <AuthError />
                <Card className="bg-card border border-border">
                    <CardHeader className="text-center">
                        <CardTitle className="text-foreground text-2xl font-semibold">
                            Iniciar sesión
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <Button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="Continuar con Google"
                    >
                        {isLoading ? 'Conectando...' : 'Continuar con Google'}
                    </Button>
                    
                    {/* TODO: habilitar más adelante
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <Input
                                type="email"
                                placeholder="Correo electrónico"
                                className="bg-input border-border focus-visible:ring focus-visible:ring-ring"
                                aria-label="Correo electrónico"
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Contraseña"
                                className="bg-input border-border focus-visible:ring focus-visible:ring-ring"
                                aria-label="Contraseña"
                            />
                        </div>
                        <Button 
                            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-label="Iniciar sesión con email"
                        >
                            Iniciar sesión
                        </Button>
                    </div>
                    */}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
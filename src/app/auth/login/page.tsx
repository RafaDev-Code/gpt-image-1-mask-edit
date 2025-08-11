'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Database } from '@/lib/db.types';
import { validateRedirectUrl } from '@/lib/secure-cookies';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
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
                console.error('Error during Google login:', error);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="w-full max-w-md mx-auto bg-card border border-border">
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
        </main>
    );
}
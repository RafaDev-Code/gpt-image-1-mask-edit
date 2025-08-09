'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-md mx-auto bg-card border border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Iniciar sesión</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => console.log('Login clicked')}
                    >
                        Continuar
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
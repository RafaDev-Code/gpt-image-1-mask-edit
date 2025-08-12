'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AuthCodeErrorPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Enfocar el título al montar para accesibilidad
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle 
            ref={titleRef}
            tabIndex={-1}
            className="text-xl font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            No pudimos completar tu login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            role="alert" 
            className="text-center text-muted-foreground"
          >
            Hubo un problema durante el proceso de autenticación. 
            Por favor, intenta iniciar sesión nuevamente.
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Volver a iniciar sesión
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Ir al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
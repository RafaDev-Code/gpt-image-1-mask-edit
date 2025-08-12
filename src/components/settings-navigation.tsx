'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SettingsNavigation() {
  const router = useRouter();

  const handleBack = () => {
    // Intentar volver atrás, con fallback a inicio
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Link 
          href="/" 
          className="hover:text-foreground transition-colors"
        >
          Inicio
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Perfil</span>
      </nav>

      {/* Botón Volver */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Button>
    </div>
  );
}
'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES = {
  access_denied: {
    title: 'Acceso denegado',
    description: 'Has cancelado el proceso de autenticación. Puedes intentar nuevamente si lo deseas.',
  },
  server_error: {
    title: 'Error del servidor',
    description: 'Ocurrió un problema en nuestros servidores. Por favor, inténtalo de nuevo en unos minutos.',
  },
  temporarily_unavailable: {
    title: 'Servicio temporalmente no disponible',
    description: 'El servicio de autenticación no está disponible temporalmente. Inténtalo de nuevo más tarde.',
  },
  invalid_request: {
    title: 'Solicitud inválida',
    description: 'Hubo un problema con la solicitud de autenticación. Por favor, inicia el proceso nuevamente.',
  },
  unauthorized_client: {
    title: 'Cliente no autorizado',
    description: 'Error de configuración de la aplicación. Por favor, contacta al soporte técnico.',
  },
  invalid_grant: {
    title: 'Código de autorización inválido',
    description: 'El código de autorización ha expirado o es inválido. Por favor, inicia sesión nuevamente.',
  },
  unsupported_response_type: {
    title: 'Tipo de respuesta no soportado',
    description: 'Error de configuración. Por favor, contacta al soporte técnico.',
  },
  invalid_scope: {
    title: 'Permisos inválidos',
    description: 'Los permisos solicitados no son válidos. Por favor, inténtalo de nuevo.',
  },
  default: {
    title: 'Error de autenticación',
    description: 'Ocurrió un error durante el proceso de autenticación. Por favor, inténtalo de nuevo.',
  },
} as const;

export function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  if (!error) return null;
  
  const errorInfo = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default;
  
  const handleRetry = () => {
    // Limpiar los parámetros de error y redirigir al login
    window.location.href = '/auth/login';
  };
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription className="mt-2">
        {errorInfo.description}
        {errorDescription && (
          <div className="mt-2 text-sm opacity-75">
            Detalles técnicos: {errorDescription}
          </div>
        )}
        <div className="mt-4">
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
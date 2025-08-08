// Utilidades para manejo de cookies del tema

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function setCookieValue(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Para uso en el servidor (Next.js)
export function getServerCookie(cookieString: string, name: string): string | null {
  if (!cookieString) {
    return null;
  }
  
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}
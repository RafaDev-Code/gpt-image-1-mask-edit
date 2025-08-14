import { redirect } from 'next/navigation'

export default function ProfilePage() {
  // Redirigir automáticamente a la página de configuración
  redirect('/profile/settings')
}
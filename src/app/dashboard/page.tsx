import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/db.types';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}!</h2>
          <p className="text-muted-foreground mb-4">
            This is a protected dashboard page. Only authenticated users can access this content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-background rounded border p-4">
              <h3 className="font-medium mb-2">User ID</h3>
              <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
            </div>
            
            <div className="bg-background rounded border p-4">
              <h3 className="font-medium mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            
            <div className="bg-background rounded border p-4">
              <h3 className="font-medium mb-2">Last Sign In</h3>
              <p className="text-sm text-muted-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <a 
            href="/profile/settings" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Profile Settings
          </a>
          
          <Link 
            href="/" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
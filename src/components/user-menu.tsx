'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function UserMenu() {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="inline-flex h-8 w-8 min-w-[32px] rounded-full bg-card border border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Cuenta"
                >
                    <User className="h-4 w-4 text-foreground flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className="w-48 bg-card border border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
                <DropdownMenuItem asChild>
                    <Link 
                        href="/auth/login" 
                        className="text-foreground hover:bg-accent cursor-pointer"
                    >
                        Iniciar sesión
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                    disabled 
                    className="text-muted-foreground cursor-not-allowed"
                >
                    <Link href="/profile/settings" className="pointer-events-none">
                        Perfil (pronto)
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
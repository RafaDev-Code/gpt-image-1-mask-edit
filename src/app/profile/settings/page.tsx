'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileSettingsPage() {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-md mx-auto bg-card border border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Próximamente
                    </p>
                    <p className="text-muted-foreground mt-2">
                        Esta funcionalidad estará disponible en una futura actualización.
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
// Autenticación por password hash comentada para desarrollo local
// Esta ruta no se usará activamente en desarrollo local

import { NextResponse } from 'next/server';

export async function GET() {
    // APP_PASSWORD comentado para desarrollo local
    const appPasswordSet = !!process.env.APP_PASSWORD;
    return NextResponse.json({ passwordRequired: appPasswordSet });
}

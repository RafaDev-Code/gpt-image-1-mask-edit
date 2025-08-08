import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Read version from package.json
        const packageJsonPath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const version = packageJson.version || '1.0.0';

        return NextResponse.json({
            ok: true,
            version,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: 'Health check failed',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
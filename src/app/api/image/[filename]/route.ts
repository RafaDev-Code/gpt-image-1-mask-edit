import fs from 'fs/promises';
import { lookup } from 'mime-types';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { log } from '@/lib/logger';
import { isError } from '@/lib/utils';

export const runtime = 'nodejs';

// Base directory where images are stored (outside nextjs-app)
const imageBaseDir = path.resolve(process.cwd(), 'generated-images');

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
    const { filename } = await params;

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Basic security: Prevent directory traversal
    if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(imageBaseDir, filename);

    try {
        await fs.access(filepath);

        const fileBuffer = await fs.readFile(filepath);

        const contentType = lookup(filename) || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString()
            }
        });
    } catch (err: unknown) {
        logger.error('Error serving image', {
            component: 'ImageAPI',
            filename,
            error: isError(err) ? err.message : String(err)
        });
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT') {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

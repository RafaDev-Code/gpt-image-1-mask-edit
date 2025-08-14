// Autenticación por password hash y Dual storage comentado para desarrollo local
// En desarrollo local se usa solo modo 'fs' (filesystem)

import crypto from 'crypto';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import { log } from '@/lib/logger';
import { isError } from '@/lib/utils';

export const runtime = 'nodejs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
    timeout: 60000, // 60 seconds timeout
    maxRetries: 0 // We'll handle retries manually
});

const outputDir = path.resolve(process.cwd(), 'generated-images');

// Define valid output formats for type safety
const VALID_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const;
type ValidOutputFormat = (typeof VALID_OUTPUT_FORMATS)[number];

// Validate and normalize output format
function validateOutputFormat(format: unknown): ValidOutputFormat {
    const normalized = String(format || 'png').toLowerCase();

    // Handle jpg -> jpeg normalization
    const mapped = normalized === 'jpg' ? 'jpeg' : normalized;

    if (VALID_OUTPUT_FORMATS.includes(mapped as ValidOutputFormat)) {
        return mapped as ValidOutputFormat;
    }

    return 'png'; // default fallback
}

async function ensureOutputDirExists() {
    try {
        await fs.access(outputDir);
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT') {
            try {
                await fs.mkdir(outputDir, { recursive: true });
                log.info('Created output directory', { component: 'ImagesAPI', outputDir });
            } catch (mkdirErr: unknown) {
                log.error('Error creating output directory', {
                    component: 'ImagesAPI',
                    outputDir,
                    error: isError(mkdirErr) ? mkdirErr.message : String(mkdirErr)
                });
                throw new Error('Failed to create image output directory.');
            }
        } else {
            console.error(`Error accessing output directory ${outputDir}:`, err);
            throw new Error(
                `Failed to access or ensure image output directory exists. Original error: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Retry function with exponential backoff for connection errors
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: unknown) {
            lastError = err as Error;
            
            // Check if it's a retryable error
            const isConnectionError = 
                err instanceof Error && (
                    err.message.includes('ECONNRESET') ||
                    err.message.includes('Connection error') ||
                    err.message.includes('ENOTFOUND') ||
                    err.message.includes('ETIMEDOUT') ||
                    err.message.includes('socket hang up')
                );
            
            // Check if it's a rate limit error (429)
            const isRateLimitError = 
                err instanceof Error && (
                    err.message.includes('429') ||
                    err.message.includes('rate limit') ||
                    err.message.includes('exceeded the rate limit')
                ) || 
                // Handle OpenAI API error objects
                (err as Record<string, unknown>)?.status === 429 ||
                (err as Record<string, unknown>)?.code === 'rate_limit_exceeded';
            
            const isRetryableError = isConnectionError || isRateLimitError;
            
            if (!isRetryableError || attempt === maxRetries) {
                throw err;
            }
            
            // For rate limit errors, use longer delays
            let delay;
            if (isRateLimitError) {
                delay = Math.max(5000, baseDelay * Math.pow(3, attempt)); // Minimum 5 seconds, exponential with base 3
                // Rate limit exceeded, retrying after delay
            } else {
                delay = baseDelay * Math.pow(2, attempt);
                // Connection error, retrying after delay
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}

export async function POST(request: NextRequest) {
    // Processing image generation request

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set.');
        return NextResponse.json({ error: 'Server configuration error: API key not found.' }, { status: 500 });
    }
    try {
        let effectiveStorageMode: 'fs' | 'indexeddb';
        const explicitMode = process.env.NEXT_PUBLIC_IMAGE_STORAGE_MODE;
        const isOnVercel = process.env.VERCEL === '1';

        if (explicitMode === 'fs') {
            effectiveStorageMode = 'fs';
        } else if (explicitMode === 'indexeddb') {
            effectiveStorageMode = 'indexeddb';
        } else if (isOnVercel) {
            effectiveStorageMode = 'indexeddb';
        } else {
            effectiveStorageMode = 'fs';
        }
        console.log(
            `Effective Image Storage Mode: ${effectiveStorageMode} (Explicit: ${explicitMode || 'unset'}, Vercel: ${isOnVercel})`
        );

        if (effectiveStorageMode === 'fs') {
            await ensureOutputDirExists();
        }

        const formData = await request.formData();

        // Autenticación por password comentada para desarrollo local
        if (process.env.APP_PASSWORD) {
            const clientPasswordHash = formData.get('passwordHash') as string | null;
            if (!clientPasswordHash) {
                console.error('Missing password hash.');
                return NextResponse.json({ error: 'Unauthorized: Missing password hash.' }, { status: 401 });
            }
            const serverPasswordHash = sha256(process.env.APP_PASSWORD);
            if (clientPasswordHash !== serverPasswordHash) {
                console.error('Invalid password hash.');
                return NextResponse.json({ error: 'Unauthorized: Invalid password.' }, { status: 401 });
            }
        }

        const prompt = formData.get('prompt') as string | null;

        // Edit mode processing

        if (!prompt) {
            return NextResponse.json({ error: 'Missing required parameter: prompt' }, { status: 400 });
        }

        const model = 'gpt-image-1';

        // Only edit mode is supported
            const n = parseInt((formData.get('n') as string) || '1', 10);
            const size = (formData.get('size') as OpenAI.Images.ImageEditParams['size']) || 'auto';
            const quality = (formData.get('quality') as OpenAI.Images.ImageEditParams['quality']) || 'auto';

            const imageFiles: File[] = [];
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('image_') && value instanceof File) {
                    imageFiles.push(value);
                }
            }

            if (imageFiles.length === 0) {
                return NextResponse.json({ error: 'No image file provided for editing.' }, { status: 400 });
            }

            const maskFile = formData.get('mask') as File | null;

            const params: OpenAI.Images.ImageEditParams = {
                model,
                prompt,
                image: imageFiles[0], // OpenAI API expects a single file, not an array
                n: Math.max(1, Math.min(n || 1, 10)),
                size: size === 'auto' ? undefined : size,
                quality: quality === 'auto' ? undefined : quality
            };

            if (maskFile) {
                params.mask = maskFile;
            }

            // Calling OpenAI edit API
            
            // Use retry mechanism for OpenAI API call
            const result = await retryWithBackoff(
                () => openai.images.edit(params),
                3, // max 3 retries
                2000 // start with 2 second delay
            );

        // OpenAI API call completed

        if (!result || !Array.isArray(result.data) || result.data.length === 0) {
            console.error('Invalid or empty data received from OpenAI API:', result);
            return NextResponse.json({ error: 'Failed to retrieve image data from API.' }, { status: 500 });
        }

        const savedImagesData = await Promise.all(
            result.data.map(async (imageData, index) => {
                if (!imageData.b64_json) {
                    console.error(`Image data ${index} is missing b64_json.`);
                    throw new Error(`Image data at index ${index} is missing base64 data.`);
                }
                const buffer = Buffer.from(imageData.b64_json, 'base64');
                const timestamp = Date.now();

                const fileExtension = validateOutputFormat(formData.get('output_format'));
                const filename = `${timestamp}-${index}.${fileExtension}`;

                if (effectiveStorageMode === 'fs') {
                    const filepath = path.join(outputDir, filename);
                    // Saving image to filesystem
                    await fs.writeFile(filepath, buffer);
                    // Image saved successfully
                } else {
                }

                const imageResult: { filename: string; b64_json: string; path?: string; output_format: string } = {
                    filename: filename,
                    b64_json: imageData.b64_json,
                    output_format: fileExtension
                };

                if (effectiveStorageMode === 'fs') {
                    imageResult.path = `/api/image/${filename}`;
                }

                return imageResult;
            })
        );

        // All images processed successfully

        return NextResponse.json({ images: savedImagesData, usage: result.usage });
    } catch (err: unknown) {
        logger.error('Error in /api/images', {
            component: 'ImagesAPI',
            error: isError(err) ? err.message : String(err)
        });

        let errorMessage = 'An unexpected error occurred.';
        let status = 500;

        if (err instanceof Error) {
            errorMessage = err.message;
            if (typeof err === 'object' && err !== null && 'status' in err && typeof (err as Record<string, unknown>).status === 'number') {
                status = (err as Record<string, unknown>).status as number;
            }
        } else if (typeof err === 'object' && err !== null) {
            if ('message' in err && typeof (err as Record<string, unknown>).message === 'string') {
                errorMessage = (err as Record<string, unknown>).message as string;
            }
            if ('status' in err && typeof (err as Record<string, unknown>).status === 'number') {
                status = (err as Record<string, unknown>).status as number;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}

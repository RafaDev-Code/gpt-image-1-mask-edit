'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Send, Grid } from 'lucide-react';
import Image from 'next/image';

type ImageInfo = {
    path: string;
    filename: string;
};

type ImageOutputProps = {
    imageBatch: ImageInfo[] | null;
    viewMode: 'grid' | number;
    onViewChange: (view: 'grid' | number) => void;
    altText?: string;
    isLoading: boolean;
    onSendToEdit: (filename: string) => void;
    currentMode: 'generate' | 'edit';
    baseImagePreviewUrl: string | null;
};

const getGridColsClass = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3';
};

export function ImageOutput({
    imageBatch,
    viewMode,
    onViewChange,
    altText = 'Generated image output',
    isLoading,
    onSendToEdit,
    currentMode,
    baseImagePreviewUrl
}: ImageOutputProps) {
    const handleSendClick = () => {
        // Send to edit only works when a single image is selected
        if (typeof viewMode === 'number' && imageBatch && imageBatch[viewMode]) {
            onSendToEdit(imageBatch[viewMode].filename);
        }
    };

    const showCarousel = imageBatch && imageBatch.length > 1;
    const isSingleImageView = typeof viewMode === 'number';
    const canSendToEdit = !isLoading && isSingleImageView && imageBatch && imageBatch[viewMode];

    return (
        <div className='flex h-full min-h-[300px] w-full flex-col items-center justify-between gap-4 overflow-hidden rounded-lg border border-gray-300 bg-white p-4 dark:bg-black dark:border-white/20' style={{ transition: 'none' }}>
            <div className='relative flex h-full w-full flex-grow items-center justify-center overflow-hidden'>
                {isLoading ? (
                    currentMode === 'edit' && baseImagePreviewUrl ? (
                        <div className='relative flex h-full w-full items-center justify-center'>
                            <Image
                                src={baseImagePreviewUrl}
                                alt='Base image for editing'
                                fill
                                style={{ objectFit: 'contain' }}
                                className='blur-md filter'
                                unoptimized
                            />
                            <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 text-gray-700 dark:bg-black/50 dark:text-white/80'>
                                <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                                <p>Editing image...</p>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center text-gray-600 dark:text-white/60'>
                            <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                            <p>Generating image...</p>
                        </div>
                    )
                ) : imageBatch && imageBatch.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div
                            className={`grid ${getGridColsClass(imageBatch.length)} max-h-full w-full max-w-full gap-1 p-1`}>
                            {imageBatch.map((img, index) => (
                                <div
                                    key={img.filename}
                                    className='relative aspect-square overflow-hidden rounded border border-gray-300 dark:border-white/10'>
                                    <Image
                                        src={img.path}
                                        alt={`Generated image ${index + 1}`}
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    ) : imageBatch[viewMode] ? (
                        <Image
                            src={imageBatch[viewMode].path}
                            alt={altText}
                            width={512}
                            height={512}
                            className='max-h-full max-w-full object-contain'
                            unoptimized
                        />
                    ) : (
                        <div className='text-center text-gray-500 dark:text-white/40'>
                            <p>Error displaying image.</p>
                        </div>
                    )
                ) : (
                    <div className='text-center text-gray-500 dark:text-white/40'>
                        <p>Your generated image will appear here.</p>
                    </div>
                )}
            </div>

            <div className='flex h-10 w-full shrink-0 items-center justify-center gap-4' style={{ transition: 'none' }}>
                {showCarousel && (
                    <div className='flex items-center gap-1.5 rounded-md border border-gray-300 bg-gray-100 p-1 dark:border-white/20 dark:bg-neutral-800/50' style={{ transition: 'none' }}>
                        <Button
                            variant='ghost'
                            size='icon'
                            className={cn(
                                'h-8 w-8 rounded p-1',
                                viewMode === 'grid'
                                    ? 'bg-gray-300 text-gray-800 dark:bg-white/20 dark:text-white'
                                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80'
                            )}
                            onClick={() => onViewChange('grid')}
                            aria-label='Show grid view'>
                            <Grid className='h-4 w-4' />
                        </Button>
                        {imageBatch.map((img, index) => (
                            <Button
                                key={img.filename}
                                variant='ghost'
                                size='icon'
                                className={cn(
                                    'h-8 w-8 overflow-hidden rounded p-0.5',
                                    viewMode === index
                                        ? 'ring-2 ring-gray-800 ring-offset-1 ring-offset-white dark:ring-white dark:ring-offset-black'
                                        : 'opacity-60 hover:opacity-100'
                                )}
                                onClick={() => onViewChange(index)}
                                aria-label={`Select image ${index + 1}`}>
                                <Image
                                    src={img.path}
                                    alt={`Thumbnail ${index + 1}`}
                                    width={28}
                                    height={28}
                                    className='h-full w-full object-cover'
                                    unoptimized
                                />
                            </Button>
                        ))}
                    </div>
                )}

                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onSendToEdit(selectedImageIndex)}
                    disabled={!canSendToEdit}
                    className={cn(
                        'shrink-0 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50',
                        // Hide button completely if grid view is active and there are multiple images
                        showCarousel && viewMode === 'grid' ? 'invisible' : 'visible'
                    )}
                    style={{ transition: 'none' }}>
                    <Send className='mr-2 h-4 w-4' />
                    Send to Edit
                </Button>
            </div>
        </div>
    );
}

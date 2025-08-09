'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Send, Grid } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

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
    const { t } = useTranslation('editor');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getText = (key: string, fallback: string) => {
        return mounted ? t(key) : fallback;
    };
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
        <div className='flex h-full min-h-[300px] w-full flex-col items-center justify-between gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 dark:border-border dark:bg-card' style={{ transition: 'none' }}>
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
                            <div className='absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-foreground dark:bg-background/50 dark:text-foreground'>
                                <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                                <p>{getText('output.editingImage', 'Editing image...')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center text-muted-foreground dark:text-muted-foreground'>
                            <Loader2 className='mb-2 h-8 w-8 animate-spin' />
                            <p>{getText('output.generatingImage', 'Generating image...')}</p>
                        </div>
                    )
                ) : imageBatch && imageBatch.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div
                            className={`grid ${getGridColsClass(imageBatch.length)} max-h-full w-full max-w-full gap-1 p-1`}>
                            {imageBatch.map((img, index) => (
                                <div
                                    key={img.filename}
                                    className='relative aspect-square overflow-hidden rounded border border-border dark:border-border'>
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
                        <div className='text-center text-muted-foreground dark:text-muted-foreground'>
                            <p>{getText('output.errorDisplaying', 'Error displaying image.')}</p>
                        </div>
                    )
                ) : (
                    <div className='text-center text-muted-foreground dark:text-muted-foreground'>
                        <p>{getText('editor:output.uploadToStart', 'Upload an image to start editing.')}</p>
                    </div>
                )}
            </div>

            <div className='flex h-10 w-full shrink-0 items-center justify-center gap-4' style={{ transition: 'none' }}>
                {showCarousel && (
                    <div className='flex items-center gap-1.5 rounded-md border border-border bg-muted p-1 dark:border-border dark:bg-muted' style={{ transition: 'none' }}>
                        <Button
                            variant='ghost'
                            size='icon'
                            className={cn(
                                'h-8 w-8 rounded p-1',
                                viewMode === 'grid'
                                    ? 'bg-accent text-accent-foreground dark:bg-accent dark:text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground dark:text-muted-foreground dark:hover:bg-accent/50 dark:hover:text-accent-foreground'
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
                                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background dark:ring-primary dark:ring-offset-background'
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
                    onClick={handleSendClick}
                    disabled={!canSendToEdit}
                    className={cn(
                        'shrink-0 max-w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:border-border dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                        // Compact button in grid view with multiple images
                        showCarousel && viewMode === 'grid' ? 'h-8 px-2 text-sm' : ''
                    )}
                    style={{ transition: 'none' }}
                    aria-label={showCarousel && viewMode === 'grid' ? getText('editor:output.sendToEdit', 'Send to Edit') : undefined}>
                    <Send className={cn('h-4 w-4', showCarousel && viewMode === 'grid' ? '' : 'mr-2')} />
                    <span className={cn(showCarousel && viewMode === 'grid' ? 'sr-only sm:not-sr-only sm:inline' : '')}>
                        {getText('editor:output.sendToEdit', 'Send to Edit')}
                    </span>
                </Button>
            </div>
        </div>
    );
}

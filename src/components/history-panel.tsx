'use client';

import type { HistoryMetadata } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    Copy,
    Check,
    Layers,
    DollarSign,
    Pencil,
    HardDrive,
    Database,
    FileImage,
    Trash2,
    Sparkles
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

type HistoryPanelProps = {
    history: HistoryMetadata[];
    onSelectImage: (item: HistoryMetadata) => void;
    onClearHistory: () => void;
    getImageSrc: (filename: string) => string | undefined;
    onDeleteItemRequest: (item: HistoryMetadata) => void;
    itemPendingDeleteConfirmation: HistoryMetadata | null;
    onConfirmDeletion: () => void;
    onCancelDeletion: () => void;
    deletePreferenceDialogValue: boolean;
    onDeletePreferenceDialogChange: (isChecked: boolean) => void;
    useCardWrapper?: boolean;
};

const formatDuration = (ms: number): string => {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
};

const calculateCost = (value: number, rate: number): string => {
    const cost = value * rate;
    return isNaN(cost) ? 'N/A' : cost.toFixed(4);
};

export function HistoryPanel({
    history,
    onSelectImage,
    onClearHistory,
    getImageSrc,
    onDeleteItemRequest,
    itemPendingDeleteConfirmation,
    onConfirmDeletion,
    onCancelDeletion,
    deletePreferenceDialogValue,
    onDeletePreferenceDialogChange,
    useCardWrapper = true
}: HistoryPanelProps) {
    const { t } = useTranslation(['common', 'editor']);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper function to prevent hydration mismatch
    const getText = (key: string, fallback: string) => {
        return mounted ? t(key) : fallback;
    };
    const [openPromptDialogTimestamp, setOpenPromptDialogTimestamp] = React.useState<number | null>(null);
    const [openCostDialogTimestamp, setOpenCostDialogTimestamp] = React.useState<number | null>(null);
    const [isTotalCostDialogOpen, setIsTotalCostDialogOpen] = React.useState(false);
    const [copiedTimestamp, setCopiedTimestamp] = React.useState<number | null>(null);

    const { totalCost, totalImages } = React.useMemo(() => {
        let cost = 0;
        let images = 0;
        history.forEach((item) => {
            if (item.costDetails) {
                cost += item.costDetails.estimated_cost_usd;
            }
            images += item.images?.length ?? 0;
        });

        return { totalCost: Math.round(cost * 10000) / 10000, totalImages: images };
    }, [history]);

    const averageCost = totalImages > 0 ? totalCost / totalImages : 0;

    const handleCopy = async (text: string | null | undefined, timestamp: number) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTimestamp(timestamp);
            setTimeout(() => setCopiedTimestamp(null), 1500);
        } catch (err: unknown) {
            logger.warn('Failed to copy text', {
                component: 'HistoryPanel',
                error: isError(err) ? err.message : String(err)
            });
        }
    };

    const panelContent = (
        <>
            <div className={useCardWrapper ? 'flex flex-row items-center justify-between gap-4 border-b border-border px-4 py-3 dark:border-border' : 'flex flex-row items-center justify-between gap-4 border-b border-border px-4 py-3 dark:border-border'}>
                <div className='flex items-center gap-2'>
                    {useCardWrapper ? (
                        <CardTitle className='text-lg font-medium text-foreground dark:text-foreground'>{getText('editor:history.title', 'History')}</CardTitle>
                    ) : (
                        <div className='text-lg font-medium text-foreground dark:text-foreground'>{getText('editor:history.title', 'History')}</div>
                    )}
                    {totalCost > 0 && (
                        <Dialog open={isTotalCostDialogOpen} onOpenChange={setIsTotalCostDialogOpen}>
                            <DialogTrigger asChild>
                                <button
                                    className='mt-0.5 flex items-center gap-1 rounded-full bg-[var(--state-success-soft)] px-1.5 py-0.5 text-[12px] text-success-foreground transition-colors hover:bg-success'
                                    aria-label='Show total cost summary'>
                                    {getText('editor:history.totalCost', 'Total Cost:')} ${totalCost.toFixed(4)}
                                </button>
                            </DialogTrigger>
                            <DialogContent className='border-border bg-card text-card-foreground sm:max-w-[450px]'>
                                <DialogHeader>
                                    <DialogTitle className='text-foreground'>{getText('editor:history.totalCostSummary', 'Total Cost Summary')}</DialogTitle>
                                    <DialogDescription className='sr-only'>
                                        A summary of the total estimated cost for all edited images in the history.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className='space-y-1 pt-1 text-xs text-muted-foreground'>
                                    <p>Pricing for gpt-image-1:</p>
                                    <ul className='list-disc pl-4'>
                                        <li>Text Input: $5 / 1M tokens</li>
                                        <li>Image Input: $10 / 1M tokens</li>
                                        <li>Image Output: $40 / 1M tokens</li>
                                    </ul>
                                </div>
                                <div className='space-y-2 py-4 text-sm text-muted-foreground'>
                                    <div className='flex justify-between'>
                                        <span>{getText('editor:history.totalImagesEdited', 'Total Images Edited:')}</span> <span>{totalImages.toLocaleString()}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span>{getText('editor:history.averageCostPerImage', 'Average Cost Per Image:')}</span> <span>${averageCost.toFixed(4)}</span>
                                    </div>
                                    <hr className='my-2 border-border' />
                            <div className='flex justify-between font-medium text-foreground'>
                                        <span>{getText('editor:history.totalEstimatedCost', 'Total Estimated Cost:')}</span>
                                        <span>${totalCost.toFixed(4)}</span>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type='button'
                                            variant='secondary'
                                            size='sm'
                                            className='bg-secondary text-secondary-foreground hover:bg-secondary/80'>
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
                {history.length > 0 && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={onClearHistory}
                        className='h-auto rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                        style={{ transition: 'none' }}>
                        {getText('editor:history.clear', 'Clear')}
                    </Button>
                )}
            </div>
            <div className='w-full p-4'>
                {history.length === 0 ? (
                    <div className='flex h-full items-center justify-center text-muted-foreground dark:text-muted-foreground'>
                        <p>{getText('editor:history.emptyMessage', 'Edited images will appear here.')}</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                        {[...history].map((item) => {
                            const firstImage = item.images?.[0];
                            const imageCount = item.images?.length ?? 0;
                            const isMultiImage = imageCount > 1;
                            const itemKey = item.timestamp;
                            const originalStorageMode = item.storageModeUsed || 'fs';
                            const outputFormat = item.output_format || 'png';

                            let thumbnailUrl: string | undefined;
                            if (firstImage) {
                                if (originalStorageMode === 'indexeddb') {
                                    thumbnailUrl = getImageSrc(firstImage.filename);
                                } else {
                                    thumbnailUrl = `/api/image/${firstImage.filename}`;
                                }
                            }

                            return (
                                <div key={itemKey} className='flex flex-col'>
                                    <div className='group relative'>
                                        <button
                                            onClick={() => onSelectImage(item)}
                                            className='relative block aspect-square w-full overflow-hidden rounded-t-md border border-border dark:border-border group-hover:border-primary dark:group-hover:border-primary focus:ring-2 focus:ring-ring dark:focus:ring-ring focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background focus:outline-none'
                                            style={{ transition: 'none' }}
                                            aria-label={`View image batch from ${new Date(item.timestamp).toLocaleString()}`}>
                                            {thumbnailUrl ? (
                                                <Image
                                                    src={thumbnailUrl}
                                                    alt={`Preview for batch generated at ${new Date(item.timestamp).toLocaleString()}`}
                                                    width={150}
                                                    height={150}
                                                    className='h-full w-full object-cover'
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground'>
                                                    ?
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    'pointer-events-none absolute top-1 left-1 z-10 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] text-white',
                                                    item.mode === 'edit' ? 'bg-[var(--state-warning-soft)]' : 'bg-[var(--state-info-soft)]'
                                                )}>
                                                {item.mode === 'edit' ? (
                                                    <Pencil size={12} />
                                                ) : (
                                                    <Sparkles size={12} />
                                                )}
                                                {item.mode === 'edit' ? 'Edit' : 'Create'}
                                            </div>
                                            {isMultiImage && (
                                                <div className='pointer-events-none absolute right-1 bottom-1 z-10 flex items-center gap-1 rounded-full bg-[var(--overlay-backdrop)] px-1.5 py-0.5 text-[12px] text-primary-foreground'>
                                                    <Layers size={16} />
                                                    {imageCount}
                                                </div>
                                            )}
                                            <div className='pointer-events-none absolute bottom-1 left-1 z-10 flex items-center gap-1'>
                                                <div className='flex items-center gap-1 rounded-full border border-border bg-card px-1 py-0.5 text-[11px] text-muted-foreground'>
                                                    {originalStorageMode === 'fs' ? (
                                                        <HardDrive size={12} className='text-muted-foreground' />
                                                    ) : (
                                                        <Database size={12} className='text-info' />
                                                    )}
                                                    <span>{originalStorageMode === 'fs' ? 'file' : 'db'}</span>
                                                </div>
                                                {item.output_format && (
                                                    <div className='flex items-center gap-1 rounded-full border border-border bg-card px-1 py-0.5 text-[11px] text-muted-foreground'>
                                                        <FileImage size={12} className='text-muted-foreground' />
                                                        <span>{outputFormat.toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                        {item.costDetails && (
                                            <Dialog
                                                open={openCostDialogTimestamp === itemKey}
                                                onOpenChange={(isOpen) => !isOpen && setOpenCostDialogTimestamp(null)}>
                                                <DialogTrigger asChild>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenCostDialogTimestamp(itemKey);
                                                        }}
                                                        className='absolute top-1 right-1 z-20 flex items-center gap-0.5 rounded-full bg-[var(--state-success-soft)] px-1.5 py-0.5 text-[11px] text-success-foreground hover:bg-success'
                                                        aria-label='Show cost breakdown'>
                                                        <DollarSign size={12} />
                                                        {item.costDetails.estimated_cost_usd.toFixed(4)}
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className='border-border bg-card text-foreground sm:max-w-[450px]'>
                                                    <DialogHeader>
                                                        <DialogTitle className='text-foreground'>{getText('editor:history.costBreakdown', 'Cost Breakdown')}</DialogTitle>
                                                        <DialogDescription className='sr-only'>
                                            Estimated cost breakdown for this image editing.
                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className='space-y-1 pt-1 text-xs text-muted-foreground'>
                                                        <p>{getText('editor:history.pricingInfo', 'Pricing for gpt-image-1:')}:</p>
                                                        <ul className='list-disc pl-4'>
                                                            <li>Text Input: $5 / 1M tokens</li>
                                                            <li>Image Input: $10 / 1M tokens</li>
                                                            <li>Image Output: $40 / 1M tokens</li>
                                                        </ul>
                                                    </div>
                                                    <div className='space-y-2 py-4 text-sm text-muted-foreground'>
                                                        <div className='flex justify-between'>
                                                            <span>{getText('editor:history.textInputTokens', 'Text Input Tokens:')}</span>{' '}
                                                            <span>
                                                                {item.costDetails.text_input_tokens.toLocaleString()}{' '}
                                                                (~$
                                                                {calculateCost(
                                                                    item.costDetails.text_input_tokens,
                                                                    0.000005
                                                                )}
                                                                )
                                                            </span>
                                                        </div>
                                                        {item.costDetails.image_input_tokens > 0 && (
                                                            <div className='flex justify-between'>
                                                                <span>{getText('editor:history.imageInputTokens', 'Image Input Tokens:')}</span>{' '}
                                                                <span>
                                                                    {item.costDetails.image_input_tokens.toLocaleString()}{' '}
                                                                    (~$
                                                                    {calculateCost(
                                                                        item.costDetails.image_input_tokens,
                                                                        0.00001
                                                                    )}
                                                                    )
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className='flex justify-between'>
                                                            <span>{getText('editor:history.imageOutputTokens', 'Image Output Tokens:')}</span>{' '}
                                                            <span>
                                                                {item.costDetails.image_output_tokens.toLocaleString()}{' '}
                                                                (~$
                                                                {calculateCost(
                                                                    item.costDetails.image_output_tokens,
                                                                    0.00004
                                                                )}
                                                                )
                                                            </span>
                                                        </div>
                                                        <hr className='my-2 border-border' />
                                                        <div className='flex justify-between font-medium text-foreground'>
                                                            <span>{getText('editor:history.totalEstimatedCost', 'Total Estimated Cost:')}</span>
                                                            <span>
                                                                ${item.costDetails.estimated_cost_usd.toFixed(4)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button
                                                                type='button'
                                                                variant='secondary'
                                                                size='sm'
                                                                className='bg-secondary text-secondary-foreground hover:bg-secondary/80'>
                                                                {getText('editor:history.close', 'Close')}
                                                            </Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>

                                    <div className='space-y-1 rounded-b-md border border-t-0 border-border dark:border-border bg-card dark:bg-card p-2 text-xs text-muted-foreground dark:text-muted-foreground' style={{ transition: 'none' }}>
                                        <p title={`Edited on: ${new Date(item.timestamp).toLocaleString()}`}>
                                            <span className='font-medium text-foreground dark:text-foreground'>{getText('editor:history.time', 'Time:')}:</span>{' '}
                                            {formatDuration(item.durationMs)}
                                        </p>
                                        <p>
                                            <span className='font-medium text-foreground dark:text-foreground'>{getText('editor:history.quality', 'Quality:')}:</span> {item.quality}
                                        </p>

                                        <div className='mt-2 flex items-center gap-1'>
                                            <Dialog
                                                open={openPromptDialogTimestamp === itemKey}
                                                onOpenChange={(isOpen) =>
                                                    !isOpen && setOpenPromptDialogTimestamp(null)
                                                }>
                                                <DialogTrigger asChild>
                                                    <Button
                                                    variant='outline'
                                                    size='sm'
                                                    className='h-6 flex-grow border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:border-border dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                                                    style={{ transition: 'none' }}
                                                    onClick={() => setOpenPromptDialogTimestamp(itemKey)}>
                                                    {getText('editor:history.showPrompt', 'Show Prompt')}
                                                </Button>
                                                </DialogTrigger>
                                                <DialogContent className='border-border bg-card text-foreground sm:max-w-[625px]'>
                                                    <DialogHeader>
                                                        <DialogTitle className='text-white'>{getText('editor:history.prompt', 'Prompt')}</DialogTitle>
                                                        <DialogDescription className='sr-only'>
                                                            {getText('editor:history.promptDescription', 'The full prompt used to generate this image batch.')}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className='max-h-[400px] overflow-y-auto rounded-md border border-border bg-muted p-3 py-4 text-sm text-muted-foreground'>
                                                        {item.prompt || getText('editor:history.noPromptRecorded', 'No prompt recorded.')}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            variant='outline'
                                                            size='sm'
                                                            onClick={() => handleCopy(item.prompt, itemKey)}
                                                            className='border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'>
                                                            {copiedTimestamp === itemKey ? (
                                                                <Check className='mr-2 h-4 w-4 text-success' />
                                                            ) : (
                                                                <Copy className='mr-2 h-4 w-4' />
                                                            )}
                                                            {copiedTimestamp === itemKey ? getText('editor:history.copied', 'Copied!') : getText('editor:history.copy', 'Copy')}
                                                        </Button>
                                                        <DialogClose asChild>
                                                            <Button
                                                                type='button'
                                                                variant='secondary'
                                                                size='sm'
                                                                className='bg-secondary text-secondary-foreground hover:bg-secondary/80'>
                                                                Close
                                                            </Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog
                                                open={itemPendingDeleteConfirmation?.timestamp === item.timestamp}
                                                onOpenChange={(isOpen) => {
                                                    if (!isOpen) onCancelDeletion();
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        className='h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteItemRequest(item);
                                                        }}
                                                        aria-label='Delete history item'>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className='border-border bg-card text-foreground sm:max-w-md'>
                                                    <DialogHeader>
                                                        <DialogTitle className='text-white'>
                                            {getText('editor:history.confirmDeletion', 'Confirm Deletion')}
                                        </DialogTitle>
                                                        <DialogDescription className='pt-2 text-muted-foreground'>
                                            {getText('editor:history.deleteConfirmMessage', 'Are you sure you want to delete this history entry? This will remove')} {item.images.length} {getText('editor:history.deleteConfirmImages', 'image(s). This action cannot be undone.')}
                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className='flex items-center space-x-2 py-2'>
                                                        <Checkbox
                                                            id={`dont-ask-${item.timestamp}`}
                                                            checked={deletePreferenceDialogValue}
                                                            onCheckedChange={(checked) =>
                                                                onDeletePreferenceDialogChange(!!checked)
                                                            }
                                                            className='border-input bg-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                                                        />
                                                        <label
                                            htmlFor={`dont-ask-${item.timestamp}`}
                                            className='text-sm leading-none font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                                            {getText('editor:history.dontAskAgain', "Don't ask me again")}
                                        </label>
                                                    </div>
                                                    <DialogFooter className='gap-2 sm:justify-end'>
                                                        <Button
                                            type='button'
                                            variant='outline'
                                            size='sm'
                                            onClick={onCancelDeletion}
                                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
                                            {getText('editor:history.cancel', 'Cancel')}
                                        </Button>
                                        <Button
                                            type='button'
                                            variant='destructive'
                                            size='sm'
                                            onClick={onConfirmDeletion}
                                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                            {getText('editor:history.delete', 'Delete')}
                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );

    return useCardWrapper ? (
        <Card className='flex w-full flex-col rounded-lg border border-border bg-card dark:bg-card dark:border-border'>
            {panelContent}
        </Card>
    ) : panelContent;
}

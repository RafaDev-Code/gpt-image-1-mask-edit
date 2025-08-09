'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
    Upload,
    Eraser,
    Save,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Sparkles,
    Tally1,
    Tally2,
    Tally3,
    Loader2,
    X,
    ScanEye,
    UploadCloud,
    Lock,
    LockOpen
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

type DrawnPoint = {
    x: number;
    y: number;
    size: number;
};

export type EditingFormData = {
    prompt: string;
    n: number;
    size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
    quality: 'low' | 'medium' | 'high' | 'auto';
    imageFiles: File[];
    maskFile: File | null;
};

type EditingFormProps = {
    onSubmit: (data: EditingFormData) => void;
    isLoading: boolean;
    isPasswordRequiredByBackend: boolean | null;
    clientPasswordHash: string | null;
    onOpenPasswordDialog: () => void;
    imageFiles: File[];
    useCardWrapper?: boolean;
    sourceImagePreviewUrls: string[];
    setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
    setSourceImagePreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
    maxImages: number;
    editPrompt: string;
    setEditPrompt: React.Dispatch<React.SetStateAction<string>>;
    editN: number[];
    setEditN: React.Dispatch<React.SetStateAction<number[]>>;
    editSize: EditingFormData['size'];
    setEditSize: React.Dispatch<React.SetStateAction<EditingFormData['size']>>;
    editQuality: EditingFormData['quality'];
    setEditQuality: React.Dispatch<React.SetStateAction<EditingFormData['quality']>>;
    editBrushSize: number[];
    setEditBrushSize: React.Dispatch<React.SetStateAction<number[]>>;
    editShowMaskEditor: boolean;
    setEditShowMaskEditor: React.Dispatch<React.SetStateAction<boolean>>;
    editGeneratedMaskFile: File | null;
    setEditGeneratedMaskFile: React.Dispatch<React.SetStateAction<File | null>>;
    editIsMaskSaved: boolean;
    setEditIsMaskSaved: React.Dispatch<React.SetStateAction<boolean>>;
    editOriginalImageSize: { width: number; height: number } | null;
    setEditOriginalImageSize: React.Dispatch<React.SetStateAction<{ width: number; height: number } | null>>;
    editDrawnPoints: DrawnPoint[];
    setEditDrawnPoints: React.Dispatch<React.SetStateAction<DrawnPoint[]>>;
    editMaskPreviewUrl: string | null;
    setEditMaskPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
};

const RadioItemWithIcon = ({
    value,
    id,
    label,
    Icon
}: {
    value: string;
    id: string;
    label: string;
    Icon: React.ElementType;
}) => (
    <div className='flex items-center space-x-2'>
        <RadioGroupItem
            value={value}
            id={id}
            className='border-input text-foreground data-[state=checked]:border-primary data-[state=checked]:text-primary dark:border-input dark:text-foreground dark:data-[state=checked]:border-primary dark:data-[state=checked]:text-primary'
        />
        <Label htmlFor={id} className='flex cursor-pointer items-center gap-2 text-base text-foreground dark:text-foreground'>
            <Icon className='h-5 w-5 text-muted-foreground dark:text-muted-foreground' />
            {label}
        </Label>
    </div>
);

export function EditingForm({
    onSubmit,
    isLoading,
    isPasswordRequiredByBackend,
    clientPasswordHash,
    onOpenPasswordDialog,
    imageFiles,
    sourceImagePreviewUrls,
    setImageFiles,
    setSourceImagePreviewUrls,
    maxImages,
    editPrompt,
    setEditPrompt,
    editN,
    setEditN,
    editSize,
    setEditSize,
    editQuality,
    setEditQuality,
    editBrushSize,
    setEditBrushSize,
    editShowMaskEditor,
    setEditShowMaskEditor,
    editGeneratedMaskFile,
    setEditGeneratedMaskFile,
    editIsMaskSaved,
    setEditIsMaskSaved,
    editOriginalImageSize,
    setEditOriginalImageSize,
    editDrawnPoints,
    setEditDrawnPoints,
    editMaskPreviewUrl,
    setEditMaskPreviewUrl,
    useCardWrapper = true
}: EditingFormProps) {
    const { t } = useTranslation(['common', 'editor']);
    const [mounted, setMounted] = useState(false);
    const [firstImagePreviewUrl, setFirstImagePreviewUrl] = React.useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper function to prevent hydration mismatch
    const getText = (key: string, fallback: string) => {
        return mounted ? t(key) : fallback;
    };

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const visualFeedbackCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const isDrawing = React.useRef(false);
    const lastPos = React.useRef<{ x: number; y: number } | null>(null);
    const maskInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (editOriginalImageSize) {
            if (!visualFeedbackCanvasRef.current) {
                visualFeedbackCanvasRef.current = document.createElement('canvas');
            }
            visualFeedbackCanvasRef.current.width = editOriginalImageSize.width;
            visualFeedbackCanvasRef.current.height = editOriginalImageSize.height;
        }
    }, [editOriginalImageSize]);

    React.useEffect(() => {
        setEditGeneratedMaskFile(null);
        setEditIsMaskSaved(false);
        setEditOriginalImageSize(null);
        setFirstImagePreviewUrl(null);
        setEditDrawnPoints([]);
        setEditMaskPreviewUrl(null);

        if (imageFiles.length > 0 && sourceImagePreviewUrls.length > 0) {
            const img = new window.Image();
            img.onload = () => {
                setEditOriginalImageSize({ width: img.width, height: img.height });
            };
            img.src = sourceImagePreviewUrls[0];
            setFirstImagePreviewUrl(sourceImagePreviewUrls[0]);
        } else {
            setEditShowMaskEditor(false);
        }
    }, [
        imageFiles,
        sourceImagePreviewUrls,
        setEditGeneratedMaskFile,
        setEditIsMaskSaved,
        setEditOriginalImageSize,
        setEditDrawnPoints,
        setEditMaskPreviewUrl,
        setEditShowMaskEditor
    ]);

    React.useEffect(() => {
        const displayCtx = canvasRef.current?.getContext('2d');
        const displayCanvas = canvasRef.current;
        const feedbackCanvas = visualFeedbackCanvasRef.current;

        if (!displayCtx || !displayCanvas || !feedbackCanvas || !editOriginalImageSize) return;

        const feedbackCtx = feedbackCanvas.getContext('2d');
        if (!feedbackCtx) return;

        feedbackCtx.clearRect(0, 0, feedbackCanvas.width, feedbackCanvas.height);
        feedbackCtx.fillStyle = 'red';
        editDrawnPoints.forEach((point) => {
            feedbackCtx.beginPath();
            feedbackCtx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            feedbackCtx.fill();
        });

        displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.save();
        displayCtx.globalAlpha = 0.5;
        displayCtx.drawImage(feedbackCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.restore();
    }, [editDrawnPoints, editOriginalImageSize]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const addPoint = (x: number, y: number) => {
        setEditDrawnPoints((prevPoints) => [...prevPoints, { x, y, size: editBrushSize[0] }]);
        setEditIsMaskSaved(false);
        setEditMaskPreviewUrl(null);
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        const currentPos = getMousePos(e);
        if (!currentPos) return;
        lastPos.current = currentPos;
        addPoint(currentPos.x, currentPos.y);
    };

    const drawLine = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const currentPos = getMousePos(e);
        if (!currentPos || !lastPos.current) return;

        const dist = Math.hypot(currentPos.x - lastPos.current.x, currentPos.y - lastPos.current.y);
        const angle = Math.atan2(currentPos.y - lastPos.current.y, currentPos.x - lastPos.current.x);
        const step = Math.max(1, editBrushSize[0] / 4);

        for (let i = step; i < dist; i += step) {
            const x = lastPos.current.x + Math.cos(angle) * i;
            const y = lastPos.current.y + Math.sin(angle) * i;
            addPoint(x, y);
        }
        addPoint(currentPos.x, currentPos.y);

        lastPos.current = currentPos;
    };

    const drawMaskStroke = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
    };

    const handleClearMask = () => {
        setEditDrawnPoints([]);
        setEditGeneratedMaskFile(null);
        setEditIsMaskSaved(false);
        setEditMaskPreviewUrl(null);
    };

    const generateAndSaveMask = () => {
        if (!editOriginalImageSize || editDrawnPoints.length === 0) {
            setEditGeneratedMaskFile(null);
            setEditIsMaskSaved(false);
            setEditMaskPreviewUrl(null);
            return;
        }

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = editOriginalImageSize.width;
        offscreenCanvas.height = editOriginalImageSize.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (!offscreenCtx) return;

        offscreenCtx.fillStyle = 'var(--canvas-ink)';
        offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.globalCompositeOperation = 'destination-out';
        editDrawnPoints.forEach((point) => {
            drawMaskStroke(offscreenCtx, point.x, point.y, point.size);
        });

        try {
            const dataUrl = offscreenCanvas.toDataURL('image/png');
            setEditMaskPreviewUrl(dataUrl);
        } catch (e) {
            console.error('Error generating mask preview data URL:', e);
            setEditMaskPreviewUrl(null);
        }

        offscreenCanvas.toBlob((blob) => {
            if (blob) {
                const maskFile = new File([blob], 'generated-mask.png', { type: 'image/png' });
                setEditGeneratedMaskFile(maskFile);
                setEditIsMaskSaved(true);
                console.log('Mask generated and saved to state:', maskFile);
            } else {
                console.error('Failed to generate mask blob.');
                setEditIsMaskSaved(false);
                setEditMaskPreviewUrl(null);
            }
        }, 'image/png');
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const totalFiles = imageFiles.length + newFiles.length;

            if (totalFiles > maxImages) {
                alert(`You can only select up to ${maxImages} images.`);
                const allowedNewFiles = newFiles.slice(0, maxImages - imageFiles.length);
                if (allowedNewFiles.length === 0) {
                    event.target.value = '';
                    return;
                }
                newFiles.splice(allowedNewFiles.length);
            }

            setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);

            const newFilePromises = newFiles.map((file) => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newFilePromises)
                .then((newUrls) => {
                    setSourceImagePreviewUrls((prevUrls) => [...prevUrls, ...newUrls]);
                })
                .catch((error) => {
                    console.error('Error reading new image files:', error);
                });

            event.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImageFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
        setSourceImagePreviewUrls((prevUrls) => prevUrls.filter((_, index) => index !== indexToRemove));
    };

    const handleMaskFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editOriginalImageSize) {
            event.target.value = '';
            return;
        }

        if (file.type !== 'image/png') {
            alert('Invalid file type. Please upload a PNG file for the mask.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            if (img.width !== editOriginalImageSize.width || img.height !== editOriginalImageSize.height) {
                alert(
                    `Mask dimensions (${img.width}x${img.height}) must match the source image dimensions (${editOriginalImageSize.width}x${editOriginalImageSize.height}).`
                );
                URL.revokeObjectURL(objectUrl);
                event.target.value = '';
                return;
            }

            setEditGeneratedMaskFile(file);
            setEditIsMaskSaved(true);
            setEditDrawnPoints([]);

            reader.onloadend = () => {
                setEditMaskPreviewUrl(reader.result as string);
                URL.revokeObjectURL(objectUrl);
            };
            reader.onerror = () => {
                console.error('Error reading mask file for preview.');
                setEditMaskPreviewUrl(null);
                URL.revokeObjectURL(objectUrl);
            };
            reader.readAsDataURL(file);

            event.target.value = '';
        };

        img.onerror = () => {
            alert('Failed to load the uploaded mask image to check dimensions.');
            URL.revokeObjectURL(objectUrl);
            event.target.value = '';
        };

        img.src = objectUrl;
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (imageFiles.length === 0) {
            alert('Please select at least one image to edit.');
            return;
        }
        if (editDrawnPoints.length > 0 && !editGeneratedMaskFile && !editIsMaskSaved) {
            alert('Please save the mask you have drawn before submitting.');
            return;
        }

        const formData: EditingFormData = {
            prompt: editPrompt,
            n: editN[0],
            size: editSize,
            quality: editQuality,
            imageFiles: imageFiles,
            maskFile: editGeneratedMaskFile
        };
        onSubmit(formData);
    };

    const displayFileNames = (files: File[]) => {
        if (files.length === 0) return getText('editor:form.noFileSelected', 'No file selected.');
        if (files.length === 1) return files[0].name;
        return `${files.length} ${getText('editor:form.filesSelected', 'files selected')}`;
    };

    const getFileNamesForTooltip = (files: File[]) => {
        if (files.length === 0) return getText('editor:form.noFileSelected', 'No file selected.');
        if (files.length === 1) return files[0].name;
        return files.map(f => f.name).join(', ');
    };

    const formContent = (
        <>
            {useCardWrapper && (
                <CardHeader className='flex items-start justify-between border-b border-border dark:border-border pb-4'>
                    <div>
                        <div className='flex items-center'>
                            <CardTitle className='py-1 text-lg font-medium text-foreground dark:text-foreground' style={{ transition: 'none' }}>{getText('editor:form.title', 'Edit Image')}</CardTitle>
                            {isPasswordRequiredByBackend && (
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={onOpenPasswordDialog}
                                    className='ml-2 text-white/60 hover:text-white'
                                    aria-label='Configure Password'>
                                    {clientPasswordHash ? <Lock className='h-4 w-4' /> : <LockOpen className='h-4 w-4' />}
                                </Button>
                            )}
                        </div>
                        <CardDescription className='mt-1 text-muted-foreground dark:text-muted-foreground' style={{ transition: 'none' }}>{getText('editor:form.description', 'Modify an image using gpt-image-1.')}</CardDescription>
                    </div>
                </CardHeader>
            )}
            <form onSubmit={handleSubmit} className='flex w-full flex-col'>
                <div className={useCardWrapper ? 'w-full space-y-5 p-4' : 'w-full space-y-5'}>
                    <div className='space-y-1.5'>
                        <Label htmlFor='edit-prompt' className='text-foreground dark:text-foreground' style={{ transition: 'none' }}>
                            {getText('editor:form.prompt.label', 'Prompt')}
                        </Label>
                        <Textarea
                            id='edit-prompt'
                            placeholder={getText('editor:form.prompt.placeholder', 'e.g., Add a party hat to the main subject')}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            required
                            disabled={isLoading}
                            className='min-h-[80px] rounded-md border border-input bg-background text-foreground dark:border-input dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-ring dark:focus:ring-ring'
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-foreground dark:text-foreground' style={{ transition: 'none' }}>{getText('editor:form.sourceImages.label', 'Source Image(s) [Max: 10]')}</Label>
                        <Label
                            htmlFor='image-files-input'
                            className='group flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground'>
                            <span className='truncate pr-2 text-muted-foreground group-hover:text-accent-foreground dark:text-muted-foreground dark:group-hover:text-accent-foreground' title={getFileNamesForTooltip(imageFiles)}>{displayFileNames(imageFiles)}</span>
                            <span className='flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground group-hover:text-accent-foreground dark:bg-muted dark:text-muted-foreground dark:group-hover:text-accent-foreground' style={{ transition: 'none' }}>
                                <Upload className='h-3 w-3' /> {getText('editor:form.sourceImages.browse', 'Browse...')}
                            </span>
                        </Label>
                        <Input
                            id='image-files-input'
                            type='file'
                            accept='image/png, image/jpeg, image/webp'
                            multiple
                            onChange={handleImageFileChange}
                            disabled={isLoading || imageFiles.length >= maxImages}
                            className='sr-only'
                        />
                        {sourceImagePreviewUrls.length > 0 && (
                            <div className='flex flex-wrap gap-2 pt-2' style={{ transition: 'none' }}>
                                {sourceImagePreviewUrls.map((url, index) => (
                                    <div key={url} className='relative shrink-0' style={{ transition: 'none' }}>
                                        <Image
                                            src={url}
                                            alt={`Source preview ${index + 1}`}
                                            width={80}
                                            height={80}
                                            className='rounded border border-border dark:border-border object-cover'
                                            style={{ transition: 'none' }}
                                            unoptimized
                                        />
                                        <Button
                                            type='button'
                                            variant='destructive'
                                            size='icon'
                                            className='absolute top-0 right-0 h-5 w-5 translate-x-1/3 -translate-y-1/3 transform rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90'
                                            onClick={() => handleRemoveImage(index)}
                                            aria-label={`Remove image ${index + 1}`}>
                                            <X className='h-3 w-3' />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='space-y-3'>
                        <Label className='block text-foreground dark:text-foreground' style={{ transition: 'none' }}>{getText('editor:form.mask.title', 'Mask')}</Label>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setEditShowMaskEditor(!editShowMaskEditor)}
                            disabled={isLoading || !editOriginalImageSize}
                            className='w-full justify-start border-input px-3 text-foreground hover:bg-accent hover:text-accent-foreground dark:border-input dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                            style={{ transition: 'none' }}>
                            {editShowMaskEditor
                                ? getText('editor:form.mask.editor.close', 'Close Mask Editor')
                                : editGeneratedMaskFile
                                  ? getText('editor:form.mask.editor.editSaved', 'Edit Saved Mask')
                                  : getText('editor:form.mask.editor.create', 'Create Mask')}
                            {editIsMaskSaved && !editShowMaskEditor && (
                                <span className='ml-auto text-xs text-success'>{getText('editor:form.mask.editor.saved', '(Saved)')}</span>
                            )}
                            <ScanEye className='mt-0.5' />
                        </Button>

                        {editShowMaskEditor && firstImagePreviewUrl && editOriginalImageSize && (
                            <div className='space-y-3 rounded-md border border-border bg-card p-3 dark:border-border dark:bg-card' style={{ transition: 'none' }}>
                                <p className='text-xs text-muted-foreground dark:text-muted-foreground'>
                                    {getText('editor:form.mask.editor.instruction', 'Draw on the image to create a mask. The red areas will be edited.')}
                                </p>
                                <div
                                     className='relative mx-auto w-full rounded border border-border dark:border-border'
                                    style={{
                                        maxWidth: `min(100%, ${editOriginalImageSize.width}px)`,
                                        aspectRatio: `${editOriginalImageSize.width} / ${editOriginalImageSize.height}`,
                                        transition: 'none'
                                    }}>
                                    <Image
                                        src={firstImagePreviewUrl}
                                        alt='Image preview for masking'
                                        width={editOriginalImageSize.width}
                                        height={editOriginalImageSize.height}
                                        className='block h-auto w-full'
                                        unoptimized
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        width={editOriginalImageSize.width}
                                        height={editOriginalImageSize.height}
                                        className='absolute top-0 left-0 h-full w-full cursor-crosshair'
                                        onMouseDown={startDrawing}
                                        onMouseMove={drawLine}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={drawLine}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                                <div className='grid grid-cols-1 gap-4 pt-2'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='brush-size-slider' className='text-sm text-foreground dark:text-foreground'>
                                            {getText('editor:form.mask.brushSizeLabel', 'Brush Size')}: {editBrushSize[0]}px
                                        </Label>
                                        <Slider
                                            id='brush-size-slider'
                                            min={5}
                                            max={100}
                                            step={1}
                                            value={editBrushSize}
                                            onValueChange={setEditBrushSize}
                                            disabled={isLoading}
                                            className='mt-1 [&>button]:border-primary [&>button]:bg-background [&>button]:ring-offset-background dark:[&>button]:border-primary dark:[&>button]:bg-background dark:[&>button]:ring-offset-background [&>span:first-child]:h-1 [&>span:first-child>span]:bg-primary dark:[&>span:first-child>span]:bg-primary'
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-2 min-w-0 pt-3 sm:flex sm:flex-wrap sm:gap-2'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => maskInputRef.current?.click()}
                                        disabled={isLoading || !editOriginalImageSize}
                                        title={getText('editor:form.mask.actions.uploadMask', 'Upload Mask')}
                                        className='col-span-1 w-full min-w-0 h-10 border-input text-foreground hover:bg-accent hover:text-accent-foreground dark:border-input dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground sm:w-auto'>
                                        <UploadCloud className='mr-2 h-4 w-4 shrink-0' /> 
                                        <span className='truncate'>{getText('editor:form.mask.actions.uploadMask', 'Upload Mask')}</span>
                                    </Button>
                                    <Input
                                        ref={maskInputRef}
                                        id='mask-file-input'
                                        type='file'
                                        accept='image/png'
                                        onChange={handleMaskFileChange}
                                        className='sr-only'
                                    />
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={handleClearMask}
                                        disabled={isLoading}
                                        title={getText('editor:form.mask.actions.clear', 'Clear')}
                                        className='col-span-1 w-full min-w-0 h-10 border-input text-foreground hover:bg-accent hover:text-accent-foreground dark:border-input dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground sm:w-auto'>
                                        <Eraser className='mr-2 h-4 w-4 shrink-0' /> 
                                        <span className='truncate'>{getText('editor:form.mask.actions.clear', 'Clear')}</span>
                                    </Button>
                                    <Button
                                        type='button'
                                        variant='default'
                                        onClick={generateAndSaveMask}
                                        disabled={isLoading || editDrawnPoints.length === 0}
                                        title={getText('editor:form.mask.actions.saveMask', 'Save Mask')}
                                        className='col-span-2 order-last w-full min-w-0 h-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:order-none sm:col-span-1 sm:w-auto'>
                                        <Save className='mr-2 h-4 w-4 shrink-0' /> 
                                        <span className='truncate'>{getText('editor:form.mask.actions.saveMask', 'Save Mask')}</span>
                                    </Button>
                                </div>
                                {editMaskPreviewUrl && (
                                    <div className='mt-3 border-t border-border pt-3 text-center dark:border-border' style={{ transition: 'none' }}>
                                        <Label className='mb-1.5 block text-sm text-foreground dark:text-foreground'>
                                            {getText('editor:form.mask.generatedMaskPreviewLabel', 'Generated Mask Preview:')}
                                        </Label>
                                        <div className='inline-block rounded border border-border bg-muted p-1 dark:border-border dark:bg-muted' style={{ transition: 'none' }}>
                                            <Image
                                                src={editMaskPreviewUrl}
                                                alt='Generated mask preview'
                                                width={0}
                                                height={134}
                                                className='block max-w-full'
                                                style={{ width: 'auto', height: '134px', transition: 'none' }}
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                )}
                                {editIsMaskSaved && !editMaskPreviewUrl && (
                                    <p className='pt-1 text-center text-xs text-warning'>
                                        {getText('editor:form.mask.generatingMaskPreview', 'Generating mask preview...')}
                                    </p>
                                )}
                                {editIsMaskSaved && editMaskPreviewUrl && (
                                    <p className='pt-1 text-center text-xs text-success'>{getText('editor:form.mask.maskSavedSuccessfully', 'Mask saved successfully!')}</p>
                                )}
                            </div>
                        )}
                        {!editShowMaskEditor && editGeneratedMaskFile && (
                            <p className='pt-1 text-xs text-success'>{getText('editor:form.mask.maskApplied', 'Mask applied:')} {editGeneratedMaskFile.name}</p>
                        )}
                    </div>

                    <div className='space-y-3'>
                        <Label className='block text-foreground dark:text-foreground'>{getText('editor:form.settings.sizeLabel', 'Size')}</Label>
                        <RadioGroup
                            value={editSize}
                            onValueChange={(value) => setEditSize(value as EditingFormData['size'])}
                            disabled={isLoading}
                            className='grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-5 lg:gap-y-3'>
                            <RadioItemWithIcon value='auto' id='edit-size-auto' label={getText('editor:form.settings.sizeLabels.auto', 'Auto')} Icon={Sparkles} />
                            <RadioItemWithIcon value='1024x1024' id='edit-size-square' label={getText('editor:form.settings.sizeLabels.square', 'Square')} Icon={Square} />
                            <RadioItemWithIcon
                                value='1536x1024'
                                id='edit-size-landscape'
                                label={getText('editor:form.settings.sizeLabels.landscape', 'Landscape')}
                                Icon={RectangleHorizontal}
                            />
                            <RadioItemWithIcon
                                value='1024x1536'
                                id='edit-size-portrait'
                                label={getText('editor:form.settings.sizeLabels.portrait', 'Portrait')}
                                Icon={RectangleVertical}
                            />
                        </RadioGroup>
                    </div>

                    <div className='space-y-3'>
                        <Label className='block text-foreground dark:text-foreground'>{getText('editor:form.settings.qualityLabel', 'Quality')}</Label>
                        <RadioGroup
                            value={editQuality}
                            onValueChange={(value) => setEditQuality(value as EditingFormData['quality'])}
                            disabled={isLoading}
                            className='grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-5 lg:gap-y-3'>
                            <RadioItemWithIcon value='auto' id='edit-quality-auto' label={getText('editor:form.settings.qualityLabels.auto', 'Auto')} Icon={Sparkles} />
                            <RadioItemWithIcon value='low' id='edit-quality-low' label={getText('editor:form.settings.qualityLabels.low', 'Low')} Icon={Tally1} />
                            <RadioItemWithIcon value='medium' id='edit-quality-medium' label={getText('editor:form.settings.qualityLabels.medium', 'Medium')} Icon={Tally2} />
                            <RadioItemWithIcon value='high' id='edit-quality-high' label={getText('editor:form.settings.qualityLabels.high', 'High')} Icon={Tally3} />
                        </RadioGroup>
                    </div>



                    <div className='space-y-2'>
                        <Label htmlFor='edit-n-slider' className='text-foreground dark:text-foreground'>
                            {getText('editor:form.settings.numberOfImagesLabel', 'Number of Images')}: {editN[0]}
                        </Label>
                        <Slider
                            id='edit-n-slider'
                            min={1}
                            max={10}
                            step={1}
                            value={editN}
                            onValueChange={setEditN}
                            disabled={isLoading}
                            className='mt-3 [&>button]:border-primary [&>button]:bg-background [&>button]:ring-offset-background dark:[&>button]:border-primary dark:[&>button]:bg-background dark:[&>button]:ring-offset-background [&>span:first-child]:h-1 [&>span:first-child>span]:bg-primary dark:[&>span:first-child>span]:bg-primary'
                        />
                    </div>
                </div>
                <div className={useCardWrapper ? 'border-t border-border p-4 dark:border-border' : 'pt-4'} style={{ transition: 'none' }}>
                    <Button
                        type='submit'
                        disabled={isLoading || !editPrompt || imageFiles.length === 0}
                        className='flex w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-muted dark:disabled:text-muted-foreground'
                        style={{ transition: 'none' }}>
                        {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                        {isLoading ? getText('editor:form.submit.editing', 'Editing...') : getText('editor:form.submit.editImage', 'Edit Image')}
                    </Button>
                </div>
            </form>
        </>
    );

    return useCardWrapper ? (
        <Card className='flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card dark:border-border dark:bg-card'>
            {formContent}
        </Card>
    ) : formContent;
}

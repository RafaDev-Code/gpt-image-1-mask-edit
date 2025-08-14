'use client';

import { EditingForm, type EditingFormData } from '@/components/editing-form';
import { HistoryPanel } from '@/components/history-panel';
import { ImageOutput } from '@/components/image-output';
import { PasswordDialog } from '@/components/password-dialog';
import { LanguageSelector } from '@/components/language-selector';
import { SchemeToggle } from '@/components/scheme-toggle';
import { ColorSwitcher } from '@/components/color-switcher';
import { UserMenu } from '@/components/user-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { calculateApiCost, type CostDetails } from '@/lib/cost-utils';
import { db, type ImageRecord } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { log } from '@/lib/logger';
import { getErrorMessage, isError } from '@/lib/utils';

type HistoryImage = {
    filename: string;
};

export type HistoryMetadata = {
    timestamp: number;
    images: HistoryImage[];
    storageModeUsed?: 'fs' | 'indexeddb';
    durationMs: number;
    quality: EditingFormData['quality'];
    prompt: string;
    mode: 'edit';
    costDetails: CostDetails | null;
    output_format?: string;
};

type DrawnPoint = {
    x: number;
    y: number;
    size: number;
};

const MAX_EDIT_IMAGES = 10;

const explicitModeClient = process.env.NEXT_PUBLIC_IMAGE_STORAGE_MODE;

const vercelEnvClient = process.env.NEXT_PUBLIC_VERCEL_ENV;
const isOnVercelClient = vercelEnvClient === 'production' || vercelEnvClient === 'preview';

let effectiveStorageModeClient: 'fs' | 'indexeddb';

if (explicitModeClient === 'fs') {
    effectiveStorageModeClient = 'fs';
} else if (explicitModeClient === 'indexeddb') {
    effectiveStorageModeClient = 'indexeddb';
} else if (isOnVercelClient) {
    effectiveStorageModeClient = 'indexeddb';
} else {
    effectiveStorageModeClient = 'fs';
}
console.log(
    `Client Effective Storage Mode: ${effectiveStorageModeClient} (Explicit: ${explicitModeClient || 'unset'}, Vercel Env: ${vercelEnvClient || 'N/A'})`
);

type ApiImageResponseItem = {
    filename: string;
    b64_json?: string;
    output_format: string;
    path?: string;
};

export default function HomePage() {
    const { t } = useTranslation(['common', 'editor']);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const getText = (key: string, fallback: string) => {
        return mounted ? t(key) : fallback;
    };
    const [mode] = React.useState<'edit'>('edit');
    const [isPasswordRequiredByBackend, setIsPasswordRequiredByBackend] = React.useState<boolean | null>(null);
    const [clientPasswordHash, setClientPasswordHash] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSendingToEdit, setIsSendingToEdit] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [latestImageBatch, setLatestImageBatch] = React.useState<{ path: string; filename: string }[] | null>(null);
    const [imageOutputView, setImageOutputView] = React.useState<'grid' | number>('grid');
    const [history, setHistory] = React.useState<HistoryMetadata[]>([]);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [blobUrlCache, setBlobUrlCache] = React.useState<Record<string, string>>({});
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
    const [passwordDialogContext, setPasswordDialogContext] = React.useState<'initial' | 'retry'>('initial');
    const [lastApiCallArgs, setLastApiCallArgs] = React.useState<[EditingFormData] | null>(null);
    const [skipDeleteConfirmation, setSkipDeleteConfirmation] = React.useState<boolean>(false);
    const [itemToDeleteConfirm, setItemToDeleteConfirm] = React.useState<HistoryMetadata | null>(null);
    const [dialogCheckboxStateSkipConfirm, setDialogCheckboxStateSkipConfirm] = React.useState<boolean>(false);

    const allDbImages = useLiveQuery<ImageRecord[] | undefined>(() => db.images.toArray(), []);

    const [editImageFiles, setEditImageFiles] = React.useState<File[]>([]);
    const [editSourceImagePreviewUrls, setEditSourceImagePreviewUrls] = React.useState<string[]>([]);
    const [editPrompt, setEditPrompt] = React.useState('');
    const [editN, setEditN] = React.useState([1]);
    const [editSize, setEditSize] = React.useState<EditingFormData['size']>('auto');
    const [editQuality, setEditQuality] = React.useState<EditingFormData['quality']>('auto');
    const [editBrushSize, setEditBrushSize] = React.useState([20]);
    const [editShowMaskEditor, setEditShowMaskEditor] = React.useState(false);
    const [editGeneratedMaskFile, setEditGeneratedMaskFile] = React.useState<File | null>(null);
    const [editIsMaskSaved, setEditIsMaskSaved] = React.useState(false);
    const [editOriginalImageSize, setEditOriginalImageSize] = React.useState<{ width: number; height: number } | null>(
        null
    );
    const [editDrawnPoints, setEditDrawnPoints] = React.useState<DrawnPoint[]>([]);
    const [editMaskPreviewUrl, setEditMaskPreviewUrl] = React.useState<string | null>(null);



    const getImageSrc = React.useCallback(
        (filename: string): string | undefined => {
            if (blobUrlCache[filename]) {
                return blobUrlCache[filename];
            }

            const record = allDbImages?.find((img) => img.filename === filename);
            if (record?.blob) {
                const url = URL.createObjectURL(record.blob);
                // Cache the URL to avoid creating multiple URLs for the same blob
                setBlobUrlCache((prev) => ({ ...prev, [filename]: url }));
                return url;
            }

            return undefined;
        },
        [allDbImages, blobUrlCache]
    );

    // Cleanup blob URLs only when component unmounts
    React.useEffect(() => {
        return () => {
            Object.values(blobUrlCache).forEach((url) => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, []);

    React.useEffect(() => {
        return () => {
            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [editSourceImagePreviewUrls]);

    React.useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('openaiImageHistory');
            if (storedHistory) {
                const parsedHistory: HistoryMetadata[] = JSON.parse(storedHistory);
                if (Array.isArray(parsedHistory)) {
                    setHistory(parsedHistory);
                } else {
                    console.warn('Invalid history data found in localStorage.');
                    localStorage.removeItem('openaiImageHistory');
                }
            }
        } catch (err: unknown) {
            log.warn('Failed to load history from localStorage', {
                component: 'home-page',
                error: isError(err) ? err.message : String(err)
            });
            localStorage.removeItem('openaiImageHistory');
        }
        setIsInitialLoad(false);
    }, []);

    React.useEffect(() => {
        const fetchAuthStatus = async () => {
            try {
                const response = await fetch('/api/auth-status');
                if (!response.ok) {
                    throw new Error('Failed to fetch auth status');
                }
                const data = await response.json();
                setIsPasswordRequiredByBackend(data.passwordRequired);
            } catch (err: unknown) {
                log.warn('Error fetching auth status', {
                    component: 'home-page',
                    error: isError(err) ? err.message : String(err)
                });
                setIsPasswordRequiredByBackend(false);
            }
        };

        fetchAuthStatus();
        const storedHash = localStorage.getItem('clientPasswordHash');
        if (storedHash) {
            setClientPasswordHash(storedHash);
        }
    }, []);

    React.useEffect(() => {
        if (!isInitialLoad) {
            try {
                localStorage.setItem('openaiImageHistory', JSON.stringify(history));
            } catch (err: unknown) {
                log.warn('Failed to save history to localStorage', {
                    component: 'home-page',
                    error: isError(err) ? err.message : String(err)
                });
            }
        }
    }, [history, isInitialLoad]);

    React.useEffect(() => {
        return () => {
            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [editSourceImagePreviewUrls]);

    React.useEffect(() => {
        const storedPref = localStorage.getItem('imageGenSkipDeleteConfirm');
        if (storedPref === 'true') {
            setSkipDeleteConfirmation(true);
        } else if (storedPref === 'false') {
            setSkipDeleteConfirmation(false);
        }
    }, []);

    React.useEffect(() => {
        localStorage.setItem('imageGenSkipDeleteConfirm', String(skipDeleteConfirmation));
    }, [skipDeleteConfirmation]);

    React.useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (mode !== 'edit' || !event.clipboardData) {
                return;
            }

            if (editImageFiles.length >= MAX_EDIT_IMAGES) {
                alert(`Cannot paste: Maximum of ${MAX_EDIT_IMAGES} images reached.`);
                return;
            }

            const items = event.clipboardData.items;
            let imageFound = false;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        event.preventDefault();
                        imageFound = true;

                        const previewUrl = URL.createObjectURL(file);

                        setEditImageFiles((prevFiles) => [...prevFiles, file]);
                        setEditSourceImagePreviewUrls((prevUrls) => [...prevUrls, previewUrl]);

                        // Image added from paste

                        break;
                    }
                }
            }
            if (!imageFound) {
                // No valid image found in paste event
            }
        };

        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [mode, editImageFiles.length]);

    async function sha256Client(text: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    const handleSavePassword = async (password: string) => {
        if (!password.trim()) {
            setError('Password cannot be empty.');
            return;
        }
        try {
            const hash = await sha256Client(password);
            localStorage.setItem('clientPasswordHash', hash);
            setClientPasswordHash(hash);
            setError(null);
            setIsPasswordDialogOpen(false);
            if (passwordDialogContext === 'retry' && lastApiCallArgs) {
                // Retrying API call with saved password
                await handleApiCall(...lastApiCallArgs);
            }
        } catch (err: unknown) {
            log.error('Error hashing password', {
                component: 'HomePage',
                error: isError(err) ? err.message : String(err)
            });
            setError('Failed to save password due to a hashing error.');
        }
    };

    const handleOpenPasswordDialog = () => {
        setPasswordDialogContext('initial');
        setIsPasswordDialogOpen(true);
    };

    const getMimeTypeFromFormat = (format: string): string => {
        if (format === 'jpeg') return 'image/jpeg';
        if (format === 'webp') return 'image/webp';

        return 'image/png';
    };

    // Function to properly manage blob URLs - revoke old ones and set new ones
    const updateBlobUrls = React.useCallback((newUrls: Record<string, string>) => {
        setBlobUrlCache((prevCache) => {
            // Revoke old URLs that are not in the new set
            Object.entries(prevCache).forEach(([filename, url]) => {
                if (!newUrls[filename] && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            return newUrls;
        });
    }, []);

    const handleApiCall = async (data: EditingFormData) => {
        const startTime = Date.now();
        let durationMs = 0;

        setIsLoading(true);
        setError(null);
        setLatestImageBatch(null);
        setImageOutputView('grid');

        const apiFormData = new FormData();
        if (isPasswordRequiredByBackend && clientPasswordHash) {
            apiFormData.append('passwordHash', clientPasswordHash);
        } else if (isPasswordRequiredByBackend && !clientPasswordHash) {
            setError('Password is required. Please configure the password by clicking the lock icon.');
            setPasswordDialogContext('initial');
            setIsPasswordDialogOpen(true);
            setIsLoading(false);
            return;
        }
        apiFormData.append('mode', mode);

        apiFormData.append('prompt', editPrompt);
        apiFormData.append('n', editN[0].toString());
        apiFormData.append('size', editSize);
        apiFormData.append('quality', editQuality);

        editImageFiles.forEach((file, index) => {
            apiFormData.append(`image_${index}`, file, file.name);
        });
        if (editGeneratedMaskFile) {
            apiFormData.append('mask', editGeneratedMaskFile, editGeneratedMaskFile.name);
        }

        // Sending image generation request

        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                body: apiFormData
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 && isPasswordRequiredByBackend) {
                    setError('Unauthorized: Invalid or missing password. Please try again.');
                    setPasswordDialogContext('retry');
                    setLastApiCallArgs([data]);
                    setIsPasswordDialogOpen(true);

                    return;
                }
                throw new Error(result.error || `API request failed with status ${response.status}`);
            }

            // API response received

            if (result.images && result.images.length > 0) {
                durationMs = Date.now() - startTime;
                // API call completed

                const historyQuality = editQuality;
                const historyPrompt = editPrompt;

                const costDetails = calculateApiCost(result.usage);

                const batchTimestamp = Date.now();
                const newHistoryEntry: HistoryMetadata = {
                    timestamp: batchTimestamp,
                    images: result.images.map((img: { filename: string }) => ({ filename: img.filename })),
                    storageModeUsed: effectiveStorageModeClient,
                    durationMs: durationMs,
                    quality: historyQuality,
                    prompt: historyPrompt,
                    mode: mode,
                    costDetails: costDetails,
                    output_format: 'png'
                };

                let newImageBatchPromises: Promise<{ path: string; filename: string } | null>[] = [];
                if (effectiveStorageModeClient === 'indexeddb') {
                    // Processing images for storage
                    newImageBatchPromises = result.images.map(async (img: ApiImageResponseItem) => {
                        if (img.b64_json) {
                            try {
                                const byteCharacters = atob(img.b64_json);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);

                                const actualMimeType = getMimeTypeFromFormat(img.output_format);
                                const blob = new Blob([byteArray], { type: actualMimeType });

                                await db.images.put({ filename: img.filename, blob, timestamp: Date.now() });
                                // Image saved to storage

                                const blobUrl = URL.createObjectURL(blob);
                                return { filename: img.filename, path: blobUrl, blobUrl };
                            } catch (err: unknown) {
                                log.error('Error saving blob to IndexedDB', {
                                    component: 'home-page',
                                    filename: img.filename,
                                    error: isError(err) ? err.message : String(err)
                                });
                                setError(`Failed to save image ${img.filename} to local database.`);
                                return null;
                            }
                        } else {
                            // Image missing data in storage mode
                            return null;
                        }
                    });
                } else {
                    newImageBatchPromises = result.images
                        .filter((img: ApiImageResponseItem) => !!img.path)
                        .map((img: ApiImageResponseItem) =>
                            Promise.resolve({
                                path: img.path!,
                                filename: img.filename
                            })
                        );
                }

                const processedImages = (await Promise.all(newImageBatchPromises)).filter(Boolean) as {
                    path: string;
                    filename: string;
                    blobUrl?: string;
                }[];

                // Update blob URL cache for IndexedDB mode
                if (effectiveStorageModeClient === 'indexeddb') {
                    const newBlobUrls: Record<string, string> = {};
                    processedImages.forEach((img) => {
                        if (img.blobUrl) {
                            newBlobUrls[img.filename] = img.blobUrl;
                        }
                    });
                    updateBlobUrls(newBlobUrls);
                }

                setLatestImageBatch(processedImages);
                setImageOutputView(processedImages.length > 1 ? 'grid' : 0);

                setHistory((prevHistory) => [newHistoryEntry, ...prevHistory]);
            } else {
                setLatestImageBatch(null);
                throw new Error('API response did not contain valid image data or filenames.');
            }
        } catch (err: unknown) {
            durationMs = Date.now() - startTime;
            log.error('API call failed', {
                component: 'home-page',
                durationMs,
                error: isError(err) ? err.message : String(err)
            });
            setError(getErrorMessage(err) || 'An unexpected error occurred.');
            setLatestImageBatch(null);
        } finally {
            if (durationMs === 0) durationMs = Date.now() - startTime;
            setIsLoading(false);
        }
    };

    const handleHistorySelect = (item: HistoryMetadata) => {
        // Selecting history item
        const originalStorageMode = item.storageModeUsed || 'fs';

        const selectedBatchPromises = item.images.map(async (imgInfo) => {
            let path: string | undefined;
            if (originalStorageMode === 'indexeddb') {
                path = getImageSrc(imgInfo.filename);
            } else {
                path = `/api/image/${imgInfo.filename}`;
            }

            if (path) {
                return { path, filename: imgInfo.filename };
            } else {
                // Could not load image from history
                setError(`Image ${imgInfo.filename} could not be loaded.`);
                return null;
            }
        });

        Promise.all(selectedBatchPromises).then((resolvedBatch) => {
            const validImages = resolvedBatch.filter(Boolean) as { path: string; filename: string }[];

            if (validImages.length !== item.images.length && !error) {
                setError(
                    'Some images from this history entry could not be loaded (they might have been cleared or are missing).'
                );
            } else if (validImages.length === item.images.length) {
                setError(null);
            }

            setLatestImageBatch(validImages.length > 0 ? validImages : null);
            setImageOutputView(validImages.length > 1 ? 'grid' : 0);
        });
    };

    const handleClearHistory = async () => {
        const confirmationMessage =
            effectiveStorageModeClient === 'indexeddb'
                ? 'Are you sure you want to clear the entire image history? In IndexedDB mode, this will also permanently delete all stored images. This cannot be undone.'
                : 'Are you sure you want to clear the entire image history? This cannot be undone.';

        if (window.confirm(confirmationMessage)) {
            setHistory([]);
            setLatestImageBatch(null);
            setImageOutputView('grid');
            setError(null);

            try {
                localStorage.removeItem('openaiImageHistory');
                // History metadata cleared

                if (effectiveStorageModeClient === 'indexeddb') {
                    await db.images.clear();
                    // Images cleared from storage

                    setBlobUrlCache({});
                }
            } catch (err: unknown) {
                log.error('Failed during history clearing', {
                    component: 'HomePage',
                    error: isError(err) ? err.message : String(err)
                });
                setError(`Failed to clear history: ${isError(err) ? err.message : String(err)}`);
            }
        }
    };

    const handleSendToEdit = async (filename: string) => {
        if (isSendingToEdit) return;
        setIsSendingToEdit(true);
        setError(null);

        const alreadyExists = editImageFiles.some((file) => file.name === filename);
        if (alreadyExists) {
            // Image already in edit list
            setIsSendingToEdit(false);
            return;
        }

        if (editImageFiles.length >= MAX_EDIT_IMAGES) {
            setError(`Cannot add more than ${MAX_EDIT_IMAGES} images to the edit form.`);
            setIsSendingToEdit(false);
            return;
        }

        // Sending image to edit form

        try {
            let blob: Blob | undefined;
            let mimeType: string = 'image/png';

            if (effectiveStorageModeClient === 'indexeddb') {
                // Fetching image from storage

                const record = allDbImages?.find((img) => img.filename === filename);
                if (record?.blob) {
                    blob = record.blob;
                    mimeType = blob.type || mimeType;
                    // Image found in storage
                } else {
                    throw new Error(`Image ${filename} not found in local database.`);
                }
            } else {
                // Fetching image from API
                const response = await fetch(`/api/image/${filename}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                blob = await response.blob();
                mimeType = response.headers.get('Content-Type') || mimeType;
                // Image fetched from API
            }

            if (!blob) {
                throw new Error(`Could not retrieve image data for ${filename}.`);
            }

            const newFile = new File([blob], filename, { type: mimeType });
            const newPreviewUrl = URL.createObjectURL(blob);

            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

            setEditImageFiles([newFile]);
            setEditSourceImagePreviewUrls([newPreviewUrl]);

            // Mode is always 'edit' in this version

            // Image successfully added to edit form
        } catch (err: unknown) {
            log.error('Error sending image to edit', {
                component: 'home-page',
                filename,
                error: isError(err) ? err.message : String(err)
            });
            setError(getErrorMessage(err) || 'Failed to send image to edit form.');
        } finally {
            setIsSendingToEdit(false);
        }
    };

    const executeDeleteItem = async (item: HistoryMetadata) => {
        if (!item) return;
        // Executing delete for history item
        setError(null); // Clear previous errors

        const { images: imagesInEntry, storageModeUsed, timestamp } = item;
        const filenamesToDelete = imagesInEntry.map((img) => img.filename);

        try {
            if (storageModeUsed === 'indexeddb') {
                // Deleting from storage
                await db.images.where('filename').anyOf(filenamesToDelete).delete();
                setBlobUrlCache((prevCache) => {
                    const newCache = { ...prevCache };
                    filenamesToDelete.forEach((fn) => delete newCache[fn]);
                    return newCache;
                });
                // Successfully deleted from storage
            } else if (storageModeUsed === 'fs') {
                // Requesting deletion via API
                const apiPayload: { filenames: string[]; passwordHash?: string } = { filenames: filenamesToDelete };
                if (isPasswordRequiredByBackend && clientPasswordHash) {
                    apiPayload.passwordHash = clientPasswordHash;
                }

                const response = await fetch('/api/image-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiPayload)
                });

                const result = await response.json();
                if (!response.ok) {
                    // API deletion error
                    throw new Error(result.error || `API deletion failed with status ${response.status}`);
                }
                // API deletion successful
            }

            setHistory((prevHistory) => prevHistory.filter((h) => h.timestamp !== timestamp));
            if (latestImageBatch && latestImageBatch.some((img) => filenamesToDelete.includes(img.filename))) {
                setLatestImageBatch(null); // Clear current view if it contained deleted images
            }
        } catch (err: unknown) {
            log.error('Error during item deletion', {
                component: 'home-page',
                timestamp,
                error: isError(err) ? err.message : String(err)
            });
            setError(getErrorMessage(err) || 'An unexpected error occurred during deletion.');
        } finally {
            setItemToDeleteConfirm(null); // Always close dialog
        }
    };

    const handleRequestDeleteItem = (item: HistoryMetadata) => {
        if (!skipDeleteConfirmation) {
            setDialogCheckboxStateSkipConfirm(skipDeleteConfirmation);
            setItemToDeleteConfirm(item);
        } else {
            executeDeleteItem(item);
        }
    };

    const handleConfirmDeletion = () => {
        if (itemToDeleteConfirm) {
            executeDeleteItem(itemToDeleteConfirm);
            setSkipDeleteConfirmation(dialogCheckboxStateSkipConfirm);
        }
    };

    const handleCancelDeletion = () => {
        setItemToDeleteConfirm(null);
    };


    
    return (
        <main className="min-h-screen bg-background">
            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                onSave={handleSavePassword}
                title={passwordDialogContext === 'retry' ? getText('common:passwordDialog.titleRequired', 'Password Required') : getText('common:passwordDialog.titleConfigure', 'Configure Password')}
                description={
                    passwordDialogContext === 'retry'
                        ? getText('common:passwordDialog.descriptionRequired', 'The server requires a password, or the previous one was incorrect. Please enter it to continue.')
                        : getText('common:passwordDialog.descriptionConfigure', 'Set a password to use for API requests.')
                }
            />
            
            {/* Header */}
            <header className="relative z-[100] pointer-events-auto border-b bg-background">
                <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 lg:px-6">
                    {/* 1 fila, sin wrap, optimizado para 320px+ */}
                    <div className="flex flex-nowrap items-center gap-1 sm:gap-2 py-3 sm:py-4 min-w-0">
                        {/* Izquierda: el que se encoge y trunca */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <LanguageSelector className="w-full max-w-[120px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[280px] truncate" />
                        </div>

                        {/* Derecha: cluster fijo que NO se encoge */}
                        <div className="shrink-0 flex items-center gap-1 sm:gap-2">
                            <UserMenu />
                            <SchemeToggle />
                            {/* Color como botón con dropdown (no pills visibles) */}
                            <ColorSwitcher />
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Main content */}
            <section className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-6 overflow-hidden">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 overflow-hidden">
                    <div className="min-w-0">
                        <div className="bg-card border border-border rounded-lg p-6 w-full">
                        <EditingForm
                            onSubmit={handleApiCall}
                            isLoading={isLoading || isSendingToEdit}
                            isPasswordRequiredByBackend={isPasswordRequiredByBackend}
                            clientPasswordHash={clientPasswordHash}
                            onOpenPasswordDialog={handleOpenPasswordDialog}
                            imageFiles={editImageFiles}
                            sourceImagePreviewUrls={editSourceImagePreviewUrls}
                            setImageFiles={setEditImageFiles}
                            setSourceImagePreviewUrls={setEditSourceImagePreviewUrls}
                            maxImages={MAX_EDIT_IMAGES}
                            editPrompt={editPrompt}
                            setEditPrompt={setEditPrompt}
                            editN={editN}
                            setEditN={setEditN}
                            editSize={editSize}
                            setEditSize={setEditSize}
                            editQuality={editQuality}
                            setEditQuality={setEditQuality}
                            editBrushSize={editBrushSize}
                            setEditBrushSize={setEditBrushSize}
                            editShowMaskEditor={editShowMaskEditor}
                            setEditShowMaskEditor={setEditShowMaskEditor}
                            editGeneratedMaskFile={editGeneratedMaskFile}
                            setEditGeneratedMaskFile={setEditGeneratedMaskFile}
                            editIsMaskSaved={editIsMaskSaved}
                            setEditIsMaskSaved={setEditIsMaskSaved}
                            editOriginalImageSize={editOriginalImageSize}
                            setEditOriginalImageSize={setEditOriginalImageSize}
                            editDrawnPoints={editDrawnPoints}
                            setEditDrawnPoints={setEditDrawnPoints}
                            editMaskPreviewUrl={editMaskPreviewUrl}
                            setEditMaskPreviewUrl={setEditMaskPreviewUrl}
                            useCardWrapper={false}
                        />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="bg-card border border-border rounded-lg p-6 w-full">
                        {error && (
                            <Alert variant='destructive' className='mb-4 border-destructive bg-[var(--state-error-soft)] text-destructive-foreground'>
                                <AlertTitle className='text-destructive-foreground'>{t('common:messages.error')}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <ImageOutput
                            imageBatch={latestImageBatch}
                            viewMode={imageOutputView}
                            onViewChange={setImageOutputView}
                            altText='Generated image output'
                            isLoading={isLoading || isSendingToEdit}
                            onSendToEdit={handleSendToEdit}
                            currentMode={mode}
                            baseImagePreviewUrl={editSourceImagePreviewUrls[0] || null}
                        />
                        </div>
                    </div>
                </div>
            </section>
            
            {/* History */}
            <section className="mx-auto w-full max-w-6xl px-4 lg:px-6 pb-10 overflow-hidden">
                <div className="bg-card border border-border rounded-lg p-6 w-full overflow-hidden">
                    <HistoryPanel
                        history={history}
                        onSelectImage={handleHistorySelect}
                        onClearHistory={handleClearHistory}
                        getImageSrc={getImageSrc}
                        onDeleteItemRequest={handleRequestDeleteItem}
                        itemPendingDeleteConfirmation={itemToDeleteConfirm}
                        onConfirmDeletion={handleConfirmDeletion}
                        onCancelDeletion={handleCancelDeletion}
                        deletePreferenceDialogValue={dialogCheckboxStateSkipConfirm}
                        onDeletePreferenceDialogChange={setDialogCheckboxStateSkipConfirm}
                        useCardWrapper={false}
                    />
                </div>
            </section>
        </main>
    );
}

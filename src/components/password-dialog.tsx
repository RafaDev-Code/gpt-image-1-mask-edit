'use client';

// Autenticación por password hash comentada para desarrollo local
// Este componente no se usará activamente en desarrollo local

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

interface PasswordDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (password: string) => void;
    title?: string;
    description?: string;
}

export function PasswordDialog({
    isOpen,
    onOpenChange,
    onSave,
    title = 'Configure Password',
    description
}: PasswordDialogProps) {
    const { t } = useTranslation('common');
    const [mounted, setMounted] = useState(false);
    const [currentPassword, setCurrentPassword] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getText = (key: string, fallback: string) => {
        return mounted ? t(key) : fallback;
    };

    const handleSave = () => {
        inputRef.current?.blur();
        onSave(currentPassword);
        setCurrentPassword('');
        onOpenChange(false);
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setCurrentPassword('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className='border-gray-200 bg-white text-gray-900 dark:border-white/20 dark:bg-black dark:text-white sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle className='text-gray-900 dark:text-white'>{title}</DialogTitle>
                    {description && <DialogDescription className='text-gray-500 dark:text-white/60'>{description}</DialogDescription>}
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                    <div className='grid grid-cols-1 items-center gap-4'>
                        <Input
                            ref={inputRef}
                            id='password-input'
                            type='password'
                            placeholder={getText('passwordInput.placeholder', 'Enter your password')}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className='col-span-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-gray-400 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/50 dark:focus:ring-white/50'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && currentPassword.trim()) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type='button'
                        onClick={handleSave}
                        disabled={!currentPassword.trim()}
                        className='bg-primary px-6 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground'>
                        {getText('passwordInput.saveButton', 'Save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

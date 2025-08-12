import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isError(e: unknown): e is Error {
    return e instanceof Error;
}

export function getErrorMessage(e: unknown): string {
    if (e instanceof Error) {
        return e.message || 'Unknown error';
    }
    return String(e);
}

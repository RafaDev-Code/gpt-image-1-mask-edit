// Autenticación por password hash y Dual storage (lib/db.ts, modo indexeddb + filesystem) 
// Por el momento no me van a servir, voy a trabajar local.
// Manteniendo solo la estructura básica para compatibilidad

import Dexie, { Table } from 'dexie';

export interface ImageRecord {
    id?: number;
    filename: string;
    blob: Blob;
    timestamp: number;
}

// Clase simplificada para desarrollo local - IndexedDB no se usará activamente
export class ImageDB extends Dexie {
    images!: Table<ImageRecord>;

    constructor() {
        super('ImageDatabase');
        this.version(1).stores({
            images: '++id, filename, timestamp'
        });
    }
}

// Instancia mantenida para compatibilidad, pero no se usará en desarrollo local
export const db = new ImageDB();

// NOTA: En desarrollo local se usa modo 'fs' (filesystem) en lugar de IndexedDB

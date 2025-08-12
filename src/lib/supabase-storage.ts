/**
 * Supabase Storage Integration (Opcional)
 * 
 * Este archivo demuestra cómo implementar almacenamiento persistente
 * de imágenes usando Supabase Storage con buckets privados y URLs firmadas.
 * 
 * Para usar este sistema:
 * 1. Crear bucket 'image-results' en Supabase Storage (privado)
 * 2. Configurar RLS policies para owner-only access
 * 3. Reemplazar el sistema actual de memoria/filesystem
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './db.types'
import { logger } from './logger'
import { isError } from './utils'

// Cliente de Supabase para operaciones de storage
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET_NAME = 'image-results'
const SIGNED_URL_EXPIRY = 3600 // 1 hora en segundos

export interface StorageResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

/**
 * Sube una imagen al bucket privado de Supabase Storage
 * 
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario propietario
 * @param filename - Nombre del archivo (opcional, se genera automáticamente)
 * @returns Resultado de la operación con URL firmada
 */
export async function uploadImage(
  file: File | Blob,
  userId: string,
  filename?: string
): Promise<StorageResult> {
  try {
    // Generar nombre único si no se proporciona
    const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const filePath = `user-${userId}/${finalFilename}`

    // Subir archivo al bucket privado
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // No sobrescribir archivos existentes
        contentType: file.type || 'image/png'
      })

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError)
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      }
    }

    // Generar URL firmada para acceso temporal
    const signedUrlResult = await getSignedUrl(filePath)
    
    if (!signedUrlResult.success) {
      return signedUrlResult
    }

    return {
      success: true,
      url: signedUrlResult.url,
      path: filePath
    }

  } catch (err: unknown) {
    logger.error('Unexpected error in uploadImage', {
      component: 'SupabaseStorage',
      error: isError(err) ? err.message : String(err)
    })
    return {
      success: false,
      error: 'Unexpected error occurred during upload'
    }
  }
}

/**
 * Genera una URL firmada para acceder a una imagen privada
 * 
 * @param filePath - Ruta del archivo en el bucket
 * @returns URL firmada válida por 1 hora
 */
export async function getSignedUrl(filePath: string): Promise<StorageResult> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY)

    if (error) {
      console.error('Error creating signed URL:', error)
      return {
        success: false,
        error: `Failed to create signed URL: ${error.message}`
      }
    }

    return {
      success: true,
      url: data.signedUrl
    }

  } catch (err: unknown) {
    logger.error('Unexpected error in getSignedUrl', {
      component: 'SupabaseStorage',
      error: isError(err) ? err.message : String(err)
    })
    return {
      success: false,
      error: 'Unexpected error occurred while creating signed URL'
    }
  }
}

/**
 * Elimina una imagen del bucket
 * 
 * @param filePath - Ruta del archivo a eliminar
 * @returns Resultado de la operación
 */
export async function deleteImage(filePath: string): Promise<StorageResult> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Error deleting from Supabase Storage:', error)
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      }
    }

    return {
      success: true
    }

  } catch (err: unknown) {
    logger.error('Unexpected error in deleteImage', {
      component: 'SupabaseStorage',
      error: isError(err) ? err.message : String(err)
    })
    return {
      success: false,
      error: 'Unexpected error occurred during deletion'
    }
  }
}

/**
 * Lista todas las imágenes de un usuario
 * 
 * @param userId - ID del usuario
 * @returns Lista de archivos del usuario
 */
export async function listUserImages(userId: string) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`user-${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing user images:', error)
      return {
        success: false,
        error: `Failed to list images: ${error.message}`,
        files: []
      }
    }

    return {
      success: true,
      files: data || []
    }

  } catch (err: unknown) {
    logger.error('Unexpected error in listUserImages', {
      component: 'SupabaseStorage',
      error: isError(err) ? err.message : String(err)
    })
    return {
      success: false,
      error: 'Unexpected error occurred while listing images',
      files: []
    }
  }
}

/**
 * Configuración inicial del bucket (ejecutar una sola vez)
 * 
 * Esta función debe ejecutarse una vez para configurar el bucket
 * y las políticas de seguridad necesarias.
 */
export async function setupStorageBucket() {
  console.log(`
🔧 Configuración de Supabase Storage:

1. Ve a tu proyecto de Supabase > Storage
2. Crea un nuevo bucket llamado '${BUCKET_NAME}'
3. Marca el bucket como PRIVADO
4. Configura las siguientes RLS policies:

-- Policy para permitir a los usuarios subir sus propias imágenes
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = '${BUCKET_NAME}' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para permitir a los usuarios ver sus propias imágenes
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = '${BUCKET_NAME}' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para permitir a los usuarios eliminar sus propias imágenes
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = '${BUCKET_NAME}' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

5. Habilita RLS en la tabla storage.objects si no está habilitado

✅ Una vez configurado, puedes usar las funciones de este archivo.
`)
}

// Ejemplo de uso:
// 
// import { uploadImage, getSignedUrl } from '@/lib/supabase-storage'
// 
// // Subir imagen
// const result = await uploadImage(imageFile, user.id)
// if (result.success) {
//   console.log('Image uploaded:', result.url)
// }
// 
// // Obtener URL firmada para imagen existente
// const urlResult = await getSignedUrl('user-123/image.png')
// if (urlResult.success) {
//   console.log('Signed URL:', urlResult.url)
// }
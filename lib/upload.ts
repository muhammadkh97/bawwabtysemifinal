/**
 * Supabase Storage Upload Utility
 * Handles document uploads for vendor and driver verification
 */

import { supabase } from './supabase';
import { logger } from '@/lib/logger';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface DocumentUpload {
  file: File;
  userId: string;
  documentType: 'id' | 'license' | 'vehicle_registration';
}

/**
 * Upload a document to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID
 * @param documentType - Type of document
 * @param onProgress - Optional progress callback
 * @returns Upload result with URL and path
 */
export async function uploadDocument(
  file: File,
  userId: string,
  documentType: 'id' | 'license' | 'vehicle_registration',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { url: '', path: '', error: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' };
    }

    // Allowed types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { url: '', path: '', error: 'نوع الملف غير مدعوم. الرجاء رفع صورة أو PDF' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}_${randomString}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    // Simulate progress
    if (onProgress) {
      onProgress(20);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('Upload error', { error: error.message, component: 'uploadDocument' });
      return { url: '', path: '', error: 'فشل رفع الملف. الرجاء المحاولة مرة أخرى' };
    }

    if (onProgress) {
      onProgress(80);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    if (onProgress) {
      onProgress(100);
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Upload error', { error: errorMessage, component: 'uploadDocument' });
    return { url: '', path: '', error: 'حدث خطأ أثناء رفع الملف' };
  }
}

/**
 * Delete a document from Supabase Storage
 * @param path - The file path to delete
 * @returns Success status
 */
export async function deleteDocument(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) {
      logger.error('Delete error', { error: error.message, component: 'deleteDocument' });
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Delete error', { error: errorMessage, component: 'deleteDocument' });
    return false;
  }
}

/**
 * Upload multiple documents at once
 * @param uploads - Array of documents to upload
 * @param onProgress - Optional progress callback
 * @returns Array of upload results
 */
export async function uploadMultipleDocuments(
  uploads: DocumentUpload[],
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const totalFiles = uploads.length;

  for (let i = 0; i < uploads.length; i++) {
    const { file, userId, documentType } = uploads[i];
    const result = await uploadDocument(file, userId, documentType, (fileProgress) => {
      if (onProgress) {
        const overallProgress = ((i / totalFiles) * 100) + (fileProgress / totalFiles);
        onProgress(Math.round(overallProgress));
      }
    });
    results.push(result);
  }

  return results;
}

/**
 * Save document metadata to database
 * @param userId - User ID
 * @param documentType - Type of document
 * @param fileUrl - Public URL of the uploaded file
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @param mimeType - MIME type of the file
 * @returns Success status
 */
export async function saveDocumentMetadata(
  userId: string,
  documentType: 'id' | 'license' | 'vehicle_registration',
  fileUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        verification_status: 'pending',
      });

    if (error) {
      logger.error('Database error', { error: error.message, component: 'saveDocumentMetadata' });
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Database error', { error: errorMessage, component: 'saveDocumentMetadata' });
    return false;
  }
}

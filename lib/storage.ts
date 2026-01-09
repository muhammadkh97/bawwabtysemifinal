import { supabase } from './supabase';

// دالة مساعدة لاستخراج رسائل الأخطاء
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

// ============================================
// Storage Helper Functions
// وظائف مساعدة للتخزين والصور
// ============================================

export type BucketName = 'products' | 'profiles' | 'documents' | 'chat-attachments' | 'product-images' | 'avatars';

// واجهة لبيانات ملف في التخزين
export interface StorageFileMetadata {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Validate image file
 * التحقق من صحة ملف الصورة
 */
export function validateImage(file: File, maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, GIF, WEBP)',
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`,
    };
  }

  return { valid: true };
}

export interface UploadOptions {
  bucket: BucketName;
  folder?: string;
  filename?: string;
  public?: boolean;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  fullPath?: string;
  error?: string;
}

/**
 * Upload a single file to Supabase Storage
 * رفع ملف واحد إلى Supabase
 */
export async function uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
  const { bucket, folder, filename } = options;

  try {
    // Validate file size based on bucket
    const maxSizes: Record<BucketName, number> = {
      products: 5 * 1024 * 1024, // 5MB
      'product-images': 5 * 1024 * 1024, // 5MB
      profiles: 2 * 1024 * 1024, // 2MB
      avatars: 2 * 1024 * 1024, // 2MB
      documents: 10 * 1024 * 1024, // 10MB
      'chat-attachments': 5 * 1024 * 1024, // 5MB
    };

    if (file.size > maxSizes[bucket]) {
      throw new Error(`File size exceeds ${maxSizes[bucket] / 1024 / 1024}MB limit for ${bucket}`);
    }

    // Validate MIME type
    const allowedTypes: Record<BucketName, string[]> = {
      products: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      'product-images': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      profiles: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      avatars: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      documents: ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf', 'application/pdf'],
      'chat-attachments': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    };

    if (!allowedTypes[bucket].includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed for ${bucket}`);
    }

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const ext = file.name.split('.').pop();
    const finalFilename = filename || `${timestamp}_${randomStr}.${ext}`;
    
    // Build file path
    const filePath = folder ? `${folder}/${finalFilename}` : finalFilename;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const publicUrl = getPublicUrl(bucket, data.path);

    return {
      success: true,
      path: data.path,
      url: publicUrl,
      fullPath: filePath,
    };
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(files: File[], options: UploadOptions) {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  const results = await Promise.all(uploadPromises);
  
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    successful,
    failed,
    totalUploaded: successful.length,
    totalFailed: failed.length,
  };
}

// ============================================
// Get/Download Functions
// ============================================

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for private files (expires after given time)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Download a file
 */
export async function downloadFile(bucket: string, path: string): Promise<{ success: boolean; data?: Blob; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============================================
// Delete Functions
// ============================================

/**
 * Delete a single file
 */
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(bucket: string, paths: string[]): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) throw error;

    return { success: true, deletedCount: paths.length };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============================================
// List Functions
// ============================================

/**
 * List files in a folder
 */
export async function listFiles(bucket: string, folder?: string): Promise<{ success: boolean; files?: StorageFileMetadata[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    return {
      success: true,
      files: data as StorageFileMetadata[],
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// ============================================
// Image Transformation
// تحجيم وتحويل الصور لتسريع الموقع
// ============================================

/**
 * Get transformed image URL with specific dimensions and quality
 * الحصول على صورة محولة بمقاسات وجودة محددة
 */
export function getTransformedImageUrl(
  bucket: string,
  path: string,
  options?: ImageTransformOptions
): string {
  const baseUrl = getPublicUrl(bucket, path);
  
  if (!options) return baseUrl;

  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Predefined image sizes for common use cases
 * أحجام صور معرفة مسبقاً للاستخدامات الشائعة
 */
export const IMAGE_SIZES = {
  // Product images
  PRODUCT_THUMBNAIL: { width: 300, height: 300, quality: 85 },
  PRODUCT_CARD: { width: 400, height: 400, quality: 85 },
  PRODUCT_DETAIL: { width: 800, height: 800, quality: 90 },
  PRODUCT_ZOOM: { width: 1200, height: 1200, quality: 95 },
  
  // Profile images
  PROFILE_AVATAR: { width: 150, height: 150, quality: 85 },
  PROFILE_AVATAR_LARGE: { width: 300, height: 300, quality: 90 },
  
  // Mobile optimized
  MOBILE_PRODUCT: { width: 400, quality: 75 },
  MOBILE_BANNER: { width: 768, quality: 80 },
  
  // Chat attachments
  CHAT_IMAGE_THUMBNAIL: { width: 200, height: 200, quality: 80 },
  CHAT_IMAGE_PREVIEW: { width: 600, quality: 85 },
};

/**
 * Get optimized product image URL
 * الحصول على رابط صورة منتج محسّن
 */
export function getProductImageUrl(
  path: string,
  size: keyof typeof IMAGE_SIZES = 'PRODUCT_CARD'
): string {
  return getTransformedImageUrl('products', path, IMAGE_SIZES[size]);
}

/**
 * Get optimized profile image URL
 * الحصول على رابط صورة بروفايل محسّن
 */
export function getProfileImageUrl(
  path: string,
  large: boolean = false
): string {
  const size = large ? IMAGE_SIZES.PROFILE_AVATAR_LARGE : IMAGE_SIZES.PROFILE_AVATAR;
  return getTransformedImageUrl('profiles', path, size);
}

/**
 * Upload product images with vendor ID organization
 * رفع صور المنتجات مع تنظيم حسب ID البائع
 */
export async function uploadProductImages(
  vendorId: string,
  productId: string,
  files: File[]
): Promise<{ successful: string[]; failed: string[] }> {
  const uploadPromises = files.map(async (file, index) => {
    return uploadFile(file, {
      bucket: 'products',
      folder: vendorId,
      filename: `${productId}_${index + 1}.${file.name.split('.').pop()}`,
    });
  });

  const results = await Promise.all(uploadPromises);
  
  const successful = results.filter((r) => r.success && r.url).map(r => r.url as string);
  const failed = results.filter((r) => !r.success).map(r => r.error || 'Unknown error');

  return {
    successful,
    failed,
  };
}

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload as UploadIcon, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, validateImage } from '@/lib/storage';
import { logger } from '@/lib/logger';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  label?: string;
  maxSize?: number; // MB
  aspectRatio?: string;
  accept?: string;
  bucket?: 'products' | 'profiles' | 'documents' | 'product-images' | 'avatars';
  folder?: string;
}

export default function ImageUpload({
  onImageUploaded,
  currentImage,
  label = 'رفع صورة',
  maxSize = 5,
  aspectRatio = 'aspect-square',
  accept = 'image/jpeg,image/png,image/jpg,image/webp',
  bucket = 'product-images',
  folder = 'uploads',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const processAndUploadFile = async (file: File) => {
    setError('');
    setUploadSuccess(false);

    // 1. Validation
    const validation = validateImage(file, maxSize * 1024 * 1024);
    if (!validation.valid) {
      setError(validation.error || 'ملف غير صالح');
      return;
    }

    // 2. Preview (Immediate feedback)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);

    // 3. Actual Upload to Supabase
    setUploading(true);
    try {
      const result = await uploadFile(file, {
        bucket,
        folder,
        public: true
      });

      if (result.success && result.url) {
        setUploadSuccess(true);
        onImageUploaded(result.url);
      } else {
        setError(result.error || 'فشل الرفع إلى الخادم');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'حدث خطأ غير متوقع أثناء الرفع'
      
      logger.error('processAndUploadFile failed', {
        error: errorMessage,
        component: 'ImageUpload',
        bucket,
        folder,
      })
      setError('حدث خطأ غير متوقع أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processAndUploadFile(file);
  };

  const removeImage = () => {
    setPreview('');
    setFileName('');
    setError('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`
            relative border-2 border-dashed rounded-xl p-8
            cursor-pointer transition-all duration-300
            ${isDragging 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <UploadIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-slate-700 font-bold">انقر أو اسحب الملف هنا</p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP حتى {maxSize} ميجابايت
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className={`${aspectRatio} relative rounded-xl overflow-hidden border-2 border-slate-200 shadow-md`}>
            {preview.startsWith('data:image') || preview.startsWith('http') ? (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">{fileName}</p>
                </div>
              </div>
            )}
            
            {/* Loading Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <p className="font-bold">جاري الرفع...</p>
              </div>
            )}

            {/* Actions Overlay */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 font-bold"
                >
                  <UploadIcon className="w-4 h-4" />
                  تغيير
                </button>
                <button
                  onClick={removeImage}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-bold"
                >
                  <X className="w-4 h-4" />
                  حذف
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-green-50 border-r-4 border-green-500 p-3 rounded-lg flex items-center gap-2 text-green-700 text-sm font-bold animate-in fade-in slide-in-from-right-4">
          <Check className="w-5 h-5" />
          تم الرفع بنجاح!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-r-4 border-red-500 p-3 rounded-lg flex items-center gap-2 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-right-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}

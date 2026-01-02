'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

interface MultiImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
  maxSize?: number; // MB
  currentImages?: string[];
}

export default function MultiImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSize = 5,
  currentImages = []
}: MultiImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'يجب اختيار صورة فقط';
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `حجم الصورة يجب أن يكون أقل من ${maxSize} ميجابايت`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const error = validateFile(file);
      const id = Math.random().toString(36).substr(2, 9);

      if (error) {
        setImages((prev) => [...prev, { id, file, preview: '', error }]);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImages((prev) => {
          const newImages = [...prev, { id, file, preview, uploaded: true }];
          onImagesChange(newImages.map((img) => img.file));
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const newImages = prev.filter((img) => img.id !== id);
      onImagesChange(newImages.map((img) => img.file));
      return newImages;
    });
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      onImagesChange(newImages.map((img) => img.file));
      return newImages;
    });
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          صور المنتج ({images.length}/{maxImages})
        </label>
        {images.length > 0 && (
          <p className="text-xs text-slate-500">اسحب الصور لإعادة الترتيب</p>
        )}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const fromIndex = parseInt(e.dataTransfer.getData('index'));
              reorderImages(fromIndex, index);
            }}
            className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-purple-400 transition-all cursor-move"
          >
            {image.error ? (
              <div className="w-full h-full bg-red-50 flex items-center justify-center p-2">
                <p className="text-xs text-red-600 text-center">{image.error}</p>
              </div>
            ) : (
              <>
                <Image
                  src={image.preview}
                  alt={`Product ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Badge for first image */}
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                    رئيسية
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 left-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-lg"
                  title="حذف"
                >
                  ×
                </button>

                {/* Upload status */}
                {image.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {image.uploaded && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    ✓
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Add More Button */}
        {canAddMore && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              aspect-square border-2 border-dashed rounded-xl
              flex flex-col items-center justify-center gap-2
              cursor-pointer transition-all duration-300
              ${isDragging 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
              }
            `}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 font-medium">إضافة صورة</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Info */}
      <div className="bg-blue-50 border-r-4 border-blue-500 p-3 rounded-lg">
        <p className="text-sm text-blue-700 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            الصورة الأولى ستكون الصورة الرئيسية للمنتج. يمكنك سحب الصور لإعادة ترتيبها.
            <br />
            الحد الأقصى: {maxImages} صور، حجم كل صورة حتى {maxSize} ميجابايت.
          </span>
        </p>
      </div>
    </div>
  );
}


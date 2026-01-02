'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BulkUploadProps {
  vendorId: string;
  onSuccess: () => void;
  onClose: () => void;
}

interface ProductRow {
  name: string;
  description: string;
  price: number;
  old_price?: number;
  stock: number;
  category: string;
  sku?: string;
}

export default function BulkUploadModal({ vendorId, onSuccess, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        setFile(selectedFile);
        setShowResults(false);
      } else {
        alert('يرجى اختيار ملف CSV أو Excel فقط');
      }
    }
  };

  const parseCSV = (text: string): ProductRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products: ProductRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const product: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (header.includes('name') || header.includes('اسم')) {
          product.name = value;
        } else if (header.includes('description') || header.includes('وصف')) {
          product.description = value;
        } else if (header.includes('price') || header.includes('سعر')) {
          product.price = parseFloat(value) || 0;
        } else if (header.includes('old') || header.includes('قديم')) {
          product.old_price = parseFloat(value) || null;
        } else if (header.includes('stock') || header.includes('مخزون')) {
          product.stock = parseInt(value) || 0;
        } else if (header.includes('category') || header.includes('فئة')) {
          product.category = value;
        } else if (header.includes('sku')) {
          product.sku = value;
        }
      });

      if (product.name && product.price) {
        products.push(product as ProductRow);
      }
    }

    return products;
  };

  const parseExcel = async (file: File): Promise<ProductRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          const products: ProductRow[] = jsonData.map((row: any) => ({
            name: row['Name'] || row['name'] || row['اسم'] || row['اسم المنتج'] || '',
            description: row['Description'] || row['description'] || row['وصف'] || row['الوصف'] || '',
            price: parseFloat(row['Price'] || row['price'] || row['سعر'] || row['السعر'] || 0),
            old_price: parseFloat(row['Old Price'] || row['old_price'] || row['السعر القديم']) || undefined,
            stock: parseInt(row['Stock'] || row['stock'] || row['مخزون'] || row['المخزون'] || 0),
            category: row['Category'] || row['category'] || row['فئة'] || row['الفئة'] || '',
            sku: row['SKU'] || row['sku'] || undefined,
          })).filter(p => p.name && p.price > 0);

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !vendorId) return;

    setUploading(true);
    setProgress(0);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      let products: ProductRow[] = [];

      // Parse file
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        products = parseCSV(text);
      } else {
        products = await parseExcel(file);
      }

      if (products.length === 0) {
        throw new Error('لم يتم العثور على منتجات صالحة في الملف');
      }

      // Upload products to Supabase
      const totalProducts = products.length;
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        try {
          const { error } = await supabase
            .from('products')
            .insert({
              vendor_id: vendorId,
              name: product.name,
              description: product.description,
              price: product.price,
              old_price: product.old_price || null,
              stock: product.stock,
              sku: product.sku || `SKU-${Date.now()}-${i}`,
              status: 'approved', // Auto-approve for trusted vendors
              images: [],
              featured_image: null,
            });

          if (error) {
            failedCount++;
            errors.push(`${product.name}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          failedCount++;
          errors.push(`${product.name}: ${err.message}`);
        }

        setProgress(Math.round(((i + 1) / totalProducts) * 100));
      }

      setResults({ success: successCount, failed: failedCount, errors });
      setShowResults(true);

      if (successCount > 0) {
        toast.success(`✅ تم رفع ${successCount} منتج بنجاح!`);
        onSuccess();
      }
      
      if (failedCount > 0) {
        toast.error(`⚠️ فشل رفع ${failedCount} منتج`);
      }
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Name,Description,Price,Old Price,Stock,Category,SKU\n' +
      'مثال منتج,وصف المنتج,100,120,50,الإلكترونيات,SKU001\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 10, 30, 0.95)',
          border: '1px solid rgba(98, 54, 255, 0.3)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">الرفع الجماعي للمنتجات</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showResults ? (
            <>
              {/* Instructions */}
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(98, 54, 255, 0.1)' }}>
                <h3 className="text-white font-bold mb-2">📋 التعليمات:</h3>
                <ul className="text-purple-300 text-sm space-y-1 list-disc list-inside">
                  <li>قم برفع ملف CSV أو Excel (.xlsx, .xls)</li>
                  <li>يجب أن يحتوي الملف على: Name, Description, Price, Stock, Category</li>
                  <li>يمكنك إضافة: Old Price, SKU (اختياري)</li>
                  <li>الأعمدة يمكن أن تكون بالعربية أو الإنجليزية</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  📥 تحميل قالب Excel
                </button>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/60 transition mb-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-green-400" />
                    <div className="text-right">
                      <p className="text-white font-bold">{file.name}</p>
                      <p className="text-sm text-purple-300">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-3 text-purple-400" />
                    <p className="text-white font-bold mb-1">انقر أو اسحب الملف هنا</p>
                    <p className="text-sm text-purple-300">CSV, XLSX, XLS</p>
                  </>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 text-sm">جاري الرفع...</span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #6236FF, #FF219D)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1 px-6 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>رفع المنتجات</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                >
                  إلغاء
                </button>
              </div>
            </>
          ) : (
            /* Results */
            <div>
              <div className="text-center mb-6">
                {results.success > 0 ? (
                  <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-20 h-20 mx-auto mb-4 text-red-400" />
                )}
                <h3 className="text-2xl font-bold text-white mb-2">انتهى الرفع!</h3>
                <div className="flex justify-center gap-6 text-lg">
                  <div>
                    <span className="text-green-400 font-bold">{results.success}</span>
                    <span className="text-purple-300"> ناجح</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">{results.failed}</span>
                    <span className="text-purple-300"> فشل</span>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mb-6 p-4 rounded-lg max-h-60 overflow-y-auto" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <h4 className="text-red-400 font-bold mb-2">الأخطاء:</h4>
                  <ul className="text-sm text-red-300 space-y-1">
                    {results.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  setShowResults(false);
                  setFile(null);
                  onClose();
                }}
                className="w-full px-6 py-3 rounded-xl text-white font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

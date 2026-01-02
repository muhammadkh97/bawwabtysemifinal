'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // تم تعطيل صفحة Demo - التوجيه للصفحة الرئيسية
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="inline-block mb-6">
          <span className="text-8xl">⚠️</span>
        </div>
        <h1 className="text-5xl font-bold mb-4">
          تم تعطيل صفحة التجريب
        </h1>
        <p className="text-xl text-purple-200 mb-8">
          جاري التوجيه للصفحة الرئيسية...
        </p>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto"></div>
      </div>
    </div>
  );
}
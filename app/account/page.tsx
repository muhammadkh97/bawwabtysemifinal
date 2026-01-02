'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    // إعادة توجيه إلى صفحة الملف الشخصي
    router.push('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}


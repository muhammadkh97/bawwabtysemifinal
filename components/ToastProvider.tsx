'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'rgba(15, 10, 30, 0.95)',
          color: '#fff',
          border: '1px solid rgba(98, 54, 255, 0.3)',
          borderRadius: '16px',
          padding: '16px 24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 40px rgba(98, 54, 255, 0.3)',
          fontSize: '16px',
          fontWeight: '600',
        },
        // Success
        success: {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#10B981',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        // Error
        error: {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#EF4444',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
        // Loading
        loading: {
          style: {
            background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2) 0%, rgba(182, 33, 254, 0.2) 100%)',
            border: '1px solid rgba(98, 54, 255, 0.5)',
            color: '#A78BFA',
          },
          iconTheme: {
            primary: '#A78BFA',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

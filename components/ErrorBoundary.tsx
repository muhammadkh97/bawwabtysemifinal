'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: '#0A0515' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full text-center"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-8"
            >
              <div
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-white mb-4">
                عذراً، حدث خطأ!
              </h1>
              <p className="text-xl text-purple-300 mb-8">
                نواجه مشكلة تقنية مؤقتة. نعمل على حلها الآن.
              </p>

              {/* Error Details (Dev Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div
                  className="mb-8 p-4 rounded-xl text-right overflow-auto max-h-48"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <p className="text-sm text-red-400 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleReset}
                  className="px-8 py-4 rounded-2xl font-bold text-white flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 100%)',
                    boxShadow: '0 10px 30px rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                  إعادة المحاولة
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleGoHome}
                  className="px-8 py-4 rounded-2xl font-bold text-purple-300 flex items-center gap-2"
                  style={{
                    background: 'rgba(98, 54, 255, 0.1)',
                    border: '2px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <Home className="w-5 h-5" />
                  العودة للرئيسية
                </motion.button>
              </div>
            </motion.div>

            {/* Footer Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-sm text-purple-400"
            >
              إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
            </motion.p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

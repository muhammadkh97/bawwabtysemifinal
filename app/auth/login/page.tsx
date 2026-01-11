'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { signIn, getCurrentUser, signInWithGoogle, signInWithFacebook, signInWithApple } from '@/lib/auth';
import { logger } from '@/lib/logger';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  // التحقق من تسجيل الدخول عند تحميل الصفحة
  useEffect(() => {
    checkAuth();
    // Load remember me from localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        // المستخدم مسجل دخول بالفعل، توجيهه حسب دوره
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          redirectUserByRole((user as any).role || 'customer');
        }
      }
    } catch (error) {
      // User not logged in, stay on login page
      logger.info('User not authenticated');
    }
  };

  const redirectUserByRole = (role: string) => {
    const redirectPath = searchParams.get('redirect');
    
    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    switch (role) {
      case 'admin':
        router.push('/dashboard/admin');
        break;
      case 'vendor':
        router.push('/dashboard/vendor');
        break;
      case 'restaurant':
        router.push('/dashboard/restaurant');
        break;
      case 'driver':
        router.push('/dashboard/driver');
        break;
      default:
        router.push('/');
    }
  };

  // Real-time email validation
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('البريد الإلكتروني مطلوب');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Real-time password validation
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('كلمة المرور مطلوبة');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      validatePassword(value);
    }
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    validateEmail(email);
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    validatePassword(password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    setTouched({ email: true, password: true });
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // تسجيل الدخول
      const { user, error: signInError } = await signIn(email, password);

      if (signInError) {
        logger.error('❌ خطأ في تسجيل الدخول:', { error: signInError });
        
        // رسائل خطأ واضحة ومحددة
        const errorMessage = typeof signInError === 'string' ? signInError : (signInError as any)?.message || 'حدث خطأ أثناء تسجيل الدخول';
        
        if (errorMessage.includes('Invalid login credentials')) {
          setError('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('⚠️ يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.');
        } else if (errorMessage.includes('User not found')) {
          setError('❌ لا يوجد حساب بهذا البريد الإلكتروني. يرجى التسجيل أولاً.');
        } else if (errorMessage.includes('Too many requests')) {
          setError('⏰ عدد كبير من المحاولات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.');
        } else {
          setError(`❌ ${errorMessage}`);
        }
        
        setLoading(false);
        return;
      }

      if (!user) {
        logger.error('❌ لم يتم إرجاع بيانات المستخدم');
        setError('❌ فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // رسالة نجاح
      setSuccess('✅ تم تسجيل الدخول بنجاح! جاري التوجيه...');
      
      logger.info('✅ تسجيل الدخول ناجح، التوجيه حسب الدور:', (user as any).role);
      
      // انتظار قليلاً للتأكد من حفظ الجلسة في الـ cookies قبل التوجيه
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // التوجيه حسب الدور
      const userRole = (user as any).role || 'customer';
      const redirectPath = searchParams.get('redirect');
      
      if (redirectPath) {
        logger.info('🔄 التوجيه إلى:', redirectPath);
        // استخدام window.location للتأكد من إعادة تحميل الصفحة وتحديث الجلسة
        window.location.href = redirectPath;
      } else {
        logger.info('🔄 التوجيه حسب الدور:', userRole);
        // استخدام window.location للتأكد من إعادة تحميل الصفحة
        switch (userRole) {
          case 'admin':
            window.location.href = '/dashboard/admin';
            break;
          case 'vendor':
            window.location.href = '/dashboard/vendor';
            break;
          case 'restaurant':
            window.location.href = '/dashboard/restaurant';
            break;
          case 'driver':
            window.location.href = '/dashboard/driver';
            break;
          default:
            window.location.href = '/';
        }
      }

    } catch (err: any) {
      logger.error('❌ خطأ غير متوقع:', err);
      setError('❌ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.');
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let result;
      switch (provider) {
        case 'google':
          result = await signInWithGoogle();
          break;
        case 'facebook':
          result = await signInWithFacebook();
          break;
        case 'apple':
          result = await signInWithApple();
          break;
      }

      if (result.error) {
        // رسائل خطأ محددة لكل منصة
        if (provider === 'google') {
          setError('❌ فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
        } else if (provider === 'facebook') {
          setError('❌ فشل تسجيل الدخول عبر Facebook. يرجى المحاولة مرة أخرى.');
        } else if (provider === 'apple') {
          setError('❌ فشل تسجيل الدخول عبر Apple. يرجى المحاولة مرة أخرى.');
        }
      } else {
        setSuccess(`✅ تم تسجيل الدخول عبر ${provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'Apple'} بنجاح!`);
      }
    } catch (err: any) {
      logger.error('خطأ في تسجيل الدخول:', err);
      setError('❌ حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0515 0%, #1a0b2e 50%, #2d1b4e 100%)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #6236FF 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF219D 0%, transparent 70%)' }}
        />
      </div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <LogIn className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">مرحباً بعودتك</h1>
            <p className="text-gray-300">سجل دخولك للمتابعة</p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-200 text-sm flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`w-full pr-12 pl-4 py-3 rounded-xl bg-white/10 border ${
                    emailError && touched.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-white/20 focus:ring-purple-500'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              {emailError && touched.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-300 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={`w-full pr-12 pl-12 py-3 rounded-xl bg-white/10 border ${
                    passwordError && touched.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-white/20 focus:ring-purple-500'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && touched.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-300 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </motion.p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  تذكرني
                </span>
              </label>
              
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !!emailError || !!passwordError}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-purple-300 bg-[#1a0b2e]">
                أو سجل دخولك باستخدام
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google Button */}
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 px-4 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="group-hover:text-white transition-colors flex-1 text-center">Google</span>
                </>
              )}
            </motion.button>

            {/* Facebook Button */}
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 px-4 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
              style={{
                background: 'rgba(24, 119, 242, 0.1)',
                border: '1px solid rgba(24, 119, 242, 0.3)',
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="group-hover:text-white transition-colors flex-1 text-center">Facebook</span>
                </>
              )}
            </motion.button>

            {/* Apple Button */}
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 px-4 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="group-hover:text-white transition-colors flex-1 text-center">Apple</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              ليس لديك حساب؟{' '}
              <Link
                href="/auth/register"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                سجل الآن
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

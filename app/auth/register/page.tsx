'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Store, Truck, ShieldCheck, ArrowRight, CheckCircle2, 
  Mail, Lock, Eye, EyeOff, Upload, FileText, Car, CreditCard, ChefHat, Gift,
  Check, X, HelpCircle, ChevronDown, ChevronUp, Zap, TrendingUp, Users, Package
} from 'lucide-react';
import { signUp, signInWithGoogle, signInWithFacebook, signInWithApple } from '@/lib/auth';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import { logger } from '@/lib/logger';

// Account comparison data
const accountComparison = {
  customer: {
    features: [
      { name: 'تسوق من آلاف المنتجات', included: true },
      { name: 'نقاط ولاء ومكافآت', included: true },
      { name: 'طلب من مطاعم متعددة', included: true },
      { name: 'تتبع الطلبات مباشرة', included: true },
      { name: 'كوبونات وخصومات', included: true },
      { name: 'بيع المنتجات', included: false },
      { name: 'لوحة تحكم البائع', included: false },
      { name: 'عمولة على المبيعات', included: false },
    ],
    benefits: [
      'تجربة تسوق سهلة وسريعة',
      'عروض حصرية للعملاء',
      'دعم فني 24/7',
      'إرجاع مجاني للمنتجات'
    ],
    requirements: ['بريد إلكتروني فقط', 'لا يتطلب موافقة']
  },
  vendor: {
    features: [
      { name: 'تسوق من المنصة', included: true },
      { name: 'نقاط ولاء', included: true },
      { name: 'بيع منتجات غير محدودة', included: true },
      { name: 'لوحة تحكم متقدمة', included: true },
      { name: 'إدارة المخزون', included: true },
      { name: 'تقارير مبيعات مفصلة', included: true },
      { name: 'دعم تقني مخصص', included: true },
      { name: 'عمولة 10% فقط', included: true },
    ],
    benefits: [
      'وصول لآلاف العملاء',
      'أدوات تسويق مجانية',
      'سحب أرباح أسبوعي',
      'تدريب مجاني للبائعين'
    ],
    requirements: ['وثائق رسمية', 'موافقة خلال 24 ساعة']
  },
  restaurant: {
    features: [
      { name: 'تسوق من المنصة', included: true },
      { name: 'نقاط ولاء', included: true },
      { name: 'قائمة طعام كاملة', included: true },
      { name: 'إدارة الطلبات لحظياً', included: true },
      { name: 'تقييمات العملاء', included: true },
      { name: 'عروض وكوبونات', included: true },
      { name: 'توصيل سريع', included: true },
      { name: 'عمولة 12% فقط', included: true },
    ],
    benefits: [
      'زيادة المبيعات 3× أضعاف',
      'توصيل مجاني للمطعم',
      'دعم فني مخصص',
      'ترويج مجاني'
    ],
    requirements: ['ترخيص مطعم', 'موافقة خلال 48 ساعة']
  },
  driver: {
    features: [
      { name: 'تسوق من المنصة', included: true },
      { name: 'نقاط ولاء', included: true },
      { name: 'ربح مجزي', included: true },
      { name: 'مرونة في العمل', included: true },
      { name: 'مكافآت أداء', included: true },
      { name: 'تأمين شامل', included: true },
      { name: 'بونص يومي', included: true },
      { name: 'لا رسوم تسجيل', included: true },
    ],
    benefits: [
      'ربح حتى 1500 دينار شهرياً',
      'اختر أوقات عملك',
      'بونص على كل توصيلة',
      'وقود مدعوم'
    ],
    requirements: ['رخصة قيادة', 'مركبة', 'موافقة خلال 24 ساعة']
  }
};

// FAQ data
const faqData = [
  {
    question: 'ما الفرق بين حساب البائع وحساب المطعم؟',
    answer: 'حساب البائع للمنتجات العامة (ملابس، إلكترونيات، الخ) بعمولة 10%، بينما حساب المطعم مخصص للطعام والمشروبات بعمولة 12% مع ميزات خاصة بإدارة الطلبات والوجبات.'
  },
  {
    question: 'كم يستغرق الحصول على الموافقة؟',
    answer: 'العملاء: فوري بدون موافقة. البائعين والمناديب: 24 ساعة. المطاعم: 48 ساعة. نرسل إشعار فوري عند الموافقة.'
  },
  {
    question: 'هل يمكنني التبديل بين أنواع الحسابات؟',
    answer: 'نعم! يمكنك امتلاك أكثر من نوع حساب. مثلاً: يمكن أن تكون مشتري وبائع في نفس الوقت.'
  },
  {
    question: 'ما هي عمولة المنصة؟',
    answer: 'البائعين: 10% فقط. المطاعم: 12% فقط. المناديب: لا عمولة - ربح مباشر + بونصات. العملاء: لا رسوم.'
  },
  {
    question: 'هل التسجيل مجاني؟',
    answer: 'نعم! التسجيل مجاني 100% لجميع أنواع الحسابات بدون أي رسوم خفية.'
  },
  {
    question: 'كيف أستلم أرباحي كبائع/مطعم؟',
    answer: 'يمكنك سحب أرباحك أسبوعياً عبر تحويل بنكي مباشر أو محفظة إلكترونية خلال 24 ساعة.'
  }
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'customer' | 'vendor' | 'restaurant' | 'driver' | null>(null);
  
  // Referral Code
  const [referralCode, setReferralCode] = useState(searchParams?.get('ref') || '');
  
  // Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Vendor Info
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  
  // Driver Info
  const [vehicleType, setVehicleType] = useState('سيارة');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [driverIdDocumentUrl, setDriverIdDocumentUrl] = useState('');
  const [driverIdDocumentFile, setDriverIdDocumentFile] = useState<File | null>(null);
  const [licenseImageUrl, setLicenseImageUrl] = useState('');
  const [licenseImageFile, setLicenseImageFile] = useState<File | null>(null);
  const [vehicleRegistrationUrl, setVehicleRegistrationUrl] = useState('');
  const [vehicleRegistrationFile, setVehicleRegistrationFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // UI States for comparison and FAQ
  const [showComparison, setShowComparison] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Handle file uploads
  const handleFileUpload = async (file: File, type: string, userId: string): Promise<string> => {
    try {
      const { uploadDocument } = await import('@/lib/upload');
      
      const result = await uploadDocument(
        file, 
        userId, 
        type as 'id' | 'license' | 'vehicle_registration',
        (progress) => setUploadProgress(progress)
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.url;
    } catch (error) {
      logger.error('Error uploading file', { error });
      throw new Error('فشل رفع الملف');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setError('');
    
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
        setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      logger.error('خطأ في التسجيل', { error: err });
      setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Validation for specific roles
    if (userType === 'vendor' || userType === 'restaurant') {
      if (!shopName) {
        setError('يرجى إدخال اسم المتجر');
        return;
      }
      if (!idDocumentFile && !idDocumentUrl) {
        setError('يرجى رفع صورة الهوية');
        return;
      }
    }
    
    if (userType === 'driver') {
      if (!vehicleNumber) {
        setError('يرجى إدخال رقم المركبة');
        return;
      }
      if (!driverIdDocumentFile && !driverIdDocumentUrl) {
        setError('يرجى رفع صورة الهوية');
        return;
      }
      if (!licenseImageFile && !licenseImageUrl) {
        setError('يرجى رفع صورة رخصة القيادة');
        return;
      }
      if (!vehicleRegistrationFile && !vehicleRegistrationUrl) {
        setError('يرجى رفع صورة رخصة المركبة');
        return;
      }
    }
    
    setLoading(true);
    setError('');

    try {
      // Upload files if provided
      // Upload files before registration
      let uploadedIdUrl = idDocumentUrl;
      let uploadedDriverIdUrl = driverIdDocumentUrl;
      let uploadedLicenseUrl = licenseImageUrl;
      let uploadedVehicleRegUrl = vehicleRegistrationUrl;
      
      // Generate temporary user ID for file upload (will be replaced with actual user ID after registration)
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      if ((userType === 'vendor' || userType === 'restaurant') && idDocumentFile) {
        setUploadProgress(10);
        uploadedIdUrl = await handleFileUpload(idDocumentFile, 'id', tempUserId);
      }
      
      if (userType === 'driver') {
        if (driverIdDocumentFile) {
          setUploadProgress(20);
          uploadedDriverIdUrl = await handleFileUpload(driverIdDocumentFile, 'id', tempUserId);
        }
        if (licenseImageFile) {
          setUploadProgress(40);
          uploadedLicenseUrl = await handleFileUpload(licenseImageFile, 'license', tempUserId);
        }
        if (vehicleRegistrationFile) {
          setUploadProgress(60);
          uploadedVehicleRegUrl = await handleFileUpload(vehicleRegistrationFile, 'vehicle_registration', tempUserId);
        }
      }
      
      setUploadProgress(80);

      const metadata: any = {
        name,
        phone,
        role: userType,
      };

      if (userType === 'vendor' || userType === 'restaurant') {
        metadata.shop_name = shopName;
        metadata.shop_description = shopDescription;
        metadata.id_document_url = uploadedIdUrl;
        metadata.verification_status = 'pending'; // يتطلب موافقة الأدمن
      } else if (userType === 'driver') {
        metadata.vehicle_type = vehicleType;
        metadata.vehicle_number = vehicleNumber;
        metadata.license_number = licenseNumber;
        metadata.id_document_url = uploadedDriverIdUrl;
        metadata.license_image_url = uploadedLicenseUrl;
        metadata.vehicle_registration_url = uploadedVehicleRegUrl;
        metadata.verification_status = 'pending'; // يتطلب موافقة الأدمن
      }

      setUploadProgress(90);
      const { error: signUpError } = await signUp(email, password, metadata);

      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }
      
      // معالجة كود الإحالة إذا كان موجوداً
      if (referralCode && referralCode.trim()) {
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // البحث عن المستخدم الذي يملك هذا الكود
          const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', referralCode.toUpperCase())
            .single();
          
          if (referrer) {
            // الحصول على ID المستخدم الجديد
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              // إنشاء سجل إحالة
              await supabase
                .from('referrals')
                .insert({
                  referrer_id: referrer.id,
                  referred_id: newUser.id,
                  status: 'pending',
                  reward_points: 100
                });
              
              // إضافة نقاط للمستخدم الجديد
              await supabase
                .from('users')
                .update({ loyalty_points: 100 })
                .eq('id', newUser.id);
            }
          }
        } catch (refError) {
          logger.error('خطأ في معالجة كود الإحالة', { error: refError });
          // لا نوقف عملية التسجيل
        }
      }
      
      setUploadProgress(100);
      alert('تم إنشاء حسابك بنجاح! سيتم مراجعة وثائقك من قبل الإدارة.');
      router.push('/auth/login');
    } catch (error: any) {
      setError(error?.message || 'حدث خطأ في التسجيل');
      setLoading(false);
    }
  };

  const userTypeOptions = [
    {
      type: 'customer' as const,
      value: 'customer' as const,
      label: 'عميل',
      icon: User,
      title: 'مشتري',
      subtitle: 'للتسوق اليومي',
      description: 'تسوق من آلاف المنتجات والمطاعم',
      color: 'from-blue-500 to-cyan-500',
      badge: 'الأكثر شيوعاً',
      stats: '50K+ عميل نشط'
    },
    {
      type: 'vendor' as const,
      value: 'vendor' as const,
      label: 'بائع',
      icon: Store,
      title: 'بائع',
      subtitle: 'لأصحاب المتاجر',
      description: 'ابدأ متجرك وابنِ علامتك التجارية',
      color: 'from-purple-500 to-pink-500',
      badge: 'عمولة 10%',
      stats: '2K+ بائع | 5K دينار متوسط'
    },
    {
      type: 'restaurant' as const,
      value: 'restaurant' as const,
      label: 'مطعم',
      icon: ChefHat,
      title: 'مطعم',
      subtitle: 'لأصحاب المطاعم',
      description: 'قدم وجباتك لآلاف العملاء',
      color: 'from-orange-500 to-red-500',
      badge: 'عمولة 12%',
      stats: '500+ مطعم | 100K+ طلب'
    },
    {
      type: 'driver' as const,
      value: 'driver' as const,
      label: 'سائق',
      icon: Truck,
      title: 'مندوب',
      subtitle: 'للتوصيل',
      description: 'اربح حتى 1500 دينار شهرياً',
      color: 'from-green-500 to-emerald-500',
      badge: 'دخل مرتفع',
      stats: '1K+ سائق | 1200 دينار متوسط'
    },
  ];

  const totalSteps = userType === 'customer' ? 2 : 3;

  // Step Progress Component
  const StepProgress = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s < step
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : s === step
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </motion.div>
              <span className="text-xs mt-2 text-gray-300">
                {s === 1 && 'نوع الحساب'}
                {s === 2 && 'معلوماتك'}
                {s === 3 && 'وثائق'}
              </span>
            </div>
            {s < totalSteps && (
              <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                s < step ? 'bg-green-500' : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <p className="text-gray-300 text-sm">
          الخطوة {step} من {totalSteps}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4" style={{ background: 'linear-gradient(135deg, #0A0515 0%, #1a0b2e 50%, #2d1b4e 100%)' }}>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div
          className="rounded-3xl p-8 md:p-10 shadow-2xl"
          style={{
            background: 'rgba(15, 10, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(98, 54, 255, 0.3)',
            boxShadow: '0 0 60px rgba(98, 54, 255, 0.3), 0 0 100px rgba(255, 33, 157, 0.2)',
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6236FF] via-[#B621FE] to-[#FF219D] flex items-center justify-center mx-auto shadow-lg">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#6236FF] via-[#B621FE] to-[#FF219D] bg-clip-text text-transparent mb-2">
              إنشاء حساب جديد
            </h1>
            <p className="text-purple-300">انضم إلى آلاف المستخدمين السعداء</p>
          </div>

          {/* Step Progress */}
          <StepProgress />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl text-center"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Choose User Type */}
            {step === 1 && !userType && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowComparison(!showComparison)}
                    className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-500/30 text-purple-200 hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    مقارنة الحسابات
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFAQ(!showFAQ)}
                    className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-500/30 text-purple-200 hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    أسئلة شائعة
                  </motion.button>
                </div>

                <h2 className="text-xl font-bold text-white mb-6 text-center">اختر نوع حسابك</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {userTypeOptions.map((option) => (
                    <motion.button
                      key={option.type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setUserType(option.type);
                        setStep(2);
                      }}
                      className="relative p-6 rounded-2xl text-center transition-all"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '2px solid rgba(98, 54, 255, 0.3)',
                      }}
                    >
                      {option.badge && (
                        <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                          option.badge === 'الأكثر شيوعاً' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {option.badge}
                        </span>
                      )}
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center mx-auto mb-4`}>
                        <option.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
                      <p className="text-sm text-purple-300 mb-2">{option.description}</p>
                      {option.subtitle && (
                        <p className="text-purple-300 text-xs mt-2">{option.subtitle}</p>
                      )}
                      {option.stats && (
                        <p className="text-purple-400 text-xs mt-1">{option.stats}</p>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Comparison Table */}
                <AnimatePresence>
                  {showComparison && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 overflow-hidden"
                    >
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
                        <h3 className="text-white font-semibold text-lg mb-6 text-center flex items-center justify-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          مقارنة شاملة بين أنواع الحسابات
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="border-b border-purple-500/30">
                                <th className="p-3 text-purple-300 font-medium min-w-[150px]">الميزة</th>
                                {Object.entries(accountComparison).map(([type, _]) => (
                                  <th key={type} className="p-3 text-white font-medium min-w-[100px]">
                                    {userTypeOptions.find(o => o.value === type)?.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(accountComparison.customer.features).map((feature) => (
                                <tr key={feature} className="border-b border-purple-500/10 hover:bg-white/5">
                                  <td className="p-3 text-purple-200 text-sm">{feature}</td>
                                  {Object.entries(accountComparison).map(([type, data]) => (
                                    <td key={type} className="p-3 text-center">
                                      {(data.features as any)[feature] ? (
                                        <Check className="w-5 h-5 text-green-400 mx-auto" />
                                      ) : (
                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FAQ Section */}
                <AnimatePresence>
                  {showFAQ && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-3"
                    >
                      <h3 className="text-white font-semibold text-lg mb-4 text-center flex items-center justify-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        أسئلة شائعة حول أنواع الحسابات
                      </h3>
                      {faqData.map((faq, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                            className="w-full p-4 flex items-center justify-between text-right hover:bg-white/10 transition-all"
                          >
                            <span className="text-white font-medium flex-1">{faq.question}</span>
                            {openFAQ === idx ? (
                              <ChevronUp className="w-5 h-5 text-purple-300" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-purple-300" />
                            )}
                          </button>
                          <AnimatePresence>
                            {openFAQ === idx && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-4 pb-4"
                              >
                                <p className="text-purple-200 text-sm leading-relaxed">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-500/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-purple-300" style={{ background: 'rgba(15, 10, 30, 0.8)' }}>
                      أو سجل باستخدام
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
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
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="group-hover:text-white transition-colors">التسجيل بواسطة Google</span>
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
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="group-hover:text-white transition-colors">التسجيل بواسطة Facebook</span>
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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="group-hover:text-white transition-colors">التسجيل بواسطة Apple</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Registration Form */}
            {step === 2 && userType && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Selected User Type Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {userTypeOptions.find(o => o.type === userType)?.icon && (
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${userTypeOptions.find(o => o.type === userType)?.color} flex items-center justify-center`}>
                        {(() => {
                          const Icon = userTypeOptions.find(o => o.type === userType)!.icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-purple-300">نوع الحساب</p>
                      <p className="text-white font-bold">{userTypeOptions.find(o => o.type === userType)?.title}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserType(null);
                      setStep(1);
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                  >
                    تغيير
                  </button>
                </div>

                {/* Basic Fields */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      placeholder="أدخل اسمك الكامل"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      placeholder="example@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="رقم الهاتف"
                  required={true}
                  label=""
                  className="phone-input-dark"
                />

                {/* Referral Code Field */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    كود الدعوة (اختياري)
                  </label>
                  <div className="relative">
                    <Gift className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all uppercase"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      placeholder="XXXXXXXX"
                      maxLength={8}
                      disabled={loading}
                    />
                  </div>
                  {referralCode && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ستحصل على 100 نقطة عند التسجيل!
                    </p>
                  )}
                </div>

                {/* Vendor-specific fields */}
                {userType === 'vendor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">اسم المتجر</label>
                      <div className="relative">
                        <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          style={{
                            background: 'rgba(98, 54, 255, 0.1)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                          placeholder="اسم متجرك"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">وصف المتجر</label>
                      <textarea
                        value={shopDescription}
                        onChange={(e) => setShopDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                        style={{
                          background: 'rgba(98, 54, 255, 0.1)',
                          border: '1px solid rgba(98, 54, 255, 0.3)',
                        }}
                        placeholder="وصف مختصر عن متجرك"
                        rows={3}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        صورة الهوية <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIdDocumentFile(file);
                              setIdDocumentUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                          id="vendor-id-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="vendor-id-upload"
                          className="w-full p-6 rounded-xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all group"
                          style={{
                            background: 'rgba(98, 54, 255, 0.05)',
                          }}
                        >
                          <Upload className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                          {idDocumentFile ? (
                            <div className="text-center">
                              <p className="text-white font-medium">{idDocumentFile.name}</p>
                              <p className="text-purple-300 text-sm mt-1">انقر لتغيير الملف</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-white font-medium">اضغط لرفع صورة الهوية</p>
                              <p className="text-purple-300 text-sm mt-1">JPG, PNG أو PDF (حتى 5 ميجا)</p>
                            </div>
                          )}
                        </label>
                      </div>
                      {idDocumentUrl && idDocumentFile && (
                        <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                          <p className="text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            تم رفع الملف بنجاح
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Driver-specific fields */}
                {userType === 'driver' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">نوع المركبة</label>
                      <div className="relative">
                        <Car className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full pr-12 pl-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          style={{
                            background: 'rgba(98, 54, 255, 0.1)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                          required
                          disabled={loading}
                        >
                          <option value="سيارة">سيارة</option>
                          <option value="دراجة نارية">دراجة نارية</option>
                          <option value="شاحنة صغيرة">شاحنة صغيرة</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">رقم اللوحة</label>
                      <div className="relative">
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          style={{
                            background: 'rgba(98, 54, 255, 0.1)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                          placeholder="ABC-123"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">رقم الرخصة</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        style={{
                          background: 'rgba(98, 54, 255, 0.1)',
                          border: '1px solid rgba(98, 54, 255, 0.3)',
                        }}
                        placeholder="رقم رخصة القيادة"
                        disabled={loading}
                      />
                    </div>

                    {/* Driver Documents */}
                    <div className="space-y-4 pt-4 border-t border-purple-500/30">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                        الوثائق المطلوبة
                      </h3>

                      {/* Driver ID */}
                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          صورة الهوية <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDriverIdDocumentFile(file);
                              setDriverIdDocumentUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                          id="driver-id-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="driver-id-upload"
                          className="w-full p-4 rounded-xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                          style={{ background: 'rgba(98, 54, 255, 0.05)' }}
                        >
                          <div className="flex items-center gap-3">
                            <Upload className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                            <div>
                              <p className="text-white font-medium text-sm">
                                {driverIdDocumentFile ? driverIdDocumentFile.name : 'رفع صورة الهوية'}
                              </p>
                              {!driverIdDocumentFile && (
                                <p className="text-purple-300 text-xs">JPG, PNG أو PDF</p>
                              )}
                            </div>
                          </div>
                          {driverIdDocumentUrl && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        </label>
                      </div>

                      {/* Driver License */}
                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          صورة رخصة القيادة <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLicenseImageFile(file);
                              setLicenseImageUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                          id="driver-license-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="driver-license-upload"
                          className="w-full p-4 rounded-xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                          style={{ background: 'rgba(98, 54, 255, 0.05)' }}
                        >
                          <div className="flex items-center gap-3">
                            <Upload className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                            <div>
                              <p className="text-white font-medium text-sm">
                                {licenseImageFile ? licenseImageFile.name : 'رفع صورة رخصة القيادة'}
                              </p>
                              {!licenseImageFile && (
                                <p className="text-purple-300 text-xs">JPG, PNG أو PDF</p>
                              )}
                            </div>
                          </div>
                          {licenseImageUrl && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        </label>
                      </div>

                      {/* Vehicle Registration */}
                      <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          صورة رخصة المركبة <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setVehicleRegistrationFile(file);
                              setVehicleRegistrationUrl(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                          id="vehicle-registration-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="vehicle-registration-upload"
                          className="w-full p-4 rounded-xl border-2 border-dashed border-purple-500/50 hover:border-purple-500 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                          style={{ background: 'rgba(98, 54, 255, 0.05)' }}
                        >
                          <div className="flex items-center gap-3">
                            <Upload className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                            <div>
                              <p className="text-white font-medium text-sm">
                                {vehicleRegistrationFile ? vehicleRegistrationFile.name : 'رفع صورة رخصة المركبة'}
                              </p>
                              {!vehicleRegistrationFile && (
                                <p className="text-purple-300 text-xs">JPG, PNG أو PDF</p>
                              )}
                            </div>
                          </div>
                          {vehicleRegistrationUrl && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Password Fields */}
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-12 pl-12 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pr-12 pl-12 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{
                        background: 'rgba(98, 54, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
                  style={{
                    background: loading 
                      ? 'rgba(98, 54, 255, 0.5)' 
                      : 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
                    boxShadow: loading 
                      ? 'none' 
                      : '0 0 30px rgba(98, 54, 255, 0.5), 0 0 60px rgba(255, 33, 157, 0.3)',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      إنشاء الحساب
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-purple-300">
              لديك حساب بالفعل؟{' '}
              <Link 
                href="/auth/login"
                className="text-transparent bg-gradient-to-r from-[#6236FF] to-[#FF219D] bg-clip-text font-bold hover:opacity-80 transition-opacity"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0A0515]"><p className="text-white">جاري التحميل...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}

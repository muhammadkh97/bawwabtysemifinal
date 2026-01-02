'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Settings, User, Lock, Bell, CreditCard, Shield, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface VendorSettings {
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_orders: boolean;
  notifications_reviews: boolean;
  notifications_messages: boolean;
}

interface VendorPayment {
  bank_name: string;
  account_number: string;
  iban: string;
}

export default function VendorSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payment'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // بيانات الملف الشخصي
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // بيانات الأمان
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // إعدادات الإشعارات
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // معلومات الدفع
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);

      // جلب بيانات المستخدم
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setFullName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
      }

      // جلب بيانات البائع
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('notifications_email, notifications_sms, notifications_orders, notifications_reviews, notifications_messages, bank_name, account_number, iban')
        .eq('user_id', user?.id)
        .single();

      if (vendorError && vendorError.code !== 'PGRST116') {
        console.error('Error fetching vendor data:', vendorError);
      }

      if (vendorData) {
        // إعدادات الإشعارات
        setEmailNotifications(vendorData.notifications_email ?? true);
        setSmsNotifications(vendorData.notifications_sms ?? false);
        setOrderNotifications(vendorData.notifications_orders ?? true);
        setReviewNotifications(vendorData.notifications_reviews ?? true);
        setMessageNotifications(vendorData.notifications_messages ?? true);

        // معلومات الدفع
        setBankName(vendorData.bank_name || '');
        setAccountNumber(vendorData.account_number || '');
        setIban(vendorData.iban || '');
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      showMessage('error', 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          name: fullName,
          phone: phone,
        })
        .eq('id', user?.id);

      if (error) throw error;

      showMessage('success', 'تم تحديث الملف الشخصي بنجاح!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('error', 'يرجى ملء جميع الحقول');
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage('error', 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين');
        return;
      }

      if (newPassword.length < 6) {
        showMessage('error', 'يجب أن تكون كلمة المرور على الأقل 6 أحرف');
        return;
      }

      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showMessage('success', 'تم تحديث كلمة المرور بنجاح!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      showMessage('error', error.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('vendors')
        .update({
          notifications_email: emailNotifications,
          notifications_sms: smsNotifications,
          notifications_orders: orderNotifications,
          notifications_reviews: reviewNotifications,
          notifications_messages: messageNotifications,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      showMessage('success', 'تم تحديث إعدادات الإشعارات بنجاح!');
    } catch (error) {
      console.error('Error updating notifications:', error);
      showMessage('error', 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('vendors')
        .update({
          bank_name: bankName,
          account_number: accountNumber,
          iban: iban,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      showMessage('success', 'تم تحديث معلومات الدفع بنجاح!');
    } catch (error) {
      console.error('Error updating payment info:', error);
      showMessage('error', 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'security', label: 'الأمان', icon: Lock },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'payment', label: 'معلومات الدفع', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-purple-300 text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName={fullName} userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* رسالة التأكيد/الخطأ */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                {message.text}
              </span>
            </motion.div>
          )}
        
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">الإعدادات</h1>
            <p className="text-purple-300 text-lg">إدارة حسابك وتفضيلاتك</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* التبويبات */}
            <div className="lg:col-span-1">
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      style={
                        activeTab === tab.id
                          ? { background: 'linear-gradient(90deg, #6236FF, #FF219D)' }
                          : { background: 'rgba(98, 54, 255, 0.1)' }
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* المحتوى */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                {/* الملف الشخصي */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <User className="w-6 h-6" />
                      الملف الشخصي
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">الاسم الكامل</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(98, 54, 255, 0.2)',
                          }}
                        />
                        <p className="text-purple-400 text-xs mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">رقم الهاتف</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>حفظ التغييرات</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* الأمان */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Lock className="w-6 h-6" />
                      الأمان
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">كلمة المرور الحالية</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">كلمة المرور الجديدة</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">تأكيد كلمة المرور</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري التحديث...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            <span>تحديث كلمة المرور</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* الإشعارات */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Bell className="w-6 h-6" />
                      الإشعارات
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-white font-bold mb-4">طرق الإشعار</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-white">إشعارات البريد الإلكتروني</span>
                            <input
                              type="checkbox"
                              checked={emailNotifications}
                              onChange={(e) => setEmailNotifications(e.target.checked)}
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-white">إشعارات SMS</span>
                            <input
                              type="checkbox"
                              checked={smsNotifications}
                              onChange={(e) => setSmsNotifications(e.target.checked)}
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-4">أنواع الإشعارات</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-white">طلبات جديدة</span>
                            <input
                              type="checkbox"
                              checked={orderNotifications}
                              onChange={(e) => setOrderNotifications(e.target.checked)}
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-white">تقييمات جديدة</span>
                            <input
                              type="checkbox"
                              checked={reviewNotifications}
                              onChange={(e) => setReviewNotifications(e.target.checked)}
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-white">رسائل جديدة</span>
                            <input
                              type="checkbox"
                              checked={messageNotifications}
                              onChange={(e) => setMessageNotifications(e.target.checked)}
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>حفظ التغييرات</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* معلومات الدفع */}
                {activeTab === 'payment' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <CreditCard className="w-6 h-6" />
                      معلومات الدفع
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">اسم البنك</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">رقم الحساب</label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">IBAN</label>
                        <input
                          type="text"
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(98, 54, 255, 0.3)',
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSavePayment}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>حفظ التغييرات</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

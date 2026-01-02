'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle, Package, FileText, Send, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function ComplaintsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    complaint_type: 'order',
    order_id: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    checkAuthAndFetchOrders();
  }, []);

  const checkAuthAndFetchOrders = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);
      await fetchOrders(user.id);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      router.push('/auth/login');
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!userId) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // إنشاء تذكرة شكوى
      const { error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject: `${formData.complaint_type === 'order' ? 'شكوى على طلب' : 'شكوى على منتج'}: ${formData.subject}`,
          message: formData.description,
          category: 'complaint',
          priority: formData.priority,
          status: 'open',
          metadata: {
            complaint_type: formData.complaint_type,
            order_id: formData.order_id || null
          }
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        complaint_type: 'order',
        order_id: '',
        subject: '',
        description: '',
        priority: 'medium'
      });

      setTimeout(() => {
        router.push('/my-tickets');
      }, 2000);
    } catch (err: any) {
      console.error('خطأ في إرسال الشكوى:', err);
      setError('حدث خطأ أثناء إرسال الشكوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block p-4 bg-red-100 rounded-2xl mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            نظام الشكاوي والنزاعات
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            هل واجهت مشكلة مع طلبك أو منتج؟ نحن هنا لمساعدتك في حل جميع المشاكل
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-700 font-bold">تم إرسال شكواك بنجاح!</p>
                <p className="text-green-600 text-sm">سيتم مراجعتها والرد عليك في أقرب وقت. جاري التحويل لصفحة التذاكر...</p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <XCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </motion.div>
          )}

          {/* Complaint Form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Complaint Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">نوع الشكوى *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, complaint_type: 'order' })}
                    className={`p-4 rounded-xl border-2 transition ${
                      formData.complaint_type === 'order'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <p className="font-bold text-gray-800">شكوى على طلب</p>
                    <p className="text-xs text-gray-500 mt-1">مشكلة في التوصيل أو المنتج المستلم</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, complaint_type: 'product' })}
                    className={`p-4 rounded-xl border-2 transition ${
                      formData.complaint_type === 'product'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <p className="font-bold text-gray-800">شكوى عامة</p>
                    <p className="text-xs text-gray-500 mt-1">مشكلة أخرى أو استفسار عام</p>
                  </button>
                </div>
              </div>

              {/* Order Selection (if order complaint) */}
              {formData.complaint_type === 'order' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اختر الطلب *</label>
                  <select
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- اختر طلباً --</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - {order.total_amount} ₪ ({new Date(order.created_at).toLocaleDateString('ar-EG')})
                      </option>
                    ))}
                  </select>
                  {orders.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      لا توجد طلبات سابقة. <Link href="/orders" className="text-red-600 font-bold hover:underline">اطلب الآن</Link>
                    </p>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الأولوية *</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">منخفضة - يمكن الانتظار</option>
                  <option value="medium">متوسطة - مهمة</option>
                  <option value="high">عالية - عاجلة</option>
                  <option value="urgent">عاجلة جداً - تحتاج حل فوري</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الشكوى *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="مثال: المنتج المستلم تالف"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الشكوى *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>تقديم الشكوى</span>
                  </>
                )}
              </button>
            </form>

            {/* View My Tickets */}
            <div className="mt-6 pt-6 border-t text-center">
              <Link
                href="/my-tickets"
                className="text-red-600 font-bold hover:underline inline-flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                <span>عرض جميع شكاويك وتذاكرك</span>
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">معلومات مهمة</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• سيتم مراجعة شكواك خلال 24 ساعة كحد أقصى</li>
                  <li>• يمكنك متابعة حالة الشكوى من صفحة &quot;تذاكري&quot;</li>
                  <li>• للشكاوي العاجلة، اتصل بنا مباشرة على الواتساب</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

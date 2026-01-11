'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';
import { Mail, CheckCircle, XCircle, Clock, Store, UtensilsCrossed, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Invitation {
  id: string;
  invitation_code: string;
  business_type: 'vendor' | 'restaurant';
  business_id: string;
  business_name: string;
  invited_by_name: string;
  permissions: string[];
  expires_at: string;
  created_at: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  const permissionLabels: Record<string, string> = {
    manage_products: 'إدارة المنتجات',
    view_orders: 'عرض الطلبات',
    manage_orders: 'إدارة الطلبات',
    view_analytics: 'عرض التحليلات',
    manage_marketing: 'إدارة التسويق',
    manage_settings: 'إدارة الإعدادات',
  };

  const fetchInvitations = useCallback(async (email: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('staff_invitations')
        .select(`
          *,
          invited_by:users!staff_invitations_invited_by_fkey(full_name)
        `)
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // جلب أسماء الأعمال
      const formattedInvitations: Invitation[] = [];
      
      for (const inv of data || []) {
        let businessName = '';
        
        if (inv.business_type === 'vendor') {
          const { data: storeData } = await supabase
            .from('stores')
            .select('store_name')
            .eq('id', inv.business_id)
            .single();
          businessName = storeData?.store_name || 'متجر';
        } else if (inv.business_type === 'restaurant') {
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', inv.business_id)
            .single();
          businessName = restaurantData?.name || 'مطعم';
        }

        // تحويل permissions من string إلى array إذا لزم الأمر
        let permissionsArray = [];
        if (inv.permissions) {
          if (typeof inv.permissions === 'string') {
            try {
              permissionsArray = JSON.parse(inv.permissions);
            } catch (e) {
              permissionsArray = [];
            }
          } else if (Array.isArray(inv.permissions)) {
            permissionsArray = inv.permissions;
          }
        }

        formattedInvitations.push({
          id: inv.id,
          invitation_code: inv.invitation_code,
          business_type: inv.business_type,
          business_id: inv.business_id,
          business_name: businessName,
          invited_by_name: inv.invited_by?.full_name || 'مستخدم',
          permissions: permissionsArray,
          expires_at: new Date(inv.expires_at).toLocaleDateString('ar-SA'),
          created_at: new Date(inv.created_at).toLocaleDateString('ar-SA'),
        });
      }

      setInvitations(formattedInvitations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching invitations', { error: errorMessage, component: 'InvitationsPage' });
      toast.error('حدث خطأ في جلب الدعوات');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthAndFetchInvitations = useCallback(async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      if (user.email) {
        await fetchInvitations(user.email);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Auth check error', { error: errorMessage, component: 'InvitationsPage' });
      router.push('/auth/login');
    }
  }, [fetchInvitations, router]);

  useEffect(() => {
    checkAuthAndFetchInvitations();
  }, [checkAuthAndFetchInvitations]);

  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      setProcessing(invitation.id);
      
      const { user } = await getCurrentUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }

      // إضافة المستخدم للفريق
      const tableName = invitation.business_type === 'vendor' ? 'vendor_staff' : 'restaurant_staff';
      const idField = invitation.business_type === 'vendor' ? 'vendor_id' : 'restaurant_id';

      // التحقق من وجود سجل سابق
      const { data: existingStaff } = await supabase
        .from(tableName)
        .select('id, status')
        .eq(idField, invitation.business_id)
        .eq('user_id', user.id)
        .maybeSingle();

      let staffError = null;

      if (existingStaff) {
        // تحديث السجل الموجود
        const { error } = await supabase
          .from(tableName)
          .update({
            permissions: invitation.permissions,
            status: 'active',
            accepted_at: new Date().toISOString()
          })
          .eq('id', existingStaff.id);
        
        staffError = error;
      } else {
        // إنشاء سجل جديد
        const { error } = await supabase
          .from(tableName)
          .insert({
            [idField]: invitation.business_id,
            user_id: user.id,
            permissions: invitation.permissions,
            status: 'active',
            accepted_at: new Date().toISOString()
          });
        
        staffError = error;
      }

      if (staffError) throw staffError;

      // تحديث حالة الدعوة
      const { error: invError } = await supabase
        .from('staff_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (invError) throw invError;

      // إرسال إشعار لصاحب العمل بقبول الدعوة
      const { data: invData } = await supabase
        .from('staff_invitations')
        .select('invited_by')
        .eq('id', invitation.id)
        .single();

      if (invData?.invited_by) {
        await supabase.from('notifications').insert({
          user_id: invData.invited_by,
          type: 'staff_invitation',
          title: 'تم قبول الدعوة',
          message: `قبل ${user.email} دعوة الانضمام إلى ${invitation.business_name}`,
          link: '/dashboard/vendor/staff'
        });
      }

      toast.success('✅ تم قبول الدعوة بنجاح! يمكنك الآن الوصول إلى لوحة التحكم');
      
      // إعادة تحميل الصفحة بعد ثانية لتحديث كل شيء
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload();
      }, 1500);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : error?.message || 'Unknown error';
      logger.error('Error accepting invitation', { error: errorMessage, component: 'InvitationsPage' });
      toast.error(error.message || 'حدث خطأ في قبول الدعوة');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    if (!confirm('هل أنت متأكد من رفض هذه الدعوة؟')) return;

    try {
      setProcessing(invitationId);

      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('تم رفض الدعوة');
      
      // إعادة جلب الدعوات
      const { user } = await getCurrentUser();
      if (user && user.email) {
        await fetchInvitations(user.email);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : error?.message || 'Unknown error';
      logger.error('Error rejecting invitation', { error: errorMessage, component: 'InvitationsPage', invitationId });
      toast.error('حدث خطأ في رفض الدعوة');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            دعوات الانضمام
          </h1>
          <p className="text-gray-600">إدارة دعوات الانضمام كمساعد للمتاجر والمطاعم</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invitations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-12 text-center"
          >
            <Mail className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد دعوات حالياً</h3>
            <p className="text-gray-600">ليس لديك أي دعوات معلقة في الوقت الحالي</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {invitations.map((invitation, index) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-xl p-8 border-2 border-purple-100 hover:border-purple-300 transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {invitation.business_type === 'vendor' ? (
                      <Store className="w-8 h-8 text-white" />
                    ) : (
                      <UtensilsCrossed className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                      {invitation.business_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      دعوة من: <span className="font-bold">{invitation.invited_by_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      ينتهي في: {invitation.expires_at}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-700">الصلاحيات الممنوحة:</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {invitation.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {permissionLabels[perm] || perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptInvitation(invitation)}
                    disabled={processing === invitation.id}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {processing === invitation.id ? 'جاري القبول...' : 'قبول'}
                  </button>
                  <button
                    onClick={() => handleRejectInvitation(invitation.id)}
                    disabled={processing === invitation.id}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    رفض
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

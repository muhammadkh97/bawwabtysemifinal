'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, Trash2, Mail, Lock, CheckCircle2, XCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import toast from 'react-hot-toast';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  permissions: string[];
  status: 'pending' | 'active' | 'suspended' | 'removed';
  invited_at: string;
  accepted_at?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  permissions: string[];
  status: string;
  expires_at: string;
  created_at: string;
}

interface StaffDataFromDB {
  id: string;
  user_id: string;
  permissions: string[];
  status: 'pending' | 'active' | 'suspended' | 'removed';
  invited_at: string;
  accepted_at: string | null;
  users: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function VendorStaffPage() {
  const { user, isVendorStaff, staffPermissions, staffVendorId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['view_orders', 'manage_products']);

  // التحقق من صلاحية إدارة المساعدين
  const canManageStaff = !isVendorStaff || hasPermission(staffPermissions, 'manage_staff');

  const availablePermissions = [
    { id: 'manage_products', name: 'إدارة المنتجات', description: 'إضافة وتعديل وحذف المنتجات' },
    { id: 'view_orders', name: 'عرض الطلبات', description: 'مشاهدة تفاصيل الطلبات الواردة' },
    { id: 'manage_orders', name: 'إدارة الطلبات', description: 'تحديث حالة الطلبات ومعالجتها' },
    { id: 'view_analytics', name: 'عرض التحليلات', description: 'مشاهدة إحصائيات وتقارير المتجر' },
    { id: 'manage_marketing', name: 'إدارة التسويق', description: 'إنشاء الكوبونات والعروض الترويجية' },
    { id: 'manage_settings', name: 'إدارة الإعدادات', description: 'تعديل معلومات المتجر والإعدادات العامة' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // إذا كان مساعد، استخدم staffVendorId، وإلا ابحث عن المتجر
      let currentVendorId: string | null = null;
      
      if (isVendorStaff && staffVendorId) {
        currentVendorId = staffVendorId;
      } else {
        // Get vendor ID
        const { data: vendorData, error: vendorError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user!.id)
          .single();

        if (vendorError) throw vendorError;
        if (!vendorData) {
          toast.error('لم يتم العثور على متجرك');
          setLoading(false);
          return;
        }

        currentVendorId = vendorData.id;
      }

      setVendorId(currentVendorId);

      // جلب الموظفين النشطين
      const { data: staffData, error: staffError } = await supabase
        .from('vendor_staff')
        .select(`
          id,
          user_id,
          permissions,
          status,
          invited_at,
          accepted_at,
          users!vendor_staff_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('vendor_id', currentVendorId)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;

      const formattedStaff: StaffMember[] = (staffData as StaffDataFromDB[] || []).map((s) => ({
        id: s.id,
        user_id: s.user_id,
        name: s.users?.full_name || 'مستخدم',
        email: s.users?.email || '',
        permissions: s.permissions || [],
        status: s.status,
        invited_at: new Date(s.invited_at).toLocaleDateString('ar-SA'),
        accepted_at: s.accepted_at ? new Date(s.accepted_at).toLocaleDateString('ar-SA') : undefined,
      }));

      setStaff(formattedStaff);

      // جلب الدعوات المعلقة
      const { data: invitationsData, error: invError } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('business_id', currentVendorId)
        .eq('business_type', 'vendor')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      setInvitations(invitationsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في جلب البيانات';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorId || !user?.id) {
      toast.error('خطأ في التحقق من الهوية');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('يجب اختيار صلاحية واحدة على الأقل');
      return;
    }

    setSubmitting(true);

    try {
      // استدعاء دالة إنشاء الدعوة
      const { data, error } = await supabase.rpc('create_staff_invitation', {
        p_email: newEmail.trim().toLowerCase(),
        p_business_type: 'vendor',
        p_business_id: vendorId,
        p_invited_by: user.id,
        p_permissions: JSON.stringify(selectedPermissions),
        p_expires_in_days: 7
      });

      if (error) throw error;

      const result = data as { success: boolean; user_exists: boolean; user_id: string; invitation_code: string };

      if (result.user_exists && result.user_id) {
        // التحقق من وجود سجل سابق للمستخدم
        const { data: existingStaff, error: checkError } = await supabase
          .from('vendor_staff')
          .select('id, status')
          .eq('vendor_id', vendorId)
          .eq('user_id', result.user_id)
          .maybeSingle();

        if (checkError) throw checkError;

        let staffAction = '';

        if (existingStaff) {
          // السجل موجود - تحديثه
          if (existingStaff.status === 'removed') {
            // إعادة تفعيل المساعد المحذوف
            const { error: updateError } = await supabase
              .from('vendor_staff')
              .update({
                status: 'active',
                permissions: selectedPermissions,
                accepted_at: new Date().toISOString(),
                invited_at: new Date().toISOString(),
                invited_by: user.id
              })
              .eq('id', existingStaff.id);

            if (updateError) throw updateError;
            staffAction = 'reactivated';
          } else if (existingStaff.status === 'active') {
            // المساعد نشط بالفعل - تحديث الصلاحيات فقط
            const { error: updateError } = await supabase
              .from('vendor_staff')
              .update({
                permissions: selectedPermissions
              })
              .eq('id', existingStaff.id);

            if (updateError) throw updateError;
            staffAction = 'updated';
          }
        } else {
          // السجل غير موجود - إضافة جديد
          const { error: insertError } = await supabase
            .from('vendor_staff')
            .insert({
              vendor_id: vendorId,
              user_id: result.user_id,
              permissions: selectedPermissions,
              status: 'active',
              invited_by: user.id,
              accepted_at: new Date().toISOString()
            });

          if (insertError) throw insertError;
          staffAction = 'added';
        }

        // إرسال إشعار للمستخدم
        const { data: storeData } = await supabase
          .from('stores')
          .select('store_name')
          .eq('id', vendorId)
          .single();

        const notificationMessages = {
          added: 'تمت إضافتك كمساعد في متجر',
          reactivated: 'تم إعادة تفعيلك كمساعد في متجر',
          updated: 'تم تحديث صلاحياتك في متجر'
        };

        await supabase.from('notifications').insert({
          user_id: result.user_id,
          type: 'staff_invitation',
          title: staffAction === 'added' ? 'دعوة للانضمام كمساعد' : 'تحديث حسابك المساعد',
          message: `${notificationMessages[staffAction as keyof typeof notificationMessages]} ${storeData?.store_name || 'المتجر'}`,
          link: '/invitations',
          priority: 'high'
        });

        const successMessages = {
          added: '✅ تمت إضافة المساعد بنجاح!',
          reactivated: '✅ تم إعادة تفعيل المساعد بنجاح!',
          updated: '✅ تم تحديث صلاحيات المساعد بنجاح!'
        };

        toast.success(successMessages[staffAction as keyof typeof successMessages]);
      } else {
        // المستخدم غير موجود، تم إرسال دعوة
        toast.success('📧 تم إرسال دعوة للبريد الإلكتروني. سيتم إضافته عند التسجيل.');
      }

      // Reset form
      setShowAddModal(false);
      setNewEmail('');
      setSelectedPermissions(['view_orders', 'manage_products']);
      
      // Refresh data
      await fetchData();

    } catch (error) {
      console.error('Error adding staff:', error);
      
      // رسائل خطأ مخصصة
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('⚠️ هذا المستخدم مضاف بالفعل كمساعد في متجرك');
      } else if (error instanceof Error) {
        toast.error(error.message || 'حدث خطأ في إضافة المساعد');
      } else {
        toast.error('حدث خطأ في إضافة المساعد');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا المساعد؟')) return;

    try {
      const { error } = await supabase
        .from('vendor_staff')
        .update({ status: 'removed' })
        .eq('id', staffId);

      if (error) throw error;

      toast.success('تم إزالة المساعد بنجاح');
      await fetchData();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('حدث خطأ في إزالة المساعد');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الدعوة؟')) return;

    try {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('تم إلغاء الدعوة بنجاح');
      await fetchData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('حدث خطأ في إلغاء الدعوة');
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName={(user as any)?.full_name || 'بائع'} userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* رسالة تحذير للمساعدين بدون صلاحية */}
          {isVendorStaff && !canManageStaff && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-2">⚠️ لا تمتلك صلاحية إدارة المساعدين</h3>
                  <p className="text-yellow-400">ليس لديك صلاحية "manage_staff" لإدارة الحسابات المساعدة. يمكنك فقط عرض قائمة المساعدين.</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-purple-400" />
                الحسابات المساعدة
              </h1>
              <p className="text-purple-300 text-lg">إدارة طاقم عمل متجرك وتحديد صلاحياتهم</p>
            </div>
            {canManageStaff && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
              >
                <Plus className="w-5 h-5" />
                <span>إضافة مساعد جديد</span>
              </button>
            )}
          </motion.div>

          {/* Staff List */}
          <div className="space-y-6">
            {/* Active Staff */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">المساعدون النشطون</h2>
              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : staff.filter(s => s.status === 'active').length === 0 ? (
                  <div className="text-center py-20 rounded-2xl bg-[#0A0515]/5 border border-purple-500/20">
                    <Users className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                    <h3 className="text-xl font-bold text-white">لا يوجد حسابات مساعدة حالياً</h3>
                    <p className="text-purple-300">ابدأ بإضافة أول مساعد لمتجرك</p>
                  </div>
                ) : (
                  staff.filter(s => s.status === 'active').map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                      style={{
                        background: 'rgba(15, 10, 30, 0.6)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{member.name}</h3>
                          <p className="text-purple-300 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-purple-400 mb-2 font-bold">الصلاحيات:</p>
                        <div className="flex flex-wrap gap-2">
                          {member.permissions.map(perm => (
                            <span key={perm} className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs">
                              {availablePermissions.find(p => p.id === perm)?.name || perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                          نشط
                        </span>
                        {canManageStaff && (
                          <button 
                            onClick={() => handleRemoveStaff(member.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-400" />
                  الدعوات المعلقة
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {invitations.map((inv) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl p-4 flex items-center justify-between"
                      style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Send className="w-8 h-8 text-yellow-400" />
                        <div>
                          <p className="text-white font-bold">{inv.email}</p>
                          <p className="text-sm text-yellow-300">
                            ينتهي في: {new Date(inv.expires_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold"
                      >
                        إلغاء
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]"
              style={{
                background: '#150B2E',
                border: '1px solid rgba(98, 54, 255, 0.4)',
                boxShadow: '0 0 50px rgba(98, 54, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Plus className="w-6 h-6 text-purple-400" />
                  إضافة مساعد جديد
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-purple-300 hover:text-white">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-6">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 rounded-xl bg-[#0A0515]/5 border border-purple-500/30 text-white focus:border-purple-500 outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                  <p className="text-xs text-purple-400 mt-2">
                    💡 إذا كان المستخدم مسجلاً، سيضاف فوراً. وإلا سيُرسل له دعوة للتسجيل.
                  </p>
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-4 font-bold">تحديد الصلاحيات</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePermissions.map((perm) => (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedPermissions.includes(perm.id)
                            ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(98,54,255,0.2)]'
                            : 'bg-[#0A0515]/5 border-purple-500/20 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{perm.name}</span>
                          {selectedPermissions.includes(perm.id) && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                        </div>
                        <p className="text-xs text-purple-300/70">{perm.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                >
                  {submitting ? 'جاري الإضافة...' : 'إضافة المساعد'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

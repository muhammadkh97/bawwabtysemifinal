'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Users, Plus, Shield, Trash2, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  created_at: string;
}

export default function VendorStaffPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['view_orders', 'manage_products']);

  const availablePermissions = [
    { id: 'manage_products', name: 'إدارة المنتجات', description: 'إضافة وتعديل وحذف المنتجات' },
    { id: 'view_orders', name: 'عرض الطلبات', description: 'مشاهدة تفاصيل الطلبات الواردة' },
    { id: 'manage_orders', name: 'إدارة الطلبات', description: 'تحديث حالة الطلبات ومعالجتها' },
    { id: 'view_analytics', name: 'عرض التحليلات', description: 'مشاهدة إحصائيات وتقارير المتجر' },
    { id: 'manage_marketing', name: 'إدارة التسويق', description: 'إنشاء الكوبونات والعروض الترويجية' },
    { id: 'manage_settings', name: 'إدارة الإعدادات', description: 'تعديل معلومات المتجر والإعدادات العامة' },
  ];

  useEffect(() => {
    if (userId) {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      // جلب الموظفين من قاعدة البيانات (disabled - table doesn't exist yet)
      // TODO: Create vendor_staff table
      /*
      const { data: staffData, error } = await supabase
        .from('vendor_staff')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStaff(staffData || []);
      */
      
      setStaff([]); // Empty array until table is created
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم إرسال دعوة للحساب المساعد بنجاح (بيئة تجريبية)');
    setShowAddModal(false);
    // إعادة تعيين النموذج
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setSelectedPermissions(['view_orders', 'manage_products']);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
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
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
            >
              <Plus className="w-5 h-5" />
              <span>إضافة مساعد جديد</span>
            </button>
          </motion.div>

          {/* Staff List */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-white/5 border border-purple-500/20">
                <Users className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                <h3 className="text-xl font-bold text-white">لا يوجد حسابات مساعدة حالياً</h3>
                <p className="text-purple-300">ابدأ بإضافة أول مساعد لمتجرك</p>
              </div>
            ) : (
              staff.map((member) => (
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {member.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                    <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">الاسم الكامل</label>
                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 text-white focus:border-purple-500 outline-none"
                      placeholder="أدخل اسم المساعد"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 text-white focus:border-purple-500 outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-purple-300 text-sm mb-2">كلمة المرور المؤقتة</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 text-white focus:border-purple-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
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
                          : 'bg-white/5 border-purple-500/20 hover:border-purple-500/40'
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
                className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
              >
                إنشاء الحساب المساعد
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

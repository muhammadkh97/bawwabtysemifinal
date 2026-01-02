'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Store,
  Truck,
  ExternalLink,
  Eye,
  Download,
  AlertTriangle,
  Filter,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  shop_name?: string;
  shop_description?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  id_document_url?: string;
  license_image_url?: string;
  vehicle_registration_url?: string;
  verification_status: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'vendor' | 'driver'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchPendingUsers();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      router.push('/');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('verification_status', 'pending')
        .in('role', ['vendor', 'driver'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      // Get user data first
      const { data: userData } = await supabase
        .from('users')
        .select('email, name, role')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Send approval notification (simple implementation)
      if (userData) {
        console.log(`✅ Approved: ${userData.email} (${userData.role})`);
        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // Example: await sendEmail({
        //   to: userData.email,
        //   subject: 'تم قبول طلبك',
        //   body: `مرحباً ${userData.full_name}, تم قبول طلب التسجيل الخاص بك!`
        // });
      }
      
      await fetchPendingUsers();
      setSelectedUser(null);
      alert('✅ تم قبول الطلب بنجاح');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('❌ حدث خطأ أثناء قبول الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert('الرجاء إدخال سبب الرفض');
      return;
    }

    setProcessingId(userId);
    try {
      // Get user data first
      const { data: userData } = await supabase
        .from('users')
        .select('email, name, role')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason,
          verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Send rejection notification (simple implementation)
      if (userData) {
        console.log(`❌ Rejected: ${userData.email} - Reason: ${rejectionReason}`);
        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // Example: await sendEmail({
        //   to: userData.email,
        //   subject: 'تم رفض طلبك',
        //   body: `مرحباً ${userData.full_name}, نأسف لإبلاغك بأن طلبك تم رفضه. السبب: ${rejectionReason}`
        // });
      }
      
      await fetchPendingUsers();
      setSelectedUser(null);
      setRejectionReason('');
      alert('✅ تم رفض الطلب');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('❌ حدث خطأ أثناء رفض الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = pendingUsers.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    return matchesRole && matchesSearch;
  });


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            طلبات التحقق المعلقة
          </h1>
          <p className="text-purple-100">
            راجع وافق على طلبات البائعين والسائقين
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl backdrop-blur-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، البريد، أو الهاتف..."
                className="w-full pr-12 pl-4 py-3 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  background: 'rgba(98, 54, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>

            {/* Role Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'الكل', icon: Filter },
                { value: 'vendor', label: 'البائعين', icon: Store },
                { value: 'driver', label: 'السائقين', icon: Truck },
              ].map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setFilterRole(filter.value as any)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      filterRole === filter.value
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: 'إجمالي الطلبات',
              value: pendingUsers.length,
              icon: Clock,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'طلبات البائعين',
              value: pendingUsers.filter((u) => u.role === 'vendor').length,
              icon: Store,
              color: 'from-purple-500 to-pink-500',
            },
            {
              label: 'طلبات السائقين',
              value: pendingUsers.filter((u) => u.role === 'driver').length,
              icon: Truck,
              color: 'from-orange-500 to-red-500',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl backdrop-blur-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${stat.color}`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pending Users List */}
        {filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Clock className="w-20 h-20 text-purple-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-2">
              لا توجد طلبات معلقة
            </h3>
            <p className="text-purple-100">
              جميع الطلبات تمت معالجتها
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-2xl backdrop-blur-lg hover:shadow-2xl transition-all cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${
                        user.role === 'vendor'
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                      }`}
                    >
                      {user.role === 'vendor' ? (
                        <Store className="w-6 h-6 text-white" />
                      ) : (
                        <Truck className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {user.name}
                      </h3>
                      <p className="text-purple-100 text-sm mb-2">{user.email}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-100">
                          {user.role === 'vendor' ? 'بائع' : 'سائق'}
                        </span>
                        {user.role === 'vendor' && user.shop_name && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-100">
                            {user.shop_name}
                          </span>
                        )}
                        {user.role === 'driver' && user.vehicle_type && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-100">
                            {user.vehicle_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    مراجعة
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                {selectedUser.role === 'vendor' ? (
                  <Store className="w-8 h-8" />
                ) : (
                  <Truck className="w-8 h-8" />
                )}
                تفاصيل الطلب
              </h2>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="p-4 rounded-xl bg-white/10">
                  <h3 className="text-lg font-bold text-white mb-3">المعلومات الأساسية</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-purple-200">الاسم</p>
                      <p className="text-white font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">البريد الإلكتروني</p>
                      <p className="text-white font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">رقم الهاتف</p>
                      <p className="text-white font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">النوع</p>
                      <p className="text-white font-medium">
                        {selectedUser.role === 'vendor' ? 'بائع' : 'سائق'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vendor Specific */}
                {selectedUser.role === 'vendor' && (
                  <div className="p-4 rounded-xl bg-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">معلومات المتجر</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-purple-200">اسم المتجر</p>
                        <p className="text-white font-medium">{selectedUser.shop_name}</p>
                      </div>
                      <div>
                        <p className="text-purple-200">وصف المتجر</p>
                        <p className="text-white font-medium">{selectedUser.shop_description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Specific */}
                {selectedUser.role === 'driver' && (
                  <div className="p-4 rounded-xl bg-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">معلومات المركبة</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-purple-200">نوع المركبة</p>
                        <p className="text-white font-medium">{selectedUser.vehicle_type}</p>
                      </div>
                      <div>
                        <p className="text-purple-200">رقم المركبة</p>
                        <p className="text-white font-medium">{selectedUser.vehicle_number}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-purple-200">رقم رخصة القيادة</p>
                        <p className="text-white font-medium">{selectedUser.license_number}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="p-4 rounded-xl bg-white/10">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    المستندات المرفقة
                  </h3>
                  <div className="space-y-3">
                    {selectedUser.id_document_url && (
                      <a
                        href={selectedUser.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <span className="text-white">صورة الهوية</span>
                        <ExternalLink className="w-4 h-4 text-purple-300" />
                      </a>
                    )}
                    {selectedUser.license_image_url && (
                      <a
                        href={selectedUser.license_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <span className="text-white">صورة رخصة القيادة</span>
                        <ExternalLink className="w-4 h-4 text-purple-300" />
                      </a>
                    )}
                    {selectedUser.vehicle_registration_url && (
                      <a
                        href={selectedUser.vehicle_registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <span className="text-white">صورة رخصة المركبة</span>
                        <ExternalLink className="w-4 h-4 text-purple-300" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <label className="block text-white font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    سبب الرفض (اختياري)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="اكتب سبب الرفض إذا كنت ترغب في رفض الطلب..."
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-red-300/50 bg-red-500/10 border border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(selectedUser.id)}
                    disabled={processingId === selectedUser.id}
                    className="flex-1 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    قبول الطلب
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id)}
                    disabled={processingId === selectedUser.id}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    رفض الطلب
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'customers' | 'vendors' | 'drivers'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    vendors: 0,
    drivers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // جلب جميع المستخدمين
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const formattedUsers = (usersData || []).map((user: any) => ({
        id: user.id,
        name: user.name || 'مستخدم',
        email: user.email || 'غير محدد',
        role: user.role || 'customer',
        joined: user.created_at,
      }));

      setUsers(formattedUsers);

      // حساب الإحصائيات
      const total = formattedUsers.length;
      const customers = formattedUsers.filter((u: any) => u.role === 'customer').length;
      const vendors = formattedUsers.filter((u: any) => u.role === 'vendor').length;
      const drivers = formattedUsers.filter((u: any) => u.role === 'driver').length;

      setStats({ total, customers, vendors, drivers });
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // تحويل اسم التاب إلى الدور المقابل
    let roleToMatch = '';
    if (activeTab === 'customers') roleToMatch = 'customer';
    else if (activeTab === 'vendors') roleToMatch = 'vendor';
    else if (activeTab === 'drivers') roleToMatch = 'driver';
    
    const matchesTab = activeTab === 'all' || user.role === roleToMatch;
    const matchesSearch = user.name.includes(searchTerm) || user.email.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="admin" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المستخدمين</h1>
            <p className="text-gray-600">إدارة جميع مستخدمي المنصة</p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">جاري تحميل المستخدمين...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.total.toLocaleString('ar-SA')}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">العملاء</p>
                  <h3 className="text-3xl font-bold text-blue-600">{stats.customers.toLocaleString('ar-SA')}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">البائعون</p>
                  <h3 className="text-3xl font-bold text-purple-600">{stats.vendors.toLocaleString('ar-SA')}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">المناديب</p>
                  <h3 className="text-3xl font-bold text-green-600">{stats.drivers.toLocaleString('ar-SA')}</h3>
                </div>
              </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="search"
                  placeholder="البحث عن مستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'customers', 'vendors', 'drivers'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'all' && 'الكل'}
                    {tab === 'customers' && 'العملاء'}
                    {tab === 'vendors' && 'البائعون'}
                    {tab === 'drivers' && 'المناديب'}
                  </button>
                ))}
              </div>
            </div>
          </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-xl text-gray-600 mb-2">لا يوجد مستخدمون</p>
                  <p className="text-gray-400">لم يتم العثور على مستخدمين في هذه الفئة</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانضمام</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'customer' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'vendor' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'customer' && '🛍️ عميل'}
                          {user.role === 'vendor' && '🏪 بائع'}
                          {user.role === 'driver' && '🚗 مندوب'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ نشط
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(user.joined).toLocaleDateString('ar-SA')}
                      </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                                className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors hover:underline"
                              >
                                عرض
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}


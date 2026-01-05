'use client';

import { useState, useEffect } from 'react';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { supabase } from '@/lib/supabase';

interface FinancialSummary {
  totalCommissions: number;
  pendingPayouts: number;
  totalPayments: number;
  totalTaxes: number;
}

interface FinancialSettings {
  default_commission_rate: number;
  tax_rate: number;
  min_payout_amount: number;
  base_delivery_fee: number;
  per_km_delivery_fee: number;
}

export default function AdminFinancialsPage() {
  const [activeTab, setActiveTab] = useState<'commissions' | 'payouts' | 'settings'>('commissions');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalCommissions: 0,
    pendingPayouts: 0,
    totalPayments: 0,
    totalTaxes: 0
  });
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [settings, setSettings] = useState<FinancialSettings>({
    default_commission_rate: 10,
    tax_rate: 16,
    min_payout_amount: 100,
    base_delivery_fee: 20,
    per_km_delivery_fee: 2
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 0. جلب الإعدادات المالية
      const { data: settingsData } = await supabase
        .from('financial_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (settingsData) {
        setSettings({
          default_commission_rate: settingsData.default_commission_rate || 10,
          tax_rate: settingsData.tax_rate || 16,
          min_payout_amount: settingsData.min_payout_amount || 100,
          base_delivery_fee: settingsData.base_delivery_fee || 20,
          per_km_delivery_fee: settingsData.per_km_delivery_fee || 2
        });
      }

      // 1. جلب الطلبات المكتملة لحساب العمولات
      // جلب الطلبات المكتملة مع معلومات المتاجر
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          stores!orders_vendor_id_fkey (
            id,
            name,
            name_ar
          )
        `)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(50);

      // جلب العمولات من جدول commissions
      const { data: commissionsFromDB } = await supabase
        .from('commissions')
        .select(`
          *,
          orders!commissions_order_id_fkey (
            order_number
          )
        `)
        .order('created_at', { ascending: false });

      // تنسيق بيانات العمولات
      const commissionsData = commissionsFromDB?.map(commission => {
        const order = commission.orders as any;
        
        return {
          order_id: order?.order_number || commission.order_id.slice(0, 8),
          vendor_name: 'بائع', // سنحتاج JOIN إضافي للحصول على اسم البائع
          order_total: commission.order_amount,
          commission_rate: commission.commission_rate * 100, // تحويل من 0.10 إلى 10
          commission_amount: commission.commission_amount,
          vendor_earning: commission.order_amount - commission.commission_amount,
          date: new Date(commission.created_at).toLocaleDateString('ar-JO'),
          status: commission.status
        };
      }) || [];

      setCommissions(commissionsData);

      const totalCommissions = commissionsData.reduce((sum, c) => sum + c.commission_amount, 0);
      const totalPayments = commissionsData.reduce((sum, c) => sum + c.order_total, 0);
      const totalTaxes = totalPayments * 0.16; // 16% ضريبة

      // 2. جلب طلبات السحب
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select(`
          id,
          amount,
          status,
          bank_name,
          bank_account_number,
          bank_account_holder,
          created_at,
          users!payouts_user_id_fkey (
            name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      const payoutsFormatted = payoutsData?.map(p => {
        const user = p.users as any;
        return {
          id: p.id,
          amount: p.amount,
          status: p.status,
          user_name: user?.name || 'مستخدم',
          user_role: user?.role || 'vendor',
          bank_details: {
            bank_name: p.bank_name || 'غير محدد',
            account_number: p.bank_account_number || 'غير محدد',
            account_holder: p.bank_account_holder || 'غير محدد'
          },
          requested_at: new Date(p.created_at).toLocaleDateString('ar-JO')
        };
      }) || [];

      setPayouts(payoutsFormatted);
      
      const pendingPayouts = payoutsFormatted.filter(p => p.status === 'pending').length;

      setFinancialSummary({
        totalCommissions,
        pendingPayouts,
        totalPayments,
        totalTaxes
      });

    } catch (error) {
      console.error('خطأ في جلب البيانات المالية:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // تحديث أو إدراج الإعدادات
      const { data: existing } = await supabase
        .from('financial_settings')
        .select('id')
        .eq('is_active', true)
        .single();

      if (existing) {
        // تحديث
        const { error } = await supabase
          .from('financial_settings')
          .update({
            default_commission_rate: settings.default_commission_rate,
            tax_rate: settings.tax_rate,
            min_payout_amount: settings.min_payout_amount,
            base_delivery_fee: settings.base_delivery_fee,
            per_km_delivery_fee: settings.per_km_delivery_fee,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // إدراج جديد
        const { error } = await supabase
          .from('financial_settings')
          .insert({
            default_commission_rate: settings.default_commission_rate,
            tax_rate: settings.tax_rate,
            min_payout_amount: settings.min_payout_amount,
            base_delivery_fee: settings.base_delivery_fee,
            per_km_delivery_fee: settings.per_km_delivery_fee,
            is_active: true
          });

        if (error) throw error;
      }

      alert('✅ تم حفظ الإعدادات المالية بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApprovePayout = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payouts')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      alert(`✅ تمت الموافقة على طلب السحب`);
      fetchFinancialData(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ في الموافقة:', error);
      alert('حدث خطأ في الموافقة على الطلب');
    }
  };

  const handleRejectPayout = async (id: string) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (reason) {
      try {
        const { error } = await supabase
          .from('payouts')
          .update({ status: 'rejected', rejection_reason: reason })
          .eq('id', id);

        if (error) throw error;
        
        alert(`✅ تم رفض طلب السحب`);
        fetchFinancialData();
      } catch (error) {
        console.error('خطأ في رفض الطلب:', error);
        alert('حدث خطأ في رفض الطلب');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50">
        <FuturisticSidebar role="admin" />
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userName="" userRole="admin" />
          <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل البيانات المالية...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="admin" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">الإدارة المالية</h1>
            <p className="text-gray-600">إدارة العمولات والمدفوعات والإعدادات المالية</p>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">إجمالي العمولات</p>
              <h3 className="text-3xl font-bold text-green-600">
                {financialSummary.totalCommissions.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪
              </h3>
              <p className="text-sm text-gray-500 mt-2">من الطلبات المكتملة</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">طلبات سحب معلقة</p>
              <h3 className="text-3xl font-bold text-orange-600">{financialSummary.pendingPayouts}</h3>
              <p className="text-sm text-gray-500 mt-2">
                {financialSummary.pendingPayouts > 0 ? 'تحتاج إلى معالجة' : 'لا توجد طلبات معلقة'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">إجمالي المدفوعات</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {financialSummary.totalPayments.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪
              </h3>
              <p className="text-sm text-gray-500 mt-2">قيمة الطلبات المكتملة</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">الضرائب المحصلة</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {financialSummary.totalTaxes.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪
              </h3>
              <p className="text-sm text-gray-500 mt-2">16% من المدفوعات</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
            <div className="border-b border-gray-200">
              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'commissions'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                💰 تقرير العمولات
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'payouts'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                💰 طلبات السحب ({payouts.filter(p => p.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ⚙️ الإعدادات المالية
              </button>
            </div>

            <div className="p-6">
              {/* Commissions Tab */}
              {activeTab === 'commissions' && (
                <div>
                  {commissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البائع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الطلب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة العمولة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">قيمة العمولة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ربح البائع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commissions.map((commission, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <span className="font-medium text-indigo-600">
                                  #{commission.order_id}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-800">{commission.vendor_name}</td>
                              <td className="px-6 py-4 font-semibold text-gray-800">
                                {commission.order_total.toFixed(2)} ₪
                              </td>
                              <td className="px-6 py-4 text-gray-600">{commission.commission_rate}%</td>
                              <td className="px-6 py-4 font-bold text-green-600">
                                +{commission.commission_amount.toFixed(2)} ₪
                              </td>
                              <td className="px-6 py-4 text-gray-800">
                                {commission.vendor_earning.toFixed(2)} ₪
                              </td>
                              <td className="px-6 py-4 text-gray-600">{commission.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">💰</p>
                      <p>لا توجد عمولات محصلة بعد</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payouts Tab */}
              {activeTab === 'payouts' && (
                <div className="space-y-4">
                  {payouts.length > 0 ? (
                    payouts.map((payout) => (
                      <div key={payout.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 mr-[70px]">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-800">{payout.user_name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payout.user_role === 'vendor' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payout.user_role === 'vendor' ? 'بائع' : 'مندوب'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payout.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : payout.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {payout.status === 'pending' ? 'قيد الانتظار' : 
                               payout.status === 'processing' ? 'قيد المعالجة' : 
                               'مكتمل'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">المبلغ المطلوب:</p>
                              <p className="text-2xl font-bold text-green-600">{payout.amount} د.أ</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">البنك:</p>
                              <p className="font-semibold text-gray-800">{payout.bank_details.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">رقم الحساب:</p>
                              <p className="font-semibold text-gray-800">{payout.bank_details.account_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">اسم صاحب الحساب:</p>
                              <p className="font-semibold text-gray-800">{payout.bank_details.account_holder}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">تاريخ الطلب:</p>
                              <p className="font-semibold text-gray-800">{payout.requested_at}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {payout.status === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprovePayout(payout.id)}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            ✓ الموافقة والتحويل
                          </button>
                          <button
                            onClick={() => handleRejectPayout(payout.id)}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                          >
                            ✗ رفض الطلب
                          </button>
                        </div>
                      )}

                      {payout.status === 'processing' && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                          🔄 جاري معالجة الطلب...
                        </div>
                      )}
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">💳</p>
                      <p>لا توجد طلبات سحب بعد</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نسبة العمولة الافتراضية (%)
                      </label>
                      <input
                        type="number"
                        value={settings.default_commission_rate}
                        onChange={(e) => setSettings({...settings, default_commission_rate: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نسبة الضريبة (%)
                      </label>
                      <input
                        type="number"
                        value={settings.tax_rate}
                        onChange={(e) => setSettings({...settings, tax_rate: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الحد الأدنى للسحب (د.أ)
                      </label>
                      <input
                        type="number"
                        value={settings.min_payout_amount}
                        onChange={(e) => setSettings({...settings, min_payout_amount: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رسوم التوصيل الأساسية (د.أ)
                      </label>
                      <input
                        type="number"
                        value={settings.base_delivery_fee}
                        onChange={(e) => setSettings({...settings, base_delivery_fee: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رسوم التوصيل لكل كم (د.أ)
                      </label>
                      <input
                        type="number"
                        value={settings.per_km_delivery_fee}
                        onChange={(e) => setSettings({...settings, per_km_delivery_fee: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSettings ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



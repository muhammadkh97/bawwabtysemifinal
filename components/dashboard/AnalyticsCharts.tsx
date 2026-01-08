'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesData {
  day: string;
  sales: number;
  orders: number;
  revenue: number;
}

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const days = period === 'week' ? 7 : 30;
      const dates: SalesData[] = [];
      
      // جلب جميع الطلبات من قاعدة البيانات
      const { data: ordersData } = await supabase
        .from('orders')
        .select('created_at, total, status');
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        const dayName = date.toLocaleDateString('ar-SA', { weekday: 'short' });
        
        // تصفية الطلبات حسب اليوم
        const dayOrders = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayStart && orderDate <= dayEnd;
        }) || [];
        
        // حساب الإحصائيات
        const ordersCount = dayOrders.length;
        const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const salesCount = dayOrders.filter(o => o.status === 'delivered').length;
        
        dates.push({
          day: dayName,
          sales: salesCount,
          orders: ordersCount,
          revenue: Math.round(revenue)
        });
      }
      
      setData(dates);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: string }; name: string; value: number; color: string }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.95)', border: '1px solid rgba(98, 54, 255, 0.5)' }}>
          <p className="text-white font-bold mb-2">{payload[0].payload.day}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 rounded-3xl"
      style={{
        background: 'rgba(15, 10, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(98, 54, 255, 0.3)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            المبيعات
          </h3>
          <p className="text-gray-400 text-sm mt-1">تحليل المبيعات والإيرادات</p>
        </div>
        
        {/* فلتر الفترة */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-xl transition-all ${
              period === 'week'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            أسبوع
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-xl transition-all ${
              period === 'month'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            شهر
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6236FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6236FF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF219D" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF219D" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" stroke="#A78BFA" />
          <YAxis stroke="#A78BFA" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            name="الإيرادات (ر.س)" 
            stroke="#6236FF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
          <Area 
            type="monotone" 
            dataKey="orders" 
            name="الطلبات" 
            stroke="#FF219D" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorOrders)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersStatusChart() {
  const [data, setData] = useState([
    { name: 'قيد التنفيذ', value: 0, color: '#F59E0B' },
    { name: 'تم التوصيل', value: 0, color: '#10B981' },
    { name: 'ملغاة', value: 0, color: '#EF4444' },
    { name: 'جديدة', value: 0, color: '#6236FF' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrdersStatus();
  }, []);

  const fetchOrdersStatus = async () => {
    try {
      // جلب جميع الطلبات من قاعدة البيانات
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status');

      if (ordersData) {
        // حساب عدد الطلبات لكل حالة
        const pending = ordersData.filter(o => o.status === 'pending').length;
        const delivered = ordersData.filter(o => o.status === 'delivered').length;
        const cancelled = ordersData.filter(o => o.status === 'cancelled').length;
        const processing = ordersData.filter(o => o.status === 'processing').length;

        setData([
          { name: 'قيد التنفيذ', value: processing, color: '#F59E0B' },
          { name: 'تم التوصيل', value: delivered, color: '#10B981' },
          { name: 'ملغاة', value: cancelled, color: '#EF4444' },
          { name: 'جديدة', value: pending, color: '#6236FF' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching orders status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="p-6 rounded-3xl flex items-center justify-center h-96"
        style={{
          background: 'rgba(15, 10, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(98, 54, 255, 0.3)'
        }}
      >
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.95)', border: '1px solid rgba(98, 54, 255, 0.5)' }}>
          <p className="text-white font-bold">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color }}>{payload[0].value} طلب</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="p-6 rounded-3xl"
      style={{
        background: 'rgba(15, 10, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(98, 54, 255, 0.3)'
      }}
    >
      <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <Package className="w-6 h-6 text-purple-400" />
        حالة الطلبات
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.name} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-4 h-4 rounded-full" style={{ background: item.color }} />
            <div>
              <p className="text-white font-medium text-sm">{item.name}</p>
              <p className="text-gray-400 text-xs">{item.value} طلب</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopProductsChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      // جلب جميع عناصر الطلبات من قاعدة البيانات
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('product_id, quantity, products(name, name_ar)');

      if (orderItemsData) {
        // حساب عدد المبيعات لكل منتج
        const productSales: { [key: string]: { name: string; sales: number } } = {};

        orderItemsData.forEach(item => {
          const product = item.products as any;
          if (product && product.name) {
            const productName = product.name_ar || product.name;
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = { name: productName, sales: 0 };
            }
            productSales[item.product_id].sales += item.quantity;
          }
        });

        // تحويل إلى مصفوفة وترتيب حسب المبيعات
        const sortedProducts = Object.values(productSales)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5); // أفضل 5 منتجات

        setData(sortedProducts);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="p-6 rounded-3xl flex items-center justify-center h-96"
        style={{
          background: 'rgba(15, 10, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(98, 54, 255, 0.3)'
        }}
      >
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.95)', border: '1px solid rgba(98, 54, 255, 0.5)' }}>
          <p className="text-white font-bold">{payload[0].payload.name}</p>
          <p className="text-purple-400">{payload[0].value} مبيعات</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="p-6 rounded-3xl"
      style={{
        background: 'rgba(15, 10, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(98, 54, 255, 0.3)'
      }}
    >
      <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <DollarSign className="w-6 h-6 text-purple-400" />
        أكثر المنتجات مبيعاً
      </h3>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-purple-300">
          <Package className="w-16 h-16 mb-4 opacity-50" />
          <p>لا توجد مبيعات بعد</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#A78BFA" />
            <YAxis dataKey="name" type="category" stroke="#A78BFA" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" fill="url(#barGradient)" radius={[0, 10, 10, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6236FF" />
                <stop offset="100%" stopColor="#FF219D" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}


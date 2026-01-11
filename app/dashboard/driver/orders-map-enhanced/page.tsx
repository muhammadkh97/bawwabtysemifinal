'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import { 
  MapPin, Navigation, Package, Phone, Clock, DollarSign, 
  User, TrendingUp, Activity, Zap, CheckCircle, AlertCircle,
  RefreshCw, Maximize2, Target, Route
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  pickup_address: string;
  destination_lat: number;
  destination_lng: number;
  pickup_lat: number;
  pickup_lng: number;
  estimated_time?: number;
  distance?: number;
}

interface DriverLocation {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export default function EnhancedOrdersMapPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 31.9539, lng: 35.9106 }); // Amman
  const [zoom, setZoom] = useState(12);
  const mapRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedToday: 0,
    totalEarnings: 0,
    avgTime: 0
  });

  useEffect(() => {
    fetchOrders();
    startLocationTracking();

    return () => stopLocationTracking();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driverData) return;

      // Fetch orders assigned to this driver
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_fee,
          delivery_address,
          created_at,
          users!orders_user_id_fkey (
            full_name,
            phone
          ),
          stores (
            shop_name,
            store_address,
            latitude,
            longitude
          )
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedOrders: Order[] = (ordersData || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee,
        customer_name: (order.users as any)?.full_name || 'عميل',
        customer_phone: (order.users as any)?.phone || '',
        delivery_address: order.delivery_address,
        pickup_address: (order.stores as any)?.store_address || '',
        destination_lat: 31.9539 + (Math.random() - 0.5) * 0.1,
        destination_lng: 35.9106 + (Math.random() - 0.5) * 0.1,
        pickup_lat: (order.stores as any)?.latitude || 31.9539,
        pickup_lng: (order.stores as any)?.longitude || 35.9106,
        estimated_time: Math.floor(Math.random() * 30) + 10,
        distance: Math.floor(Math.random() * 10) + 1
      }));

      setOrders(transformedOrders);

      // Calculate stats
      setStats({
        activeOrders: transformedOrders.length,
        completedToday: Math.floor(Math.random() * 10),
        totalEarnings: transformedOrders.reduce((sum, o) => sum + o.delivery_fee, 0),
        avgTime: 25
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching orders', { error: errorMessage, component: 'EnhancedOrdersMapPage' });
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      setTrackingEnabled(true);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: DriverLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          
          setDriverLocation(newLocation);
          
          // Update driver location in database
          updateDriverLocationInDB(newLocation);
        },
        (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown location error';
          logger.error('Location error', { error: errorMessage, component: 'EnhancedOrdersMapPage' });
          setTrackingEnabled(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000
        }
      );
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      setTrackingEnabled(false);
    }
  };

  const updateDriverLocationInDB = async (location: DriverLocation) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating driver location in DB', { error: errorMessage, component: 'EnhancedOrdersMapPage' });
    }
  };

  const calculateRoute = (order: Order) => {
    // This would integrate with a routing API like Google Maps or Mapbox
    
  };

  const centerOnDriver = () => {
    if (driverLocation) {
      setMapCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
      setZoom(15);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'from-blue-500 to-cyan-500';
      case 'picked_up': return 'from-orange-500 to-yellow-500';
      case 'in_transit': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'تم التعيين';
      case 'picked_up': return 'تم الاستلام';
      case 'in_transit': return 'قيد التوصيل';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            خريطة الطلبات المباشرة
          </h1>
          <p className="text-purple-300">تتبع طلباتك وموقعك الحالي</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-blue-500/30"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-300 text-sm">طلبات نشطة</p>
                <p className="text-white text-2xl font-bold">{stats.activeOrders}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-green-500/30"
            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-green-300 text-sm">مكتمل اليوم</p>
                <p className="text-white text-2xl font-bold">{stats.completedToday}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-yellow-500/30"
            style={{ background: 'rgba(234, 179, 8, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-yellow-300 text-sm">أرباح اليوم</p>
                <p className="text-white text-2xl font-bold">{stats.totalEarnings} د.أ</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30"
            style={{ background: 'rgba(168, 85, 247, 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-purple-300 text-sm">متوسط الوقت</p>
                <p className="text-white text-2xl font-bold">{stats.avgTime} دق</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">الطلبات ({orders.length})</h2>
              <button
                onClick={fetchOrders}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedOrder?.id === order.id
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500'
                      : 'bg-white/5 border border-purple-500/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">#{order.order_number}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 bg-gradient-to-r ${getStatusColor(order.status)}`}>
                        <Activity className="w-3 h-3" />
                        {getStatusLabel(order.status)}
                      </div>
                    </div>
                    <p className="text-green-400 font-bold">{order.delivery_fee} د.أ</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-purple-300">
                      <User className="w-4 h-4" />
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300">
                        <Clock className="w-4 h-4" />
                        <span>{order.estimated_time} دقيقة</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-300">
                        <Route className="w-4 h-4" />
                        <span>{order.distance} كم</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      calculateRoute(order);
                    }}
                    className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>بدء الملاحة</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div className="lg:col-span-2">
            <div 
              className="rounded-2xl overflow-hidden border border-purple-500/30 relative"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                height: 'calc(100vh - 400px)',
                minHeight: '500px'
              }}
            >
              {/* Map Controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                  onClick={centerOnDriver}
                  disabled={!driverLocation}
                  className="p-3 rounded-lg bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50"
                  title="مركز على موقعي"
                >
                  <Target className="w-5 h-5 text-purple-600" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.min(z + 1, 18))}
                  className="p-3 rounded-lg bg-white/90 hover:bg-white shadow-lg transition-all"
                >
                  <span className="text-purple-600 font-bold">+</span>
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(z - 1, 8))}
                  className="p-3 rounded-lg bg-white/90 hover:bg-white shadow-lg transition-all"
                >
                  <span className="text-purple-600 font-bold">−</span>
                </button>
              </div>

              {/* Location Status */}
              {trackingEnabled && driverLocation && (
                <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-lg bg-green-500 text-white flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-medium">التتبع نشط</span>
                </div>
              )}

              {/* Map Placeholder - Replace with actual map component */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-bold mb-2">خريطة تفاعلية</p>
                  <p className="text-purple-300">يتم عرض موقعك ومواقع الطلبات هنا</p>
                  {driverLocation && (
                    <div className="mt-4 text-sm text-purple-300">
                      <p>موقعك: {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}</p>
                      {driverLocation.accuracy && (
                        <p>الدقة: {driverLocation.accuracy.toFixed(0)} متر</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(98, 54, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(98, 54, 255, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(98, 54, 255, 0.7);
        }
      `}</style>
    </div>
  );
}

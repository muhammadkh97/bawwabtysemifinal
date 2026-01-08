'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// دالة مساعدة لاستخراج رسائل الأخطاء
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'حدث خطأ غير متوقع';
}

// =====================================================
// 📦 Types & Interfaces
// =====================================================

export type BatchStatus = 
  | 'collecting'      // جمع الطلبات
  | 'ready'          // جاهزة للتوصيل
  | 'assigned'       // تم تعيين سائق
  | 'in_transit'     // قيد التوصيل
  | 'completed'      // مكتملة
  | 'cancelled';     // ملغاة

export interface DeliveryZone {
  id: string;
  name: string;
  name_ar: string;
  governorate: string;
  cities: string[];
  center_lat: number;
  center_lng: number;
  radius_km: number;
  delivery_fee: number;
  estimated_days: number;
  is_active: boolean;
}

export interface Driver {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  is_available: boolean;
  is_active: boolean;
  rating?: number;
  latitude?: number;
  longitude?: number;
  avatar_url?: string;
}

export interface PackageOrder {
  id: string;
  order_number: string;
  customer_id: string;
  vendor_id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  is_ready_for_pickup: boolean;
  pickup_time?: string;
  created_at: string;
  customer?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  vendor?: {
    id: string;
    shop_name: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface DeliveryPackage {
  id: string;
  batch_number: string;
  zone_id: string;
  driver_id?: string;
  status: BatchStatus;
  total_orders: number;
  total_amount: number;
  delivery_fee: number;
  scheduled_date: string;
  collection_deadline?: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  notes?: string;
  route?: any;
  created_at: string;
  updated_at: string;
  
  // Relations
  zone?: DeliveryZone;
  driver?: Driver;
  orders?: PackageOrder[];
}

export interface PackageStats {
  totalPackages: number;
  collectingPackages: number;
  readyPackages: number;
  assignedPackages: number;
  inTransitPackages: number;
  completedPackages: number;
  totalOrders: number;
  totalRevenue: number;
}

// =====================================================
// 📦 Context Interface
// =====================================================

interface DeliveryPackagesContextType {
  // State
  packages: DeliveryPackage[];
  zones: DeliveryZone[];
  drivers: Driver[];
  loading: boolean;
  stats: PackageStats;
  
  // Filters
  filterZone: string | null;
  filterStatus: BatchStatus | 'all';
  filterDate: string | null;
  setFilterZone: (zoneId: string | null) => void;
  setFilterStatus: (status: BatchStatus | 'all') => void;
  setFilterDate: (date: string | null) => void;
  
  // Actions
  fetchPackages: () => Promise<void>;
  fetchZones: () => Promise<void>;
  fetchDrivers: () => Promise<void>;
  getPackageById: (id: string) => Promise<DeliveryPackage | null>;
  createPackage: (data: {
    zone_id: string;
    scheduled_date: string;
    order_ids: string[];
  }) => Promise<DeliveryPackage | null>;
  updatePackageStatus: (packageId: string, status: BatchStatus) => Promise<boolean>;
  assignDriver: (packageId: string, driverId: string) => Promise<boolean>;
  removeOrderFromPackage: (packageId: string, orderId: string) => Promise<boolean>;
  addOrderToPackage: (packageId: string, orderId: string) => Promise<boolean>;
  cancelPackage: (packageId: string, reason?: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

// =====================================================
// 📦 Context Creation
// =====================================================

const DeliveryPackagesContext = createContext<DeliveryPackagesContextType | undefined>(undefined);

// =====================================================
// 📦 Provider Component
// =====================================================

export function DeliveryPackagesProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = useState<DeliveryPackage[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PackageStats>({
    totalPackages: 0,
    collectingPackages: 0,
    readyPackages: 0,
    assignedPackages: 0,
    inTransitPackages: 0,
    completedPackages: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  
  // Filters
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BatchStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string | null>(null);

  // =====================================================
  // 🔄 Fetch Packages
  // =====================================================
  
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('delivery_batches')
        .select(`
          *,
          zone:delivery_zones(
            id, name, name_ar, governorate, cities,
            center_lat, center_lng, radius_km,
            delivery_fee, estimated_days, is_active
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filterZone) {
        query = query.eq('zone_id', filterZone);
      }
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      if (filterDate) {
        query = query.eq('scheduled_date', filterDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch driver data separately for packages that have drivers
      const packagesWithDrivers = await Promise.all((data || []).map(async (pkg: any) => {
        let driverData = null;
        
        if (pkg.driver_id) {
          const { data: driver } = await supabase
            .from('drivers')
            .select('*, users(full_name, phone, avatar_url)')
            .eq('id', pkg.driver_id)
            .single();
          
          if (driver) {
            driverData = {
              ...driver,
              full_name: driver.users?.full_name,
              phone: driver.users?.phone,
              avatar_url: driver.users?.avatar_url,
            };
          }
        }
        
        return {
          ...pkg,
          zone: pkg.zone || undefined,
          driver: driverData || undefined,
        };
      }));
      
      const transformedPackages: DeliveryPackage[] = packagesWithDrivers;
      
      setPackages(transformedPackages);
      
      // Fetch orders for each package
      for (const pkg of transformedPackages) {
        await fetchPackageOrders(pkg.id);
      }
      
    } catch (error: unknown) {
      console.error('Error fetching packages:', error);
      toast.error('فشل في تحميل البكيجات');
    } finally {
      setLoading(false);
    }
  }, [filterZone, filterStatus, filterDate]);

  // =====================================================
  // 📦 Fetch Package Orders
  // =====================================================
  
  const fetchPackageOrders = async (packageId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, customer_id, vendor_id, status,
          total_amount, delivery_fee, delivery_address,
          delivery_lat, delivery_lng, is_ready_for_pickup,
          pickup_time, created_at,
          customer:users!orders_customer_id_fkey(id, full_name, phone),
          vendor:stores!orders_vendor_id_fkey(id, shop_name, latitude, longitude)
        `)
        .eq('batch_id', packageId);
      
      if (error) throw error;
      
      // Update package with orders
      setPackages(prev => prev.map(pkg => {
        if (pkg.id === packageId) {
          return {
            ...pkg,
            orders: (data || []).map((order: any) => ({
              ...order,
              customer: order.customer || undefined,
              vendor: order.vendor || undefined,
            })),
          };
        }
        return pkg;
      }));
      
    } catch (error) {
      console.error('Error fetching package orders:', error);
    }
  };

  // =====================================================
  // 🗺️ Fetch Zones
  // =====================================================
  
  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('فشل في تحميل المناطق');
    }
  }, []);

  // =====================================================
  // 🚗 Fetch Drivers
  // =====================================================
  
  const fetchDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          users!drivers_user_id_fkey(full_name, phone, avatar_url)
        `)
        .eq('is_active', true)
        .order('id');
      
      if (error) throw error;
      
      const transformedDrivers = (data || []).map((driver: any) => ({
        ...driver,
        full_name: driver.users?.full_name,
        phone: driver.users?.phone,
        avatar_url: driver.users?.avatar_url,
      }));
      
      setDrivers(transformedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('فشل في تحميل السائقين');
    }
  }, []);

  // =====================================================
  // 📊 Get Package By ID
  // =====================================================
  
  const getPackageById = async (id: string): Promise<DeliveryPackage | null> => {
    try {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select(`
          *,
          zone:delivery_zones(*),
          driver:drivers!delivery_batches_driver_id_fkey(
            *,
            users!drivers_user_id_fkey(full_name, phone, avatar_url)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const pkg: DeliveryPackage = {
        ...data,
        zone: data.zone,
        driver: data.driver ? {
          ...data.driver,
          full_name: data.driver.users?.full_name,
          phone: data.driver.users?.phone,
          avatar_url: data.driver.users?.avatar_url,
        } : undefined,
      };
      
      // Fetch orders
      await fetchPackageOrders(id);
      
      return pkg;
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('فشل في تحميل تفاصيل البكج');
      return null;
    }
  };

  // =====================================================
  // ✨ Create Package
  // =====================================================
  
  const createPackage = async (data: {
    zone_id: string;
    scheduled_date: string;
    order_ids: string[];
  }): Promise<DeliveryPackage | null> => {
    try {
      // Use the create_delivery_batch function
      const { data: batchData, error: batchError } = await supabase
        .rpc('create_delivery_batch', {
          p_zone_id: data.zone_id,
          p_scheduled_date: data.scheduled_date,
        });
      
      if (batchError) throw batchError;
      
      const batchId = batchData;
      
      // Assign orders to the batch
      if (data.order_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ batch_id: batchId })
          .in('id', data.order_ids);
        
        if (updateError) throw updateError;
      }
      
      // Update batch totals
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, delivery_fee')
        .eq('batch_id', batchId);
      
      if (orders) {
        const total_orders = orders.length;
        const total_amount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const delivery_fee = orders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
        
        await supabase
          .from('delivery_batches')
          .update({ total_orders, total_amount, delivery_fee })
          .eq('id', batchId);
      }
      
      toast.success('✅ تم إنشاء البكج بنجاح');
      
      await fetchPackages();
      
      return await getPackageById(batchId);
    } catch (error: unknown) {
      console.error('Error creating package:', error);
      toast.error('فشل في إنشاء البكج: ' + getErrorMessage(error));
      return null;
    }
  };

  // =====================================================
  // 🔄 Update Package Status
  // =====================================================
  
  const updatePackageStatus = async (packageId: string, status: BatchStatus): Promise<boolean> => {
    try {
      const updates: any = { status };
      
      if (status === 'in_transit') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('delivery_batches')
        .update(updates)
        .eq('id', packageId);
      
      if (error) throw error;
      
      toast.success('✅ تم تحديث حالة البكج');
      
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error('Error updating package status:', error);
      toast.error('فشل في تحديث حالة البكج');
      return false;
    }
  };

  // =====================================================
  // 🚗 Assign Driver
  // =====================================================
  
  const assignDriver = async (packageId: string, driverId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('delivery_batches')
        .update({
          driver_id: driverId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', packageId);
      
      if (error) throw error;
      
      toast.success('✅ تم تعيين السائق بنجاح');
      
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('فشل في تعيين السائق');
      return false;
    }
  };

  // =====================================================
  // ➕ Add Order to Package
  // =====================================================
  
  const addOrderToPackage = async (packageId: string, orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ batch_id: packageId })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Recalculate totals
      await recalculatePackageTotals(packageId);
      
      toast.success('✅ تم إضافة الطلب للبكج');
      
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('فشل في إضافة الطلب');
      return false;
    }
  };

  // =====================================================
  // ➖ Remove Order from Package
  // =====================================================
  
  const removeOrderFromPackage = async (packageId: string, orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ batch_id: null })
        .eq('id', orderId)
        .eq('batch_id', packageId);
      
      if (error) throw error;
      
      // Recalculate totals
      await recalculatePackageTotals(packageId);
      
      toast.success('✅ تم إزالة الطلب من البكج');
      
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error('Error removing order:', error);
      toast.error('فشل في إزالة الطلب');
      return false;
    }
  };

  // =====================================================
  // ❌ Cancel Package
  // =====================================================
  
  const cancelPackage = async (packageId: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('delivery_batches')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          notes: reason || 'تم الإلغاء',
        })
        .eq('id', packageId);
      
      if (error) throw error;
      
      // Remove all orders from this batch
      await supabase
        .from('orders')
        .update({ batch_id: null })
        .eq('batch_id', packageId);
      
      toast.success('✅ تم إلغاء البكج');
      
      await fetchPackages();
      
      return true;
    } catch (error) {
      console.error('Error cancelling package:', error);
      toast.error('فشل في إلغاء البكج');
      return false;
    }
  };

  // =====================================================
  // 🔢 Recalculate Package Totals
  // =====================================================
  
  const recalculatePackageTotals = async (packageId: string) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, delivery_fee')
      .eq('batch_id', packageId);
    
    if (orders) {
      const total_orders = orders.length;
      const total_amount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const delivery_fee = orders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
      
      await supabase
        .from('delivery_batches')
        .update({ total_orders, total_amount, delivery_fee })
        .eq('id', packageId);
    }
  };

  // =====================================================
  // 📊 Refresh Stats
  // =====================================================
  
  const refreshStats = async () => {
    try {
      const { data: allPackages } = await supabase
        .from('delivery_batches')
        .select('status, total_orders, total_amount');
      
      if (allPackages) {
        const newStats: PackageStats = {
          totalPackages: allPackages.length,
          collectingPackages: allPackages.filter(p => p.status === 'collecting').length,
          readyPackages: allPackages.filter(p => p.status === 'ready').length,
          assignedPackages: allPackages.filter(p => p.status === 'assigned').length,
          inTransitPackages: allPackages.filter(p => p.status === 'in_transit').length,
          completedPackages: allPackages.filter(p => p.status === 'completed').length,
          totalOrders: allPackages.reduce((sum, p) => sum + (p.total_orders || 0), 0),
          totalRevenue: allPackages.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        };
        
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  // =====================================================
  // 🎬 Initial Load
  // =====================================================
  
  useEffect(() => {
    fetchPackages();
    fetchZones();
    fetchDrivers();
    refreshStats();
  }, [fetchPackages, fetchZones, fetchDrivers]);

  // =====================================================
  // 🔄 Real-time Subscriptions
  // =====================================================
  
  useEffect(() => {
    const channel = supabase
      .channel('delivery_batches_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_batches' },
        () => {
          fetchPackages();
          refreshStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPackages]);

  // =====================================================
  // 📦 Context Value
  // =====================================================
  
  const value: DeliveryPackagesContextType = {
    packages,
    zones,
    drivers,
    loading,
    stats,
    filterZone,
    filterStatus,
    filterDate,
    setFilterZone,
    setFilterStatus,
    setFilterDate,
    fetchPackages,
    fetchZones,
    fetchDrivers,
    getPackageById,
    createPackage,
    updatePackageStatus,
    assignDriver,
    removeOrderFromPackage,
    addOrderToPackage,
    cancelPackage,
    refreshStats,
  };

  return (
    <DeliveryPackagesContext.Provider value={value}>
      {children}
    </DeliveryPackagesContext.Provider>
  );
}

// =====================================================
// 🪝 Custom Hook
// =====================================================

export function useDeliveryPackages() {
  const context = useContext(DeliveryPackagesContext);
  
  if (context === undefined) {
    throw new Error('useDeliveryPackages must be used within a DeliveryPackagesProvider');
  }
  
  return context;
}

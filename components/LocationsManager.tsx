'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit, Trash2, Star, Home, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

/**
 * Strict Types for Location Management
 * ✅ Prevents runtime crashes
 * ✅ Ensures data integrity for PostGIS
 */
export type LocationType = 'home' | 'work' | 'other';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserLocation {
  id: string;
  user_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  location: GeoJSONPoint;
  type: LocationType;
  is_default: boolean;
  created_at?: string;
}

interface FormData {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  type: LocationType;
  is_default: boolean;
}

interface LocationsManagerProps {
  userId: string;
}

const INITIAL_FORM_DATA: FormData = {
  name: 'منزل',
  address: '',
  lat: null,
  lng: null,
  type: 'home',
  is_default: false,
};

export default function LocationsManager({ userId }: LocationsManagerProps) {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UserLocation | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations((data as UserLocation[]) || []);
    } catch (error: any) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'فشل تحميل المواقع'
      
      logger.error('fetchLocations failed', {
        error: errorMessage,
        component: 'LocationsManager',
        userId,
      })
      toast.error('فشل تحميل المواقع');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLocations();
    }
  }, [userId, fetchLocations]);

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: data.display_name || prev.address,
          }));
          toast.success('تم تحديد موقعك بنجاح');
        } catch (error) {
          setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
          toast.error('تم تحديد الإحداثيات، فشل جلب العنوان الوصفي');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        const errorMessage = error.message || 'فشل الوصول للموقع. يرجى تفعيل الصلاحيات.'
        
        logger.error('handleGetCurrentLocation failed', {
          error: errorMessage,
          component: 'LocationsManager',
          errorCode: error.code,
        })
        toast.error('فشل الوصول للموقع. يرجى تفعيل الصلاحيات.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.lat === null || formData.lng === null) {
      toast.error('يرجى تحديد الموقع أولاً');
      return;
    }

    const payload = {
      name: formData.name,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      type: formData.type,
      is_default: formData.is_default,
      user_id: userId,
      location: {
        type: 'Point',
        coordinates: [formData.lng, formData.lat]
      }
    };
    
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('user_locations')
          .update(payload)
          .eq('id', editingLocation.id);
        if (error) throw error;
        toast.success('تم تحديث الموقع');
      } else {
        const { error } = await supabase
          .from('user_locations')
          .insert([payload]);
        if (error) throw error;
        toast.success('تم إضافة الموقع بنجاح');
      }

      await fetchLocations();
      setShowForm(false);
      setEditingLocation(null);
      setFormData(INITIAL_FORM_DATA);
    } catch (error: any) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء الحفظ'
      
      logger.error('handleSubmit failed', {
        error: errorMessage,
        component: 'LocationsManager',
        userId,
        isEditing: !!editingLocation,
      })
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموقع؟')) return;
    try {
      const { error } = await supabase.from('user_locations').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم الحذف');
      await fetchLocations();
    } catch (error: any) {
      toast.error('فشل الحذف');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Reset all to false first, then set target to true
      await supabase.from('user_locations').update({ is_default: false }).eq('user_id', userId);
      const { error } = await supabase.from('user_locations').update({ is_default: true }).eq('id', id);
      if (error) throw error;
      toast.success('تم التعيين كافتراضي');
      await fetchLocations();
    } catch (error: any) {
      toast.error('فشل التعيين كافتراضي');
    }
  };

  const getIconForType = (type: LocationType) => {
    switch (type) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
        <p className="text-gray-500">جاري تحميل مواقعك...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">مواقعي المحفوظة</h3>
        <button
          onClick={() => {
            setFormData(INITIAL_FORM_DATA);
            setEditingLocation(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          إضافة جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {locations.map((loc) => (
            <motion.div
              key={loc.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative p-5 rounded-3xl border-2 transition-all ${
                loc.is_default ? 'border-purple-500 bg-purple-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              {loc.is_default && (
                <div className="absolute -top-3 -right-2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  الافتراضي
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  loc.is_default ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {getIconForType(loc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{loc.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{loc.address}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {!loc.is_default && (
                  <button
                    onClick={() => handleSetDefault(loc.id)}
                    className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    تعيين كافتراضي
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingLocation(loc);
                    setFormData({
                      name: loc.name,
                      address: loc.address,
                      lat: loc.lat,
                      lng: loc.lng,
                      type: loc.type,
                      is_default: loc.is_default,
                    });
                    setShowForm(true);
                  }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {locations.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">لا توجد مواقع محفوظة بعد</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-6">
                  {editingLocation ? 'تعديل الموقع' : 'إضافة موقع جديد'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full py-4 bg-purple-50 text-purple-700 rounded-2xl font-bold hover:bg-purple-100 transition flex items-center justify-center gap-3 border-2 border-purple-100"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                    {gettingLocation ? 'جاري التحديد...' : 'استخدام موقعي الحالي'}
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-wider">الاسم</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all"
                        placeholder="مثلاً: المنزل"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-wider">النوع</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as LocationType })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all appearance-none"
                      >
                        <option value="home">منزل</option>
                        <option value="work">عمل</option>
                        <option value="other">آخر</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">العنوان التفصيلي</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all resize-none"
                      placeholder="الشارع، البناية، رقم الشقة..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-6 h-6 rounded-lg text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="is_default" className="text-sm font-bold text-gray-700 cursor-pointer">
                      تعيين كموقع افتراضي للتوصيل
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg"
                    >
                      {editingLocation ? 'حفظ التعديلات' : 'إضافة الموقع'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

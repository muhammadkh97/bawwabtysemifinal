'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Star, Home, Briefcase, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface UserLocation {
  id: string;
  user_id: string;
  name: string;  // بدلاً من title
  address: string;
  lat: number;   // بدلاً من latitude
  lng: number;   // بدلاً من longitude
  location?: any; // PostGIS point
  type?: string;  // نوع الموقع
  is_default: boolean;
}

interface LocationsManagerProps {
  userId: string;
}

export default function LocationsManager({ userId }: LocationsManagerProps) {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UserLocation | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: 'منزل',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    type: 'home',
    is_default: false,
  });

  useEffect(() => {
    fetchLocations();
  }, [userId]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setGettingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // استخدام OpenStreetMap Nominatim API للحصول على العنوان
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
            );
            const data = await response.json();

            if (data.address) {
              setFormData(prev => ({
                ...prev,
                lat: latitude,
                lng: longitude,
                address: data.display_name || '',
              }));
            }
          } catch (error) {
            console.error('Error getting address:', error);
            // حتى لو فشل الحصول على العنوان، احفظ الإحداثيات
            setFormData(prev => ({
              ...prev,
              lat: latitude,
              lng: longitude,
            }));
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('فشل الحصول على الموقع. تأكد من تفعيل خدمات الموقع.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('المتصفح لا يدعم تحديد الموقع');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('user_locations')
          .update(formData)
          .eq('id', editingLocation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_locations')
          .insert([{ ...formData, user_id: userId }]);

        if (error) throw error;
      }

      // إعادة تحميل المواقع
      await fetchLocations();
      
      // إغلاق النموذج وإعادة تعيينه
      setShowForm(false);
      setEditingLocation(null);
      setFormData({
        name: 'منزل',
        address: '',
        lat: null,
        lng: null,
        type: 'home',
        is_default: false,
      });
    } catch (error) {
      console.error('Error saving location:', error);
      alert('حدث خطأ أثناء حفظ الموقع');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموقع؟')) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('حدث خطأ أثناء حذف الموقع');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      await fetchLocations();
    } catch (error) {
      console.error('Error setting default:', error);
      alert('حدث خطأ أثناء تعيين الموقع الافتراضي');
    }
  };

  const getIconForTitle = (title: string) => {
    switch (title) {
      case 'منزل': return <Home className="w-5 h-5" />;
      case 'عمل': return <Briefcase className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">مواقعي المحفوظة</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingLocation(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة موقع جديد
        </button>
      </div>

      {/* قائمة المواقع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {locations.map((location) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white border-2 border-gray-200 rounded-2xl p-4 hover:shadow-lg transition"
            >
              {location.is_default && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  افتراضي
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                    {getIconForTitle(location.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{location.name}</h4>
                    <p className="text-sm text-gray-500">{location.type || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{location.address}</p>

              <div className="flex gap-2">
                {!location.is_default && (
                  <button
                    onClick={() => handleSetDefault(location.id)}
                    className="flex-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    جعله افتراضي
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingLocation(location);
                    setFormData({
                      name: location.name,
                      address: location.address,
                      lat: location.lat,
                      lng: location.lng,
                      type: location.type || 'home',
                      is_default: location.is_default,
                    });
                    setShowForm(true);
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="flex-1 text-xs px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {locations.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">لا توجد مواقع محفوظة</p>
            <p className="text-sm">أضف موقعك الأول الآن</p>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل الموقع */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">
                {editingLocation ? 'تعديل الموقع' : 'إضافة موقع جديد'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* زر تحديد الموقع الحالي */}
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Navigation className={`w-5 h-5 ${gettingLocation ? 'animate-spin' : ''}`} />
                  {gettingLocation ? 'جاري تحديد الموقع...' : 'تحديد موقعي الحالي'}
                </button>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع الموقع *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="home">🏠 منزل</option>
                      <option value="work">💼 عمل</option>
                      <option value="other">📍 آخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">اسم الموقع *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: منزلي، مكتبي..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">العنوان الكامل *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="العنوان التفصيلي..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">خط الطول</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat || ''}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      placeholder="Latitude"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">خط العرض</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng || ''}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      placeholder="Longitude"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_default" className="text-sm font-medium">
                    جعل هذا الموقع افتراضياً
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition"
                  >
                    {editingLocation ? 'حفظ التعديلات' : 'إضافة الموقع'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

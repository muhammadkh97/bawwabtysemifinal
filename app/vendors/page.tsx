'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Star, MapPin, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  store_name: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  rating: number;
  products_count?: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      setLoading(true);
      console.log('🔍 Fetching vendors...');
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching vendors:', error);
        throw error;
      }

      console.log('✅ Vendors fetched:', data?.length || 0);

      // Fetch product counts for each vendor
      const vendorsWithCounts = await Promise.all(
        (data || []).map(async (vendor) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id)
            .eq('is_active', true);

          return {
            ...vendor,
            products_count: count || 0
          };
        })
      );

      console.log('✅ Vendors with counts:', vendorsWithCounts);
      setVendors(vendorsWithCounts);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text mb-4">
              البائعون المميزون
            </h1>
            <p className="text-xl text-gray-600">اكتشف أفضل المتاجر الموثوقة</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-500 mb-4">لا يوجد بائعون متاحون حالياً</p>
              <p className="text-gray-400">سيتم إضافة متاجر جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendors.map((vendor) => {
                const logoUrl = vendor.logo_url;
                const description = vendor.description || 'متجر متنوع لجميع احتياجاتك';
                const city = vendor.city || 'فلسطين';

                return (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.id}`}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-center">
                      {logoUrl ? (
                        <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-white">
                          <img src={logoUrl} alt={vendor.store_name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-6xl mb-3">🏪</div>
                      )}
                      <h3 className="text-2xl font-bold text-white">{vendor.store_name}</h3>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{vendor.rating || 4.5}</span>
                            <span className="text-gray-500 text-sm">(قريباً)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="w-5 h-5" />
                          <span>{vendor.products_count || 0} منتج</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-5 h-5" />
                          <span>{city}</span>
                        </div>
                      </div>

                      <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl transition">
                        زيارة المتجر
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}


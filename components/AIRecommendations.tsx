'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Eye, ShoppingCart, Star, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  image_url: string;
  rating?: number;
  category?: string;
}

interface AIRecommendationsProps {
  userId: string;
  limit?: number;
  showHeader?: boolean;
}

export default function AIRecommendations({ 
  userId, 
  limit = 6,
  showHeader = true 
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState<'personalized' | 'trending' | 'similar'>('personalized');

  useEffect(() => {
    fetchRecommendations();
  }, [userId, recommendationType]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Get user's browsing history and purchases from ai_classifications
      const { data: userHistory } = await supabase
        .from('ai_classifications')
        .select('product_id, classification_type, confidence_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      let productIds: string[] = [];

      if (userHistory && userHistory.length > 0) {
        // Get user's favorite categories
        const categoryMap = new Map<string, number>();
        
        for (const record of userHistory) {
          const { data: product } = await supabase
            .from('products')
            .select('category')
            .eq('id', record.product_id)
            .single();
          
          if (product?.category) {
            categoryMap.set(
              product.category, 
              (categoryMap.get(product.category) || 0) + record.confidence_score
            );
          }
        }

        // Get top categories
        const topCategories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category);

        // Fetch products from favorite categories
        if (topCategories.length > 0) {
          const { data: categoryProducts } = await supabase
            .from('products')
            .select('*')
            .in('category', topCategories)
            .eq('is_active', true)
            .gt('stock', 0)
            .limit(limit);

          if (categoryProducts) {
            setRecommendations(categoryProducts);
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: Get trending products
      const { data: trendingProducts } = await supabase
        .from('products')
        .select(`
          *,
          order_items(count)
        `)
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (trendingProducts) {
        setRecommendations(trendingProducts);
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track interaction
  const trackInteraction = async (productId: string, interactionType: 'view' | 'click' | 'add_to_cart') => {
    try {
      await supabase.from('ai_classifications').insert({
        user_id: userId,
        product_id: productId,
        classification_type: interactionType,
        confidence_score: interactionType === 'add_to_cart' ? 1.0 : interactionType === 'click' ? 0.7 : 0.3,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'recommendations'
        }
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-purple-300">جاري تحميل التوصيات...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">توصيات مخصصة لك</h2>
              <p className="text-purple-300">بناءً على اهتماماتك ومشترياتك السابقة</p>
            </div>
          </div>

          {/* Recommendation Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setRecommendationType('personalized')}
              className={`px-4 py-2 rounded-lg transition-all ${
                recommendationType === 'personalized'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              مخصصة
            </button>
            <button
              onClick={() => setRecommendationType('trending')}
              className={`px-4 py-2 rounded-lg transition-all ${
                recommendationType === 'trending'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              رائجة
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
            onMouseEnter={() => trackInteraction(product.id, 'view')}
          >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image_url || '/placeholder-product.png'}
                alt={product.name_ar}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* AI Badge */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                توصية AI
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                {product.name_ar || product.name}
              </h3>
              
              {product.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-purple-300 text-sm">{product.rating.toFixed(1)}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-white">{product.price} د.أ</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/products/${product.id}`}
                  onClick={() => trackInteraction(product.id, 'click')}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <span>عرض التفاصيل</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => trackInteraction(product.id, 'add_to_cart')}
                  className="w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View More */}
      <div className="text-center">
        <Link
          href="/products?recommended=true"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 hover:text-white transition-all"
        >
          <span>عرض المزيد من التوصيات</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

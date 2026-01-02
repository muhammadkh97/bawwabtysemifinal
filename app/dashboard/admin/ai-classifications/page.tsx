// app/dashboard/admin/ai-classifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductReview {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  images: string[];
  
  current_category_ar: string;
  current_category_en: string;
  
  ai_suggested_category_ar: string | null;
  ai_suggested_category_en: string | null;
  
  ai_confidence_score: number;
  ai_analysis_text: string;
  ai_keywords: string[];
  review_reason: string;
  classification_status: string;
  
  shop_name: string;
  vendor_name: string;
  vendor_email: string;
  
  classified_at: string;
}

export default function AIClassificationsPage() {
  const [products, setProducts] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductReview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchProductsNeedReview();
  }, [filterStatus]);

  const fetchProductsNeedReview = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('v_products_need_classification_review')
        .select('*')
        .order('classified_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (classificationId: string, useAISuggestion: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_product_classification', {
        p_classification_id: classificationId,
        p_admin_id: userData.user.id,
        p_use_ai_suggestion: useAISuggestion,
        p_admin_notes: useAISuggestion ? 'تم قبول تصنيف AI' : 'تم قبول تصنيف البائع',
      });

      if (error) throw error;

      toast.success(useAISuggestion ? '✅ تم قبول تصنيف AI' : '✅ تم قبول تصنيف البائع');
      fetchProductsNeedReview();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('فشل الموافقة على التصنيف');
    }
  };

  const handleReject = async (classificationId: string, reason: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('reject_product_classification', {
        p_classification_id: classificationId,
        p_admin_id: userData.user.id,
        p_reason: reason,
      });

      if (error) throw error;

      toast.success('❌ تم رفض المنتج');
      fetchProductsNeedReview();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('فشل رفض المنتج');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'low-confidence' && product.ai_confidence_score < 70) ||
      (filterStatus === 'mismatch' && product.ai_suggested_category_ar !== product.current_category_ar);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0515] via-[#1a1625] to-[#0A0515] flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl">جاري تحليل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0515] via-[#1a1625] to-[#0A0515] p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-10 h-10 text-purple-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            التصنيف الذكي للمنتجات
          </h1>
        </div>
        <p className="text-gray-400">
          مراجعة المنتجات التي تحتاج تدقيق في التصنيف باستخدام الذكاء الاصطناعي
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={<AlertTriangle className="w-6 h-6" />}
          label="تحتاج مراجعة"
          value={products.length}
          color="orange"
        />
        <StatsCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="ثقة منخفضة (<70%)"
          value={products.filter((p) => p.ai_confidence_score < 70).length}
          color="red"
        />
        <StatsCard
          icon={<Brain className="w-6 h-6" />}
          label="اقتراح AI مختلف"
          value={products.filter((p) => p.ai_suggested_category_ar !== p.current_category_ar).length}
          color="purple"
        />
        <StatsCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="جاهزة للموافقة"
          value={products.filter((p) => p.ai_confidence_score >= 80).length}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج أو متجر..."
              className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">جميع المنتجات</option>
              <option value="low-confidence">ثقة منخفضة (&lt;70%)</option>
              <option value="mismatch">اختلاف في التصنيف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد منتجات تحتاج مراجعة</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductReviewCard
              key={product.id}
              product={product}
              onView={() => setSelectedProduct(product)}
            />
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${colors[color] || colors.purple} border backdrop-blur-sm rounded-2xl p-6`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-white/80">{icon}</div>
        <p className="text-gray-300 text-sm">{label}</p>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

// Product Review Card Component
function ProductReviewCard({ product, onView }: any) {
  const confidenceColor =
    product.ai_confidence_score >= 80
      ? 'text-green-400'
      : product.ai_confidence_score >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  const hasMismatch = product.ai_suggested_category_ar !== product.current_category_ar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Product Image */}
        <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name_ar}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-600 text-4xl">📦</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{product.name_ar}</h3>
              <p className="text-gray-400 text-sm">{product.shop_name}</p>
            </div>
            <div className={`text-2xl font-bold ${confidenceColor}`}>
              {product.ai_confidence_score}%
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-400 mb-1">تصنيف البائع</p>
              <p className="text-white font-medium">{product.current_category_ar}</p>
            </div>
            <div className={`${hasMismatch ? 'bg-purple-500/10 border-purple-500/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-3`}>
              <p className={`text-xs ${hasMismatch ? 'text-purple-400' : 'text-green-400'} mb-1`}>
                اقتراح AI {hasMismatch && '⚠️'}
              </p>
              <p className="text-white font-medium">
                {product.ai_suggested_category_ar || 'نفس التصنيف'}
              </p>
            </div>
          </div>

          {/* Keywords */}
          {product.ai_keywords && product.ai_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.ai_keywords.slice(0, 5).map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={onView}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
            مراجعة وتفعيل
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Review Modal Component
function ReviewModal({ product, onApprove, onReject, onClose }: any) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F172A] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{product.name_ar}</h2>
              <p className="text-gray-400">{product.shop_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Analysis */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-purple-400 mb-2">تحليل الذكاء الاصطناعي</h3>
            <p className="text-white mb-3">{product.ai_analysis_text}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">مستوى الثقة:</span>
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className={`h-full rounded-full ${
                    product.ai_confidence_score >= 80
                      ? 'bg-green-500'
                      : product.ai_confidence_score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${product.ai_confidence_score}%` }}
                />
              </div>
              <span className="text-white font-bold">{product.ai_confidence_score}%</span>
            </div>
          </div>

          {/* Categories Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-blue-400 font-bold mb-2">تصنيف البائع</h4>
              <p className="text-white text-lg">{product.current_category_ar}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <h4 className="text-purple-400 font-bold mb-2">اقتراح AI</h4>
              <p className="text-white text-lg">
                {product.ai_suggested_category_ar || 'نفس التصنيف'}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!showRejectForm ? (
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => onApprove(product.id, false)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition"
              >
                <CheckCircle className="w-5 h-5" />
                قبول تصنيف البائع
              </button>
              {product.ai_suggested_category_ar && (
                <button
                  onClick={() => onApprove(product.id, true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition"
                >
                  <Brain className="w-5 h-5" />
                  قبول اقتراح AI
                </button>
              )}
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition"
              >
                <XCircle className="w-5 h-5" />
                رفض المنتج
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 resize-none h-24"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => onReject(product.id, rejectReason)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-xl font-bold transition"
                >
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

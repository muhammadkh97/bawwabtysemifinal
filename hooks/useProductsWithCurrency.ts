import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  description: string;
  original_price: number;
  original_currency: string;
  converted_price: number;
  display_currency: string;
  sale_price: number | null;
  discount_percentage: number | null;
  image_url: string;
  category_id: string;
  store_id: string;
  stock: number;
  is_active: boolean;
}

export function useProductsWithCurrency() {
  const { selectedCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCurrency]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // استخدام الـ Function الجديدة للحصول على المنتجات بالعملة المحولة
      const { data, error: rpcError } = await supabase
        .rpc('get_products_by_currency', {
          p_currency: selectedCurrency
        });

      if (rpcError) {
        console.error('Error fetching products:', rpcError);
        setError(rpcError.message);
        
        // Fallback: جلب المنتجات بالطريقة العادية
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (fallbackError) throw fallbackError;
        
        // تحويل الأسعار يدوياً
        const productsWithConversion = fallbackData?.map(product => ({
          ...product,
          original_price: product.base_price || product.price,
          original_currency: product.base_currency || 'SAR',
          converted_price: convertPriceManually(
            product.base_price || product.price,
            product.base_currency || 'SAR',
            selectedCurrency
          ),
          display_currency: selectedCurrency
        })) || [];

        setProducts(productsWithConversion);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // دالة احتياطية لتحويل الأسعار (في حالة فشل الـ RPC)
  const convertPriceManually = (
    price: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    // أسعار الصرف الثابتة (نفس المستخدمة في SQL)
    const toUSD: { [key: string]: number } = {
      'USD': 1,
      'SAR': 3.75,
      'ILS': 3.65,
      'JOD': 1 / 1.41,
      'EGP': 49.5,
      'AED': 3.67,
      'KWD': 1 / 3.25,
      'BHD': 1 / 2.65,
      'OMR': 1 / 2.60,
      'QAR': 3.64,
    };

    // تحويل إلى USD أولاً
    const priceInUSD = price / (toUSD[fromCurrency] || 3.75);
    
    // تحويل من USD إلى العملة المطلوبة
    const finalPrice = priceInUSD * (toUSD[toCurrency] || 3.75);
    
    return Math.round(finalPrice * 100) / 100;
  };

  return { products, loading, error, refetch: fetchProducts };
}

// Hook للحصول على منتج واحد بالعملة الصحيحة
export function useProductWithCurrency(productId: string) {
  const { selectedCurrency } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, selectedCurrency]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب المنتج الأساسي
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // تحويل السعر باستخدام الـ RPC
      const { data: convertedPrice, error: conversionError } = await supabase
        .rpc('convert_price', {
          p_base_price: productData.base_price || productData.price,
          p_from_currency: productData.base_currency || 'SAR',
          p_to_currency: selectedCurrency
        });

      if (conversionError) {
        console.error('Error converting price:', conversionError);
      }

      setProduct({
        ...productData,
        original_price: productData.base_price || productData.price,
        original_currency: productData.base_currency || 'SAR',
        converted_price: convertedPrice || productData.price,
        display_currency: selectedCurrency
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { product, loading, error, refetch: fetchProduct };
}

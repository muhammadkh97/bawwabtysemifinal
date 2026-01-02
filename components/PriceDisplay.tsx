'use client';

import { useCurrency, CurrencyCode } from '@/contexts/CurrencyContext';

interface PriceDisplayProps {
  price: number;
  originalCurrency?: CurrencyCode;
  className?: string;
  showOriginalPrice?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PriceDisplay({ 
  price, 
  originalCurrency = 'SAR',
  className = '',
  showOriginalPrice = false,
  size = 'md'
}: PriceDisplayProps) {
  const { formatPrice, selectedCurrency, convertPrice } = useCurrency();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl sm:text-2xl'
  };

  const convertedPrice = convertPrice(price, originalCurrency);
  const formattedPrice = formatPrice(price, originalCurrency);

  return (
    <div className={`${className}`}>
      <span className={`font-bold ${sizeClasses[size]}`}>
        {formattedPrice}
      </span>
      {showOriginalPrice && selectedCurrency !== originalCurrency && (
        <span className="text-xs text-gray-500 mr-2">
          ({price.toFixed(2)} {originalCurrency})
        </span>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Search, 
  Check, 
  Package, 
  Sparkles,
  Smartphone,
  Shirt,
  Home,
  ShoppingBasket,
  UtensilsCrossed,
  Box,
  ChevronLeft
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_ar: string;
  icon?: string;
  requires_approval?: boolean;
  parent_id?: string;
  description_ar?: string;
}

interface PremiumCategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showApprovalBadge?: boolean;
}

const iconMap: { [key: string]: any } = {
  'Smartphone': Smartphone,
  'Shirt': Shirt,
  'Home': Home,
  'ShoppingBasket': ShoppingBasket,
  'Sparkles': Sparkles,
  'UtensilsCrossed': UtensilsCrossed,
  'Box': Box,
};

const categoryColors = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-yellow-500 to-orange-500',
];

export default function PremiumCategorySelect({
  categories,
  value,
  onChange,
  label = 'التصنيف',
  placeholder = 'اختر التصنيف',
  required = false,
  showApprovalBadge = true,
}: PremiumCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.id === value);

  // تصفية التصنيفات حسب البحث
  const filteredCategories = categories.filter(cat =>
    (cat.name_ar || cat.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تنظيم التصنيفات بشكل هرمي للعرض
  const hierarchicalCategories = useMemo(() => {
    if (searchQuery) return filteredCategories;
    
    const main = filteredCategories.filter(c => !c.parent_id);
    const result: (Category & { isSub?: boolean })[] = [];
    
    main.forEach(m => {
      result.push(m);
      const subs = filteredCategories.filter(s => s.parent_id === m.id);
      subs.forEach(s => {
        result.push({ ...s, isSub: true });
      });
    });
    
    return result;
  }, [filteredCategories, searchQuery]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getIcon = (iconName: string | undefined) => {
    const Icon = iconMap[iconName || 'Box'] || Box;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {label && (
        <label className="block text-purple-300 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 rounded-xl text-white bg-white/5 border transition-all duration-300 flex items-center justify-between group ${
          isOpen ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-purple-500/30 hover:border-purple-500/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedCategory ? (
            <>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[Math.abs(selectedCategory.id.charCodeAt(0) % categoryColors.length)]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {getIcon(selectedCategory.icon)}
              </div>
              <div className="text-right">
                <span className="font-medium">{selectedCategory.name_ar || selectedCategory.name}</span>
                {showApprovalBadge && selectedCategory.requires_approval && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">يحتاج موافقة</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-purple-300/60">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[9999] w-full mt-2 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 bg-[#0F0A1E]/95 backdrop-blur-xl"
          >
            <div className="p-3 border-b border-purple-500/20">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن تصنيف..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-lg text-white bg-white/5 border border-purple-500/20 focus:border-purple-500/50 outline-none transition text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
              {hierarchicalCategories.length > 0 ? (
                hierarchicalCategories.map((category, index) => {
                  const isSelected = category.id === value;
                  const colorIndex = Math.abs(category.id.charCodeAt(0) % categoryColors.length);
                  const isSub = (category as any).isSub;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelect(category.id)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 mb-1 group ${
                        isSub ? 'mr-6 w-[calc(100%-1.5rem)]' : ''
                      } ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {!isSub ? (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[colorIndex]} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                          {getIcon(category.icon)}
                        </div>
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-purple-500/50" />
                      )}
                      
                      <div className="flex-1 text-right">
                        <div className={`font-bold ${isSelected ? 'text-white' : 'text-purple-100'} flex items-center gap-2`}>
                          {category.name_ar || category.name}
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        {!isSub && category.description_ar && (
                          <p className="text-[10px] text-purple-300/40 line-clamp-1">{category.description_ar}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                  <p className="text-purple-300/60 text-sm">لا توجد نتائج</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

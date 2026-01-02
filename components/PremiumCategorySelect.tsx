'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Package, Check, Sparkles, ShoppingBag, Home, Shirt, Laptop, Heart, Baby, Book, Dumbbell, Coffee, Gamepad2, Music, Camera, Watch, Gift, Palette, Wrench, Car, Pill, Flower2, PawPrint, Globe, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  name_ar: string;
  icon?: string;
  requires_approval?: boolean;
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

// أيقونات التصنيفات الافتراضية
const categoryIcons: { [key: string]: any } = {
  'إلكترونيات': Laptop,
  'إلكترونيات وأجهزة': Laptop,
  'أزياء': Shirt,
  'أزياء وملابس': Shirt,
  'منزل': Home,
  'منزل وديكور': Home,
  'جمال': Heart,
  'جمال وعناية': Heart,
  'أطفال': Baby,
  'كتب': Book,
  'رياضة': Dumbbell,
  'طعام': Coffee,
  'ألعاب': Gamepad2,
  'موسيقى': Music,
  'كاميرات': Camera,
  'ساعات': Watch,
  'هدايا': Gift,
  'فنون': Palette,
  'أدوات': Wrench,
  'سيارات': Car,
  'صحة': Pill,
  'نباتات': Flower2,
  'حيوانات': PawPrint,
  'سفر': Globe,
  'تسوق': Tag,
};

const getIconForCategory = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  for (const [key, Icon] of Object.entries(categoryIcons)) {
    if (name.includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return Package; // الأيقونة الافتراضية
};

// ألوان التصنيفات
const categoryColors = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-yellow-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-green-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500',
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

  const SelectedIcon = selectedCategory ? getIconForCategory(selectedCategory.name_ar || selectedCategory.name) : Package;
  const selectedColorIndex = selectedCategory ? Math.abs(selectedCategory.id.charCodeAt(0) % categoryColors.length) : 0;

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-purple-300 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 rounded-xl text-white bg-white/5 border border-purple-500/30 hover:border-purple-500/50 focus:border-purple-500 outline-none transition-all duration-300 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          {selectedCategory ? (
            <>
              {/* أيقونة التصنيف مع خلفية ملونة */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[selectedColorIndex]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <SelectedIcon className="w-5 h-5 text-white" />
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

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] w-full mt-2 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(15, 10, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            {/* Search Box */}
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

            {/* Categories List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {filteredCategories.length > 0 ? (
                <div className="p-2">
                  {filteredCategories.map((category, index) => {
                    const Icon = getIconForCategory(category.name_ar || category.name);
                    const colorIndex = Math.abs(category.id.charCodeAt(0) % categoryColors.length);
                    const isSelected = category.id === value;

                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelect(category.id)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 mb-1 group/item ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg scale-[1.02]'
                            : 'hover:bg-white/5 hover:scale-[1.01]'
                        }`}
                      >
                        {/* أيقونة التصنيف */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[colorIndex]} flex items-center justify-center shadow-md group-hover/item:scale-110 transition-transform duration-300 ${isSelected ? 'ring-2 ring-white/30' : ''}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* معلومات التصنيف */}
                        <div className="flex-1 text-right">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {category.name_ar || category.name}
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          {showApprovalBadge && category.requires_approval && (
                            <div className="flex items-center gap-1 mt-1">
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              <span className="text-xs text-yellow-300">يحتاج موافقة الإدارة</span>
                            </div>
                          )}
                        </div>

                        {/* Hover Effect */}
                        {!isSelected && (
                          <div className="w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                  <p className="text-purple-300/60 text-sm">لا توجد تصنيفات مطابقة</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

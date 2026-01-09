# 🎯 تحسينات صفحة التسجيل - خطة التنفيذ

**التاريخ:** 10 يناير 2026  
**الملف:** `app/auth/register/page.tsx`  
**الحالة:** جاهز للتطبيق

---

## 📋 الميزات المطلوبة

### 1️⃣ مؤشر الخطوات ✅

**الإضافة:**
```tsx
// مكون مؤشر التقدم
const StepProgress = () => {
  const totalSteps = userType === 'customer' ? 2 : 3;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step < currentStep ? 'bg-green-500' :
                step === currentStep ? 'bg-purple-600' : 'bg-gray-600'
              }`}>
                {step < currentStep ? <Check /> : step}
              </div>
              <span className="text-xs mt-2">
                {step === 1 && 'نوع الحساب'}
                {step === 2 && 'معلوماتك'}
                {step === 3 && 'وثائق'}
              </span>
            </div>
            {step < totalSteps && <div className={`h-1 flex-1`} />}
          </div>
        ))}
      </div>
      <p className="text-center mt-4 text-sm">
        الخطوة {currentStep} من {totalSteps}
      </p>
    </div>
  );
};
```

**المكان:** بعد Header مباشرة

---

### 2️⃣ معلومات تفصيلية لكل نوع حساب ✅

**البيانات:**
```tsx
const accountDetails = {
  customer: {
    benefits: [
      'تسوق من آلاف المنتجات',
      'نقاط ولاء ومكافآت',
      'طلب من مطاعم متعددة',
      'تتبع الطلبات مباشرة'
    ],
    stats: { users: '50K+', rating: '4.8' }
  },
  vendor: {
    benefits: [
      'وصول لآلاف العملاء',
      'أدوات تسويق مجانية',
      'سحب أرباح أسبوعي',
      'تدريب مجاني'
    ],
    stats: { vendors: '2K+', earnings: '5K دينار' }
  },
  restaurant: {
    benefits: [
      'زيادة المبيعات 3× أضعاف',
      'توصيل مجاني للمطعم',
      'دعم فني مخصص',
      'ترويج مجاني'
    ],
    stats: { restaurants: '500+', orders: '100K+' }
  },
  driver: {
    benefits: [
      'ربح حتى 1500 دينار شهرياً',
      'اختر أوقات عملك',
      'بونص على كل توصيلة',
      'وقود مدعوم'
    ],
    stats: { drivers: '1K+', income: '1200 دينار' }
  }
};
```

**العرض:**
```tsx
{userType && (
  <div className="mb-6 p-6 rounded-xl bg-white/5">
    <h3 className="text-lg font-bold mb-4">ما الذي تحصل عليه:</h3>
    <div className="grid grid-cols-2 gap-3">
      {accountDetails[userType].benefits.map((benefit) => (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm">{benefit}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### 3️⃣ مقارنة بين الحسابات ✅

**المكون:**
```tsx
const [showComparison, setShowComparison] = useState(false);

// زر المقارنة
<button onClick={() => setShowComparison(!showComparison)}>
  مقارنة الحسابات
</button>

// جدول المقارنة
{showComparison && (
  <div className="p-6 rounded-xl bg-white/5">
    <table className="w-full">
      <thead>
        <tr>
          <th>الميزة</th>
          <th>مشتري</th>
          <th>بائع</th>
          <th>مطعم</th>
          <th>مندوب</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>تسوق من المنصة</td>
          <td><Check /></td>
          <td><Check /></td>
          <td><Check /></td>
          <td><Check /></td>
        </tr>
        <tr>
          <td>بيع المنتجات</td>
          <td><X /></td>
          <td><Check /></td>
          <td><Check /></td>
          <td><X /></td>
        </tr>
        {/* ... المزيد */}
      </tbody>
    </table>
  </div>
)}
```

---

### 4️⃣ أسئلة شائعة ✅

**البيانات:**
```tsx
const faq = [
  {
    q: 'ما الفرق بين البائع والمطعم؟',
    a: 'البائع للمنتجات العامة بعمولة 10%، المطعم للطعام بعمولة 12%'
  },
  {
    q: 'كم يستغرق الحصول على الموافقة؟',
    a: 'العملاء: فوري. البائعين: 24 ساعة. المطاعم: 48 ساعة'
  },
  {
    q: 'هل يمكن التبديل بين الحسابات؟',
    a: 'نعم! يمكنك امتلاك أكثر من نوع حساب'
  },
  {
    q: 'ما هي عمولة المنصة؟',
    a: 'البائعين 10%، المطاعم 12%، المناديب لا عمولة'
  },
  {
    q: 'هل التسجيل مجاني؟',
    a: 'نعم 100% مجاني بدون رسوم خفية'
  },
  {
    q: 'كيف أستلم أرباحي؟',
    a: 'تحويل بنكي أسبوعي خلال 24 ساعة'
  }
];
```

**العرض:**
```tsx
const [showFAQ, setShowFAQ] = useState(false);
const [openFAQ, setOpenFAQ] = useState<number | null>(null);

<button onClick={() => setShowFAQ(!showFAQ)}>
  أسئلة شائعة
</button>

{showFAQ && (
  <div className="space-y-3">
    {faq.map((item, i) => (
      <div key={i} className="border rounded-lg">
        <button 
          onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
          className="w-full p-4 flex justify-between"
        >
          <span>{item.q}</span>
          {openFAQ === i ? <ChevronUp /> : <ChevronDown />}
        </button>
        {openFAQ === i && (
          <div className="p-4 pt-0">{item.a}</div>
        )}
      </div>
    ))}
  </div>
)}
```

---

## 🎨 تحسينات التصميم

### Badges للحسابات:
```tsx
{
  type: 'customer',
  badge: 'الأكثر شيوعاً',
  color: 'from-blue-500 to-cyan-500'
},
{
  type: 'vendor',
  badge: 'عمولة 10%',
  color: 'from-purple-500 to-pink-500'
},
{
  type: 'restaurant',
  badge: 'عمولة 12%',
  color: 'from-orange-500 to-red-500'
},
{
  type: 'driver',
  badge: 'دخل مرتفع',
  color: 'from-green-500 to-emerald-500'
}
```

### إحصائيات:
```tsx
<div className="flex items-center gap-4 text-xs">
  <div className="flex items-center gap-1">
    <Users className="w-3 h-3" />
    <span>{stats.users}</span>
  </div>
</div>
```

---

## 📍 أماكن الإضافة

### 1. في البداية (بعد imports):
```tsx
// إضافة الأيقونات الجديدة
import { 
  Check, X, HelpCircle, ChevronDown, ChevronUp, 
  Zap, TrendingUp, Users, Package 
} from 'lucide-react';

// البيانات الجديدة
const accountDetails = { /* ... */ };
const faq = [ /* ... */ ];
```

### 2. في State:
```tsx
const [currentStep, setCurrentStep] = useState(1);
const [showComparison, setShowComparison] = useState(false);
const [showFAQ, setShowFAQ] = useState(false);
const [openFAQ, setOpenFAQ] = useState<number | null>(null);
```

### 3. بعد Header:
```tsx
<StepProgress />
```

### 4. في Step 1 (بعد اختيار النوع):
```tsx
{/* Account Benefits */}
{userType && <AccountBenefits />}

{/* Quick Actions */}
<div className="flex gap-3">
  <button onClick={() => setShowComparison(!showComparison)}>
    مقارنة الحسابات
  </button>
  <button onClick={() => setShowFAQ(!showFAQ)}>
    أسئلة شائعة
  </button>
</div>

{/* Comparison Table */}
{showComparison && <ComparisonTable />}

{/* FAQ Section */}
{showFAQ && <FAQSection />}
```

---

## ✅ الخلاصة

**جميع الميزات المطلوبة:**
1. ✅ مؤشر خطوات (1 من X)
2. ✅ معلومات تفصيلية لكل حساب
3. ✅ مقارنة شاملة بين الحسابات
4. ✅ أسئلة شائعة (6 أسئلة)
5. ✅ Badges و إحصائيات
6. ✅ تصميم احترافي

**نفس مستوى صفحة تسجيل الدخول:**
- ✅ Framer Motion animations
- ✅ تدرجات لونية
- ✅ تصميم responsive
- ✅ تجربة مستخدم ممتازة

---

**هل تريدني تطبيق هذه التحسينات في الملف الأصلي؟** 🚀

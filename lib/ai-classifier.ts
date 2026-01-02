// ==========================================
// AI Product Classifier
// محرك التصنيف الذكي للمنتجات
// ==========================================

interface ProductData {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en?: string;
  images?: string[];
  vendor_category_id: string;
  price: number;
}

interface ClassificationResult {
  suggestedCategoryId: string | null;
  suggestedSubcategory: string | null;
  confidence: number; // 0-100
  analysis: string;
  keywords: string[];
  imageAnalysis?: string;
  needsReview: boolean;
  reviewReason?: string;
}

// ==========================================
// تصنيف باستخدام OpenAI GPT-4
// ==========================================
export async function classifyProductWithOpenAI(
  productData: ProductData,
  availableCategories: { id: string; name_ar: string; name_en: string }[]
): Promise<ClassificationResult> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not found, using fallback');
      return fallbackClassification(productData, availableCategories);
    }

    // بناء الـ prompt
    const prompt = buildClassificationPrompt(productData, availableCategories);

    // استدعاء OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في تصنيف المنتجات. مهمتك تحليل المنتج وتحديد التصنيف الأنسب له بناءً على الاسم والوصف.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      suggestedCategoryId: result.category_id,
      suggestedSubcategory: result.subcategory,
      confidence: result.confidence,
      analysis: result.analysis,
      keywords: result.keywords || [],
      needsReview: result.confidence < 70 || result.suspicious,
      reviewReason: result.review_reason,
    };
  } catch (error) {
    console.error('❌ OpenAI classification failed:', error);
    return fallbackClassification(productData, availableCategories);
  }
}

// ==========================================
// تصنيف باستخدام Claude 3.5 Sonnet
// ==========================================
export async function classifyProductWithClaude(
  productData: ProductData,
  availableCategories: { id: string; name_ar: string; name_en: string }[]
): Promise<ClassificationResult> {
  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.warn('⚠️ ANTHROPIC_API_KEY not found, using fallback');
      return fallbackClassification(productData, availableCategories);
    }

    const prompt = buildClassificationPrompt(productData, availableCategories);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.content[0].text);

    return {
      suggestedCategoryId: result.category_id,
      suggestedSubcategory: result.subcategory,
      confidence: result.confidence,
      analysis: result.analysis,
      keywords: result.keywords || [],
      needsReview: result.confidence < 70 || result.suspicious,
      reviewReason: result.review_reason,
    };
  } catch (error) {
    console.error('❌ Claude classification failed:', error);
    return fallbackClassification(productData, availableCategories);
  }
}

// ==========================================
// بناء الـ prompt للتصنيف
// ==========================================
function buildClassificationPrompt(
  productData: ProductData,
  availableCategories: { id: string; name_ar: string; name_en: string }[]
): string {
  const categoriesText = availableCategories
    .map((cat) => `- ${cat.id}: ${cat.name_ar} (${cat.name_en})`)
    .join('\n');

  return `
قم بتحليل المنتج التالي وتحديد التصنيف الأنسب له:

**معلومات المنتج:**
- الاسم بالعربية: ${productData.name_ar}
- الاسم بالإنجليزية: ${productData.name_en}
- الوصف: ${productData.description_ar}
- السعر: ${productData.price} ريال

**التصنيفات المتاحة:**
${categoriesText}

**التصنيف المختار من البائع:** ${productData.vendor_category_id}

**المطلوب منك:**
1. تحليل المنتج بناءً على الاسم والوصف
2. تحديد التصنيف الأنسب من القائمة المتاحة
3. استخراج الكلمات المفتاحية
4. تحديد مدى الثقة في التصنيف (0-100%)
5. اكتشاف أي محاولات تحايل (مثل: وضع منتج في تصنيف خاطئ للظهور أكثر)

**أمثلة على التحايل:**
- وضع ملابس في تصنيف "إلكترونيات" للحصول على رواج أكبر
- وضع منتج عادي في "عروض خاصة" بدون مبرر
- استخدام كلمات مفتاحية لا علاقة لها بالمنتج

**أرجع النتيجة بصيغة JSON فقط:**
{
  "category_id": "UUID للتصنيف المناسب",
  "subcategory": "اسم التصنيف الفرعي إن وُجد",
  "confidence": 85,
  "analysis": "تحليل مختصر لسبب اختيار هذا التصنيف",
  "keywords": ["كلمة1", "كلمة2", "..."],
  "suspicious": false,
  "review_reason": "السبب إذا كان مشبوهاً"
}

**ملاحظات:**
- إذا كان التصنيف المختار من البائع صحيح، استخدم نفس category_id
- إذا كان confidence أقل من 70%، ضع suspicious = true
- إذا وجدت محاولة تحايل واضحة، ضع suspicious = true وأوضح السبب
`;
}

// ==========================================
// تصنيف احتياطي (بدون AI)
// ==========================================
function fallbackClassification(
  productData: ProductData,
  availableCategories: { id: string; name_ar: string; name_en: string }[]
): ClassificationResult {
  // استخراج كلمات مفتاحية بسيطة
  const text = `${productData.name_ar} ${productData.description_ar}`.toLowerCase();
  const keywords = extractKeywords(text);

  // تصنيف بسيط بناءً على الكلمات المفتاحية
  let suggestedCategory = null;
  let confidence = 50;

  // قواعد بسيطة للتصنيف
  const rules: { [key: string]: string[] } = {
    'إلكترونيات': ['موبايل', 'هاتف', 'لابتوب', 'كمبيوتر', 'تلفزيون', 'سماعات', 'شاحن'],
    'ملابس': ['قميص', 'بنطلون', 'فستان', 'حذاء', 'جزمة', 'بدلة', 'عباية'],
    'طعام': ['أكل', 'طعام', 'مطعم', 'وجبة', 'بيتزا', 'برجر', 'شاورما'],
    'أثاث': ['كرسي', 'طاولة', 'سرير', 'خزانة', 'مكتب', 'أريكة'],
  };

  for (const [categoryName, ruleKeywords] of Object.entries(rules)) {
    const matchCount = ruleKeywords.filter((kw) => text.includes(kw)).length;
    
    if (matchCount > 0) {
      const category = availableCategories.find(
        (cat) => cat.name_ar.includes(categoryName) || cat.name_en.toLowerCase().includes(categoryName.toLowerCase())
      );
      
      if (category) {
        suggestedCategory = category.id;
        confidence = Math.min(50 + matchCount * 10, 85);
        break;
      }
    }
  }

  return {
    suggestedCategoryId: suggestedCategory,
    suggestedSubcategory: null,
    confidence,
    analysis: 'تصنيف تلقائي بسيط (AI غير متوفر)',
    keywords,
    needsReview: confidence < 70,
    reviewReason: confidence < 70 ? 'ثقة منخفضة في التصنيف' : undefined,
  };
}

// ==========================================
// استخراج كلمات مفتاحية
// ==========================================
function extractKeywords(text: string): string[] {
  // كلمات توقف شائعة بالعربية
  const stopWords = [
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هو', 'هي', 'هم',
    'الذي', 'التي', 'هذا', 'هذه', 'ذلك', 'تلك', 'كان', 'يكون',
  ];

  // تقسيم النص وفلترة
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 2 && !stopWords.includes(w));

  // أخذ أكثر 10 كلمات تكراراً
  const frequency: { [key: string]: number } = {};
  words.forEach((w) => {
    frequency[w] = (frequency[w] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((entry) => entry[0]);
}

// ==========================================
// تحليل الصور (Computer Vision)
// ==========================================
export async function analyzeProductImages(imageUrls: string[]): Promise<string> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY || !imageUrls || imageUrls.length === 0) {
      return 'لا توجد صور للتحليل';
    }

    // استخدام GPT-4 Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'حلل هذه الصورة للمنتج وأخبرني: ما نوع المنتج؟ ما التصنيف الأنسب له؟ هل هناك أي شيء مريب في الصورة؟',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrls[0],
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Image analysis failed:', error);
    return 'فشل تحليل الصورة';
  }
}

// ==========================================
// الدالة الرئيسية للتصنيف
// ==========================================
export async function classifyProduct(
  productData: ProductData,
  availableCategories: { id: string; name_ar: string; name_en: string }[],
  provider: 'openai' | 'claude' | 'fallback' = 'openai'
): Promise<ClassificationResult> {
  console.log('🤖 Starting AI classification...');

  let result: ClassificationResult;

  // اختيار مزود AI
  if (provider === 'openai') {
    result = await classifyProductWithOpenAI(productData, availableCategories);
  } else if (provider === 'claude') {
    result = await classifyProductWithClaude(productData, availableCategories);
  } else {
    result = fallbackClassification(productData, availableCategories);
  }

  // تحليل الصور إذا كانت متوفرة
  if (productData.images && productData.images.length > 0) {
    result.imageAnalysis = await analyzeProductImages(productData.images);
  }

  console.log('✅ AI classification completed:', {
    confidence: result.confidence,
    needsReview: result.needsReview,
  });

  return result;
}

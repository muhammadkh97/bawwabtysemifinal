import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">من نحن</h1>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              بوابتي هو متجرك الإلكتروني المتعدد البائعين الموثوق في فلسطين. نفخر بتقديم تجربة تسوق استثنائية تجمع بين الجودة والأسعار التنافسية والخدمة الممتازة.
            </p>
            
            <h2 className="text-2xl font-bold mb-4">رؤيتنا</h2>
            <p className="text-gray-700 mb-6">
              أن نكون المنصة الإلكترونية الأولى في فلسطين والمنطقة، نربط المشترين بأفضل البائعين ونوفر تجربة تسوق سهلة وموثوقة.
            </p>
            
            <h2 className="text-2xl font-bold mb-4">مهمتنا</h2>
            <p className="text-gray-700 mb-6">
              نعمل على توفير منصة متكاملة تمكّن البائعين من عرض منتجاتهم وتمكّن المشترين من الوصول إلى آلاف المنتجات عالية الجودة بأفضل الأسعار.
            </p>
            
            <h2 className="text-2xl font-bold mb-4">لماذا بوابتي؟</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>آلاف المنتجات من بائعين موثوقين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>أسعار تنافسية وعروض مستمرة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>شحن سريع وآمن في جميع أنحاء فلسطين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>خدمة عملاء متميزة على مدار الساعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span>دفع آمن ومضمون</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}


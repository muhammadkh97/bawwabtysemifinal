import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-8 sm:py-12 md:py-16 lg:py-20 -z-10" style={{ background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)' }}>
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-20 -z-10">
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-32 sm:w-48 md:w-72 h-32 sm:h-48 md:h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-40 sm:w-64 md:w-96 h-40 sm:h-64 md:h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative z-0">
        <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-12">
          {/* Text Content */}
          <div className="flex-1 text-white max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight">
              مرحباً بك في بوابتي 🛍️
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-purple-100 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
              تسوق من آلاف المنتجات عالية الجودة بأفضل الأسعار مع شحن سريع وآمن
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <Link
                href="/products"
                className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-white text-purple-600 rounded-lg sm:rounded-xl hover:bg-yellow-300 hover:text-purple-700 transition-all font-bold text-sm sm:text-base md:text-lg shadow-2xl transform hover:scale-105 text-center"
                style={{ color: '#6236FF' }}
              >
                تسوق الآن
              </Link>
              <Link
                href="/about"
                className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-white text-white rounded-lg sm:rounded-xl hover:bg-white/10 backdrop-blur transition-all font-bold text-sm sm:text-base md:text-lg text-center"
              >
                اعرف المزيد
              </Link>
            </div>
          </div>

          {/* مستطيل فارغ - للحفاظ على التوزيع - Hidden on tablet and below */}
          <div className="flex-1 hidden xl:block">
            <div className="relative w-full h-[400px]">
              {/* محتوى مخفي للحفاظ على المساحة */}
              <div className="text-center invisible">
                <div className="text-8xl mb-4">🛍️</div>
                <h3 className="text-3xl font-bold mb-2">عروض حصرية</h3>
                <p className="text-xl">خصومات تصل إلى 50%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


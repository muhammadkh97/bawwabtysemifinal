const features = [
  {
    icon: '🚀',
    title: 'شحن سريع',
    description: 'توصيل خلال 1-3 أيام',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: '🛡️',
    title: 'دفع آمن',
    description: 'حماية كاملة لمعلوماتك',
    gradient: 'from-green-500 to-emerald-400',
  },
  {
    icon: '💰',
    title: 'أفضل الأسعار',
    description: 'عروض وخصومات مميزة',
    gradient: 'from-yellow-500 to-orange-400',
  },
  {
    icon: '📦',
    title: 'تشكيلة واسعة',
    description: 'آلاف المنتجات المتنوعة',
    gradient: 'from-purple-500 to-pink-400',
  },
]

export default function Features() {
  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center text-center p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-1 sm:hover:-translate-y-2"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl transition-opacity`}></div>
              
              {/* Icon */}
              <div className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 relative">{feature.title}</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 relative">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


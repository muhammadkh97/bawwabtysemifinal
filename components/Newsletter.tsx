export default function Newsletter() {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)' }}>
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            احصل على خصم 
            <span className="block text-yellow-300 mt-2">20% على أول طلب!</span>
          </h2>
          <p className="text-2xl mb-8 text-purple-100">
            استخدم كود 
            <span className="font-mono font-bold bg-white/20 px-4 py-2 rounded-lg mx-2">WELCOME20</span>
            عند الدفع
          </p>
          
          <a
            href="/products"
            className="inline-flex items-center gap-3 px-12 py-5 bg-white text-purple-600 rounded-2xl hover:bg-yellow-300 hover:text-purple-700 transition-all font-bold text-xl shadow-2xl transform hover:scale-105"
          >
            <span>تسوق الآن</span>
            <span className="text-2xl">🛍️</span>
          </a>
        </div>
      </div>
    </section>
  )
}


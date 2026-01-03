import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
// import Categories from '@/components/Categories'
import NearbyRestaurants from '@/components/NearbyRestaurants'
import FeaturedProducts from '@/components/FeaturedProducts'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      {/* <Categories /> */}
      <NearbyRestaurants />
      <FeaturedProducts />
      <Newsletter />
      <Footer />
    </main>
  )
}


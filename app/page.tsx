import Header from '@/components/Header'
import DynamicHero from '@/components/DynamicHero'
import Features from '@/components/Features'
import BestDeals from '@/components/BestDeals'
import NearbyRestaurants from '@/components/NearbyRestaurants'
import FeaturedProducts from '@/components/FeaturedProducts'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <Header />
      <DynamicHero />
      <Features />
      <BestDeals />
      <NearbyRestaurants />
      <FeaturedProducts />
      <Newsletter />
      <Footer />
    </main>
  )
}


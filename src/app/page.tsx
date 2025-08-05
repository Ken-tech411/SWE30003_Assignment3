import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedSection } from "@/components/animated-section"
import {ShoppingCart, Package, RefreshCw, CreditCard, Truck, Upload, Shield } from "lucide-react"
import Image from "next/image"
import FeaturedProducts from "@/components/featured-products"
import BestSellingProducts from "@/components/best-selling-products"
import PromoSection from "@/components/promo-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - ENSURE LOW Z-INDEX */}
      <div className="relative bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 text-white overflow-hidden" style={{ zIndex: 1 }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Large White Wave Streaks - Similar to Long Chau */}
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <path d="M50,200 Q150,100 250,200 T450,200" stroke="white" strokeWidth="40" fill="none" opacity="0.3" />
              <path d="M0,250 Q100,150 200,250 T400,250" stroke="white" strokeWidth="30" fill="none" opacity="0.2" />
            </svg>
          </div>

          {/* Left side wave streak */}
          <div className="absolute bottom-0 left-0 w-80 h-80 opacity-15">
            <svg viewBox="0 0 300 300" className="w-full h-full">
              <path d="M-50,150 Q50,50 150,150 T350,150" stroke="white" strokeWidth="35" fill="none" opacity="0.4" />
            </svg>
          </div>

          {/* Curved background elements */}
          <div className="absolute top-1/4 right-1/6 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/6 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl"></div>

          {/* Floating Pills Animation */}
          <div
            className="absolute top-20 left-10 w-8 h-8 bg-white/10 rounded-full animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          ></div>
          <div
            className="absolute top-40 right-20 w-6 h-6 bg-orange-400/20 rounded-full animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          ></div>
          <div
            className="absolute bottom-32 left-20 w-10 h-10 bg-green-400/15 rounded-full animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          ></div>
          <div
            className="absolute top-60 left-1/4 w-4 h-4 bg-white/15 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
          ></div>
          <div
            className="absolute bottom-40 right-1/3 w-7 h-7 bg-orange-400/10 rounded-full animate-bounce"
            style={{ animationDelay: "1.5s", animationDuration: "4.5s" }}
          ></div>

          {/* Medical Cross Icons */}
          <div className="absolute top-1/3 left-1/6 text-white/10 animate-pulse" style={{ animationDelay: "2s" }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H5a1 1 0 0 0 0 2h2v4H5a1 1 0 0 0 0 2h2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2h2a1 1 0 0 0 0-2h-2v-4h2a1 1 0 0 0 0-2zM9 6h6v12H9V6z" />
            </svg>
          </div>
          <div
            className="absolute bottom-1/3 right-1/6 text-green-400/20 animate-pulse"
            style={{ animationDelay: "3s" }}
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H5a1 1 0 0 0 0 2h2v4H5a1 1 0 0 0 0 2h2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2h2a1 1 0 0 0 0-2h-2v-4h2a1 1 0 0 0 0-2zM9 6h6v12H9V6z" />
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
                  LONG CHAU
                  <br />
                  <span className="text-blue-100 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    PHARMACY
                  </span>
                  <br />
                  <span className="text-white animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                    MANAGEMENT SYSTEM
                  </span>
                </h1>
                <p className="text-2xl mb-8 text-blue-100 animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                  FOR A HEALTHY LIFE
                </p>
              </div>
            </div>

            {/* Right Content - Enhanced Pharmacy Illustration */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative animate-float">
                {/* Main Pharmacy Building - Larger Rectangle Layout */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl w-full max-w-2xl transform hover:scale-105 transition-transform duration-300">
                  {/* Pharmacy Sign */}
                  <div className="text-center mb-8">
                    <div className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-xl mb-6 shadow-lg">
                      + PHARMACY +
                    </div>
                    <h3 className="text-blue-600 font-bold text-2xl mb-2">Long Chau</h3>
                    <p className="text-gray-600 text-base">Healthcare Solutions</p>
                  </div>

                  {/* Enhanced Pharmacy Shelves - Larger Horizontal Layout */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-center gap-4">
                      <div className="w-20 h-16 bg-gradient-to-b from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-green-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <div className="w-20 h-16 bg-gradient-to-b from-pink-100 to-pink-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-pink-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-cyan-500 rounded-xl"></div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-b from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl"></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Stats - Larger Horizontal Layout */}
                  <div className="flex justify-center gap-8">
                    <div className="bg-blue-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center min-w-[100px]">
                      <div className="text-blue-600 font-bold text-2xl mb-2">900+</div>
                      <div className="text-blue-800 text-sm font-medium">Products</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center min-w-[100px]">
                      <div className="text-green-600 font-bold text-2xl mb-2">24/7</div>
                      <div className="text-green-800 text-sm font-medium">Service</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center min-w-[100px]">
                      <div className="text-orange-600 font-bold text-2xl mb-2">50+</div>
                      <div className="text-orange-800 text-sm font-medium">Stores</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Floating Elements Around Pharmacy */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-400/20 rounded-full flex items-center justify-center animate-pulse backdrop-blur-sm">
                  <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>

                <div
                  className="absolute -bottom-8 -left-8 w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center animate-pulse backdrop-blur-sm"
                  style={{ animationDelay: "1s" }}
                >
                  <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 8h-2V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H5a1 1 0 0 0 0 2h2v4H5a1 1 0 0 0 0 2h2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2h2a1 1 0 0 0 0-2h-2v-4h2a1 1 0 0 0 0-2zM9 6h6v12H9V6z" />
                  </svg>
                </div>

                <div
                  className="absolute top-1/2 -right-12 w-16 h-16 bg-blue-400/20 rounded-full animate-bounce backdrop-blur-sm"
                  style={{ animationDelay: "0.5s" }}
                >
                  <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Additional floating medical icons */}
                <div
                  className="absolute top-0 left-0 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse"
                  style={{ animationDelay: "2s" }}
                >
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>

                <div
                  className="absolute bottom-0 right-0 w-14 h-14 bg-yellow-400/30 rounded-full animate-bounce"
                  style={{ animationDelay: "1.8s" }}
                >
                  <div className="w-full h-full bg-yellow-500 rounded-full"></div>
                </div>

                <div
                  className="absolute top-1/2 -left-10 w-12 h-12 bg-purple-400/20 rounded-full animate-bounce"
                  style={{ animationDelay: "1.2s" }}
                >
                  <div className="w-full h-full bg-purple-500 rounded-full"></div>
                </div>

                <div
                  className="absolute bottom-1/4 right-1/4 w-10 h-10 bg-pink-400/20 rounded-full animate-pulse"
                  style={{ animationDelay: "2.5s" }}
                >
                  <div className="w-full h-full bg-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Section */}
      <PromoSection />

      {/* About Section */}
      <AnimatedSection className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <AnimatedSection delay={200}>
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">ABOUT LONG CHAU</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection delay={400}>
                <div className="relative">
                  <Image
                    src="/pharmacy.jpg"
                    alt="Pharmacy interior"
                    width={700}
                    height={800}
                    className="rounded-xl shadow-lg"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm">Service</div>
                  </div>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={600}>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-2xl font-bold mb-4 text-blue-700">WHAT IS LONG CHAU?</h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Long Chau provides you and your family with comprehensive pharmacy services using the most advanced
                    healthcare solutions delivered by our team of licensed pharmacists and professional staff.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    With our strengths in smart medication management systems and experienced pharmacists, we offer a
                    distinctive healthcare experience with outstanding advantages including: professional consultation,
                    wide range of medications, fast delivery, and especially our convenient electronic prescription
                    management system.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Why Choose Us Section */}
      <AnimatedSection className="bg-gradient-to-r from-blue-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={200}>
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">Why Choose Long Chau?</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Truck className="w-12 h-12 text-blue-500" />,
                title: "Fast Delivery",
                description: "Quick and reliable delivery with real-time tracking",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
              },
              {
                icon: <Shield className="w-12 h-12 text-green-500" />,
                title: "Secure Payments",
                description: "Multiple payment options with bank-level security",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
              },
              {
                icon: <RefreshCw className="w-12 h-12 text-orange-500" />,
                title: "Easy Returns",
                description: "Hassle-free return and exchange process",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
              },
            ].map((item, index) => (
              <AnimatedSection key={index} delay={400 + index * 200}>
                <div
                  className={`bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-all duration-300 border-2 ${item.borderColor} hover:border-opacity-100 h-full`}
                >
                  <div
                    className={`w-20 h-20 ${item.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Best Selling Products Section */}
      <BestSellingProducts />

      {/* Services Section */}
      <AnimatedSection className="bg-white py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={200}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Services</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Comprehensive pharmacy management service with convenient ordering, payment, delivery and return
                systems, serving all your healthcare needs
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedSection delay={400}>
              <Card className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-500 mr-3 group-hover:text-blue-600" />
                    Shopping Cart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Manage your cart items, update quantities, and proceed to checkout seamlessly.
                  </p>
                  <Link href="/cart">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium">
                      View Cart
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={500}>
              <Card className="border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Upload className="w-6 h-6 text-orange-500 mr-3 group-hover:text-orange-600" />
                    Upload Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Upload your prescription and let our pharmacists prepare your medications quickly and accurately.
                  </p>
                  <Link href="/prescription">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">
                      Upload Prescription
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={600}>
              <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <CreditCard className="w-6 h-6 text-green-500 mr-3 group-hover:text-green-600" />
                    Purchase & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Complete your purchase with our secure payment system and multiple payment options.
                  </p>
                  <Link href="/purchase">
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium">
                      Start Checkout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={700}>
              <Card className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Package className="w-6 h-6 text-blue-500 mr-3 group-hover:text-blue-600" />
                    Delivery Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Track your deliveries and manage delivery operations for both customers and staff.
                  </p>
                  <Link href="/delivery">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium">
                      Manage Deliveries
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={800}>
              <Card className="border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <RefreshCw className="w-6 h-6 text-orange-500 mr-3 group-hover:text-orange-600" />
                    Returns & Exchanges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Handle return requests and exchanges with our comprehensive return management system.
                  </p>
                  <Link href="/returns">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">
                      Manage Returns
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection delay={900}>
              <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 group h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Truck className="w-6 h-6 text-green-500 mr-3 group-hover:text-green-600" />
                    Track Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Real-time tracking of your delivery with detailed timeline and current location.
                  </p>
                  <Link href="/delivery/track">
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium">
                      Track Package
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer Section */}
      <Footer />
    </div>
  )
}
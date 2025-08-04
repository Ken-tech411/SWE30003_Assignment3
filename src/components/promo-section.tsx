'use client'

import { useState, useEffect } from 'react'
import { AnimatedSection } from "@/components/animated-section"
import { ChevronLeft, ChevronRight, Gift, Star, Clock, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PromoSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const promoSlides = [
    {
      id: 1,
      title: "HEALTH CHECK PROGRAM",
      subtitle: "MEMORY & CONCENTRATION SCREENING",
      description: "Free brain health screening program by VIETNAM COGNITIVE DISORDERS ASSOCIATION",
      discount: "SPECIAL OFFER",
      discountValue: "$10 OFF",
      bgGradient: "from-blue-600 via-blue-500 to-indigo-600",
      buttonText: "CHECK NOW",
      icon: <Star className="w-8 h-8" />
    },
    {
      id: 2,
      title: "HERBAL MEDICINE",
      subtitle: "BLOOD TONIC",
      description: "Authentic UK Products",
      discount: "Up to",
      discountValue: "20% OFF",
      bgGradient: "from-pink-500 via-red-500 to-orange-500",
      buttonText: "Shop Now",
      icon: <Gift className="w-8 h-8" />
    },
    {
      id: 3,
      title: "CANCER GUIDE A-Z",
      subtitle: "Information compiled and reviewed",
      description: "by our team of medical experts",
      discount: "FREE",
      discountValue: "100%",
      bgGradient: "from-purple-600 via-purple-500 to-blue-600",
      buttonText: "LEARN MORE",
      icon: <Clock className="w-8 h-8" />
    },
    {
      id: 4,
      title: "FAMILY CARE",
      subtitle: "Family Health Package",
      description: "Comprehensive healthcare for your entire family",
      discount: "Starting from",
      discountValue: "$29/month",
      bgGradient: "from-orange-500 via-red-500 to-pink-500",
      buttonText: "SUBSCRIBE NOW",
      icon: <ShoppingCart className="w-8 h-8" />
    }
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [promoSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <AnimatedSection className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Main Promo Banner */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-6">
          <div className="flex transition-transform duration-500 ease-in-out"
               style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {promoSlides.map((slide, index) => (
              <div key={slide.id} className={`min-w-full bg-gradient-to-r ${slide.bgGradient} relative`}>
                <div className="flex items-center justify-between px-8 py-12 text-white min-h-[300px]">
                  {/* Left Content */}
                  <div className="flex-1 z-10">
                    <div className="flex items-center mb-4">
                      <div className="bg-white/20 p-3 rounded-full mr-4">
                        {slide.icon}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
                        <h3 className="text-xl font-semibold mb-2">{slide.subtitle}</h3>
                      </div>
                    </div>
                    
                    <p className="text-lg mb-6 text-white/90 max-w-md">
                      {slide.description}
                    </p>
                    
                    <Button 
                      className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      {slide.buttonText} ▶
                    </Button>
                  </div>

                  {/* Right Content - Discount Badge */}
                  <div className="flex-1 flex justify-end items-center">
                    <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-3xl p-8 text-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <div className="text-sm font-medium mb-2">{slide.discount}</div>
                      <div className="text-4xl font-bold mb-2">{slide.discountValue}</div>
                      <div className="text-sm opacity-90">Special Opportunity</div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {promoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Secondary Promo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Health Check Card */}
          <AnimatedSection delay={200}>
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 p-2 rounded-lg mr-3">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">QUICK HEALTH CHECK</h3>
                    <p className="text-sm opacity-90">Free home service</p>
                  </div>
                </div>
                <Button className="bg-white text-teal-600 hover:bg-gray-100 font-semibold">
                  Book Now
                </Button>
              </div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>
            </div>
          </AnimatedSection>

          {/* Membership Card */}
          <AnimatedSection delay={400}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 p-2 rounded-lg mr-3">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">GOLD MEMBERSHIP</h3>
                    <p className="text-sm opacity-90">15% off all orders</p>
                  </div>
                </div>
                <Button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold">
                  Join VIP
                </Button>
              </div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </AnimatedSection>
  );
}
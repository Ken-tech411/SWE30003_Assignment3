'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatedSection } from "@/components/animated-section"
import { ChevronLeft, ChevronRight, Gift, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"


export default function PromoSection() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const promoSlides = [
    {
      id: 1,
      title: "VITAMIN & SUPPLEMENTS",
      subtitle: "IMMUNE SUPPORT COLLECTION",
      description: "Boost your immunity with our premium vitamins, multivitamins, and essential supplements",
      discount: "IMMUNITY BOOST",
      discountValue: "BY 25%",
      bgGradient: "from-green-600 via-green-500 to-emerald-600",
      buttonText: "SHOP SUPPLEMENTS",
      icon: <Star className="w-8 h-8" />,
      category: "Supplement"
    },
    {
      id: 2,
      title: "PRESCRIPTION MEDICINE",
      subtitle: "PAIN RELIEF & WELLNESS",
      description: "Professional medications including acarbose, ibuprofen, and specialized treatments",
      discount: "SPECIAL",
      discountValue: "RX READY",
      bgGradient: "from-red-500 via-red-500 to-orange-500",
      buttonText: "VIEW MEDICINES",
      icon: <Gift className="w-8 h-8" />,
      category: "Medicine"
    },
    {
      id: 3,
      title: "MEDICAL DEVICES",
      subtitle: "DIGITAL HEALTH MONITORING",
      description: "Acetaminophen, brimonidine tartrate, cantaloupe for home care",
      discount: "NEW ARRIVAL",
      discountValue: "IN STOCK",
      bgGradient: "from-blue-600 via-blue-500 to-indigo-600",
      buttonText: "SHOP DEVICES",
      icon: <Clock className="w-8 h-8" />,
      category: "Device"
    },
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

  // Remove authentication requirement - let users access products page
  const handleButtonClick = (category: string) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <AnimatedSection className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Main Promo Banner */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-6">
            <div className="flex transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {promoSlides.map((slide) => (
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
                        onClick={() => handleButtonClick(slide.category)}
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
                      <p className="text-sm opacity-90">Free prescription service</p>
                    </div>
                  </div>
                  <Link href="/prescription">
                    <Button className="bg-white text-teal-600 hover:bg-gray-100 font-semibold">
                      Upload Prescription Now
                    </Button>
                  </Link>
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
                      <h3 className="font-bold text-lg">MEMBERSHIP</h3>
                      <p className="text-sm opacity-90">Exclusive benefits & discounts</p>
                    </div>
                  </div>
                  <Link href="/login">
                    <Button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold">
                      Join VIP
                    </Button>
                  </Link>
                </div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
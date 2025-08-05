import Link from "next/link"
import Image from "next/image"
import { AnimatedSection } from "@/components/animated-section"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export function Footer() {
  return (
    <AnimatedSection>
      <footer className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16"> 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto"> 
            {/* Company Info */}
            <AnimatedSection delay={200}>
              <div className="space-y-6 h-full flex flex-col md:text-left"> 
                <div className="flex items-center space-x-3 justify-center md:justify-start">
                  <Image
                    src="/logo.png"
                    alt="Long Chau Logo"
                    width={80}
                    height={32}
                    className="object-contain"
                  />
                  <div>
                    <h3 className="text-xl font-bold">Long Chau</h3>
                    <p className="text-blue-100 text-sm">Pharmacy Management</p>
                  </div>
                </div>
                <p className="text-blue-100 leading-relaxed flex-grow">
                  Your trusted pharmacy partner providing comprehensive healthcare solutions with professional service
                  and advanced technology.
                </p>
              </div>
            </AnimatedSection>

            {/* Our Services */}
            <AnimatedSection delay={400}>
              <div className="space-y-6 h-full pl-16"> 
                <h4 className="text-lg font-semibold">Our Services</h4>
                <ul className="grid grid-cols-1 gap-3"> 
                  <li>
                    <Link href="/prescription" className="text-blue-100 hover:text-white transition-colors">
                      Upload Prescription
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="text-blue-100 hover:text-white transition-colors">
                      Shopping Cart
                    </Link>
                  </li>
                  <li>
                    <Link href="/delivery" className="text-blue-100 hover:text-white transition-colors">
                      Track Delivery
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="text-blue-100 hover:text-white transition-colors">
                      Returns & Exchanges
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className="text-blue-100 hover:text-white transition-colors">
                      Browse Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/purchase" className="text-blue-100 hover:text-white transition-colors">
                      Purchase & Payment
                    </Link>
                  </li>
                  <li>
                    <Link href="/feedback" className="text-blue-100 hover:text-white transition-colors">
                      Customer Feedback
                    </Link>
                  </li>
                  <li>
                    <Link href="/delivery/track" className="text-blue-100 hover:text-white transition-colors">
                      Track Package
                    </Link>
                  </li>
                  <li>
                    <Link href="/inventory" className="text-blue-100 hover:text-white transition-colors">
                      Inventory
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimatedSection>

            {/* Contact Info */}
            <AnimatedSection delay={600}>
              <div className="space-y-6 h-full md:text-left pl-16"> 
                <h4 className="text-lg font-semibold">Contact Us</h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 justify-start">
                    <MapPin className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-blue-100">A35 Bach Dang Street</p>
                      <p className="text-blue-100">HCM City, Vietnam</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-200 flex-shrink-0" />
                    <p className="text-blue-100">+84 343 580 927</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-200 flex-shrink-0" />
                    <p className="text-blue-100">info@longchau.com</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-200 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-blue-100">Mon - Fri: 8:00 AM - 10:00 PM</p>
                      <p className="text-blue-100">Sat - Sun: 9:00 AM - 9:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Bottom Section */}
          <AnimatedSection delay={1000}>
            <div className="border-t border-blue-400 mt-16 pt-8"> 
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-blue-100 text-sm">© 2025 Long Chau. All rights reserved.</div>
                <div className="flex space-x-6 text-sm">
                  <Link href="/privacy" className="text-blue-100 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-blue-100 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-blue-100 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </footer>
    </AnimatedSection>
  )
}
"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Search, ChevronDown, X, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import NavbarAuthButton from "./NavbarAuthButton"
import { useAuth } from '@/context/AuthContext'

interface Product {
  productId: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  requiresPrescription?: boolean;
}

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [dropdownTimer, setDropdownTimer] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth(); // Add this line to get the user

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory)
        setSearchHistory(Array.isArray(parsedHistory) ? parsedHistory : [])
      } catch (error) {
        console.error('Error parsing search history:', error)
        setSearchHistory([])
      }
    }
  }, [])

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
    }
  }, [searchHistory])

  // Handle clicks outside search area to hide dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add search term to history
  const addToSearchHistory = (searchTerm: string) => {
    const trimmedTerm = searchTerm.trim()
    if (!trimmedTerm) return
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedTerm.toLowerCase())
      return [trimmedTerm, ...filtered].slice(0, 10)
    })
  }

  // Remove item from search history
  const removeFromSearchHistory = (indexToRemove: number) => {
    setSearchHistory(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  // Clear all search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // Handle search history item click
  const handleHistoryItemClick = (historyItem: string) => {
    setSearchQuery(historyItem)
    setShowSearchHistory(false)
    window.location.href = `/products?search=${encodeURIComponent(historyItem)}&t=${Date.now()}`
  }

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchHistory.length > 0) {
      setShowSearchHistory(true)
    }
  }

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (e.target.value.trim() === '' && searchHistory.length > 0) {
      setShowSearchHistory(true)
    } else {
      setShowSearchHistory(false)
    }
  }

  // Fetch products from database - NO MOCK DATA
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error(`API responded with status: ${response.status}`)
        const data = await response.json()
        let apiProducts: Product[] = []
        if (data && data.products && Array.isArray(data.products)) {
          apiProducts = data.products
        } else if (data && Array.isArray(data)) {
          apiProducts = data
        } else {
          setProducts([])
          return
        }
        const validatedProducts = apiProducts.map((product: unknown) => {
          const productData = product as Record<string, unknown>;
          return {
            productId: Number(productData.productId || productData.id),
            name: String(productData.name || 'Unknown Product'),
            description: String(productData.description || ''),
            price: typeof productData.price === 'string' ? parseFloat(productData.price) : (Number(productData.price) || 0),
            category: String(productData.category || 'uncategorized'),
            requiresPrescription: Boolean(productData.requiresPrescription || false)
          };
        }).filter(product => product.name !== 'Unknown Product')
        setProducts(validatedProducts)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Get products by category from real database data
  const getProductsByCategory = (categoryId: string) => {
    if (products.length === 0) return []
    const searchCategory = categoryId.toLowerCase().trim()
    const filtered = products.filter(product => {
      const productCategory = (product.category || '').toLowerCase().trim()
      return productCategory === searchCategory ||
        productCategory.includes(searchCategory) ||
        searchCategory.includes(productCategory)
    })
    return filtered.slice(0, 6)
  }

  // Search handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery.trim())
      setShowSearchHistory(false)
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}&t=${Date.now()}`
    } else {
      window.location.href = '/products'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as React.FormEvent)
    } else if (e.key === 'Escape') {
      setShowSearchHistory(false)
    }
  }

  // Handle product click to search for that product
  const handleProductClick = (productName: string) => {
    addToSearchHistory(productName)
    setSearchQuery(productName)
    setShowProductDropdown(false)
    setShowSearchHistory(false)
    window.location.href = `/products?search=${encodeURIComponent(productName)}&t=${Date.now()}`
  }

  // Dropdown handlers
  const handleMouseEnterDropdown = () => {
    if (dropdownTimer) {
      clearTimeout(dropdownTimer)
      setDropdownTimer(null)
    }
    setShowProductDropdown(true)
  }

  const handleMouseLeaveDropdown = () => {
    const timer = setTimeout(() => {
      setShowProductDropdown(false)
    }, 300)
    setDropdownTimer(timer)
  }

  const categories = [
    {
      id: 'supplement',
      name: 'Supplement',
      description: 'Vitamins & nutritional supplements',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      hoverColor: 'hover:bg-green-100'
    },
    {
      id: 'medicine',
      name: 'Medicine',
      description: 'Prescription & OTC medications',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      hoverColor: 'hover:bg-red-100'
    },
    {
      id: 'device',
      name: 'Device',
      description: 'Medical devices & equipment',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      hoverColor: 'hover:bg-blue-100'
    }
  ]

  return (
    <div className="sticky top-0 z-[100] bg-white shadow-md">
      {/* Main Navigation - Make sticky */}
      <nav className="bg-blue-500 shadow-sm border-b relative z-[101]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 py-2">
            {/* Logo - Smaller */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Long Chau Pharmacy Logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-white">Long Chau</span>
                  <span className="text-sm text-white/90">Pharmacy Management</span>
                </div>
              </Link>
            </div>

            {/* Search Bar - Smaller */}
            <div className="flex-1 max-w-4xl mx-16" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative bg-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 transition-colors group-hover:text-blue-500" />
                  <Input
                    placeholder="Search for medicines, health products..."
                    className="pl-12 pr-8 h-12 w-full rounded-full border-0 focus:border-0 focus:ring-0 text-base bg-white shadow-none text-gray-700 placeholder-gray-400 outline-none focus:outline-none hover:bg-gray-50 transition-all duration-300 focus:bg-white focus:shadow-lg focus:scale-105"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={handleSearchFocus}
                  />
                </div>

                {/* Search History Dropdown */}
                {showSearchHistory && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-[999999] max-h-96 overflow-y-auto">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Search History</span>
                        </div>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Delete All
                        </button>
                      </div>

                      {/* History Items */}
                      <div className="space-y-1">
                        {searchHistory.map((historyItem, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between group hover:bg-gray-50 rounded-lg p-2 cursor-pointer"
                            onClick={() => handleHistoryItemClick(historyItem)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 group-hover:text-blue-600">
                                {historyItem}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromSearchHistory(index)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Actions - Smaller */}
            <div className="flex items-center space-x-6">
              <Link href="/cart" className="flex items-center space-x-2 text-white hover:text-blue-100 whitespace-nowrap font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:shadow-md transform hover:scale-105 group">
                <ShoppingCart className="w-5 h-5 group-hover:text-blue-100 transition-colors" />
                <span className="text-base font-medium">Cart</span>
              </Link>
              {/* Use your auth button if logged in, else show Sign In */}
              <NavbarAuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Services Navigation - Part of sticky container */}
      <div className="bg-white relative z-[50]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 py-2 overflow-x-auto">

            <Link href="/prescription" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 text-sm">
              <span>Upload Prescription</span>
            </Link>

            {/* Products Dropdown */}
            <div
              className="relative z-[60]"
              onMouseEnter={handleMouseEnterDropdown}
              onMouseLeave={handleMouseLeaveDropdown}
            >
              <button className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 text-sm">
                <span>Products</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu - Adjust positioning for sticky navbar */}
              {showProductDropdown && (
                <div
                  className="fixed bg-white rounded-lg shadow-2xl border w-[800px]"
                  style={{
                    zIndex: 100000,
                    top: '120px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                  onMouseEnter={handleMouseEnterDropdown}
                  onMouseLeave={handleMouseLeaveDropdown}
                >
                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <div className="text-gray-500">Loading products...</div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-6">
                          {categories.map((category) => {
                            const categoryProducts = getProductsByCategory(category.id)
                            return (
                              <div key={category.id} className="space-y-4">
                                {/* Category Header */}
                                <div className={`${category.bgColor} rounded-lg p-4`}>
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-8 h-8 ${category.bgColor} border-2 border-current ${category.textColor} rounded-lg flex items-center justify-center`}>
                                      <span className="font-bold text-sm">
                                        {category.name.charAt(0)}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className={`font-semibold ${category.textColor}`}>
                                        {category.name}
                                      </h3>
                                      <p className="text-xs text-gray-600">
                                        {category.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {/* Popular Products - MADE CLICKABLE */}
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Popular Products</div>
                                  {categoryProducts.length > 0 ? (
                                    categoryProducts.map((product) => (
                                      <button
                                        key={product.productId}
                                        onClick={() => handleProductClick(product.name)}
                                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline hover:bg-blue-50 rounded px-2 py-1 transition-colors truncate"
                                      >
                                        {product.name}
                                        {product.requiresPrescription && (
                                          <span className="ml-1 text-xs text-red-500 font-medium">Rx</span>
                                        )}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">
                                      No products available
                                    </div>
                                  )}
                                </div>
                                {/* View All Link */}
                                <Link
                                  href={`/products?category=${encodeURIComponent(category.name)}`}
                                  className={`block text-sm font-medium ${category.textColor} ${category.hoverColor} px-3 py-2 rounded-md transition-colors`}
                                  onClick={() => setShowProductDropdown(false)}
                                >
                                  View All {category.name} →
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                        {/* Bottom Section */}
                        <div className="border-t pt-4 mt-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {products.length > 0 ? (
                                `Discover over ${products.length} healthcare products`
                              ) : (
                                'No products available at the moment'
                              )}
                            </div>
                            <Link
                              href="/products"
                              className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
                              onClick={() => setShowProductDropdown(false)}
                            >
                              Browse All Products
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Other Navigation Links - Smaller */}
            <Link href="/delivery" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 text-sm">
              <span>Track Delivery</span>
            </Link>
            <Link href="/returns" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 group text-sm">
              <span>Returns & Exchanges</span>
            </Link>
            <Link href="/feedback" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 group text-sm">
              <span>Feedback</span>
            </Link>
            {/* Inventory - Only show for pharmacists and admins */}
            {user && (user.role === "pharmacist" || user.role === "admin") && (
              <Link href="/inventory" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 whitespace-nowrap font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 hover:shadow-md transform hover:scale-105 text-sm">
                <span>Inventory</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
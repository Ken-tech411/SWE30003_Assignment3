"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus } from "lucide-react"
import Image from "next/image"

interface Product {
  productId: number
  name: string
  description: string
  price: number
  category: string
  requiresPrescription: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // This is a function you call when the user clicks "Add to Cart"
  const handleAddToCart = async (productId: number, quantity: number) => {
    // Get customerId from localStorage (set in purchase/cart page)
    const customerId = localStorage.getItem("customerId")
    if (!customerId) {
      alert("No customer session found. Please refresh the page.");
      return;
    }

    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: Number(customerId),
        productId,
        quantity
      })
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        <Button variant="outline" onClick={() => window.location.href = '/cart'}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.productId} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Product Image</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.requiresPrescription && (
                    <Badge variant="destructive" className="text-xs">
                      Rx Required
                    </Badge>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleAddToCart(product.productId, 1)}
                  disabled={product.requiresPrescription}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {product.requiresPrescription ? 'Prescription Required' : 'Add to Cart'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available</p>
        </div>
      )}
    </div>
  )
}
